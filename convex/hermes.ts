import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { phonesMatch } from "./lib/access";

/**
 * Hermes agent integration.
 *
 * Hermes (the messaging agent handling WhatsApp/phone requests) verifies a
 * guest by RESERVATION CODE + PHONE NUMBER before acting on their behalf.
 * Exposed over HTTP at POST /hermes/verify (see convex/http.ts), protected
 * by the HERMES_API_KEY deployment env var.
 *
 * Every attempt — success or failure — lands in the audit log.
 */
export const verify = internalMutation({
  args: {
    phone: v.string(),
    reservationCode: v.string(),
  },
  handler: async (ctx, args) => {
    const code = args.reservationCode.trim().toUpperCase();
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reservationCode", (q) => q.eq("reservationCode", code))
      .unique();

    const fail = async (reason: string) => {
      await ctx.db.insert("auditLogs", {
        actorName: "Hermes agent",
        action: "hermes.verifyFailed",
        entity: "bookings",
        summary: `Failed guest verification (${reason}) — code ${code}, phone ${args.phone}`,
      });
      return { verified: false as const };
    };

    if (!booking || booking.status === "cancelled") {
      return await fail(booking ? "cancelled booking" : "unknown code");
    }
    const guest = await ctx.db.get(booking.guestId);
    if (!guest?.phone || !phonesMatch(guest.phone, args.phone)) {
      return await fail("phone mismatch");
    }

    const [room, payments] = await Promise.all([
      ctx.db.get(booking.roomId),
      ctx.db
        .query("payments")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .collect(),
    ]);
    const bed = booking.bedId ? await ctx.db.get(booking.bedId) : null;
    const paid = payments.reduce(
      (sum, p) => sum + (p.direction === "in" ? p.amount : -p.amount),
      0,
    );

    await ctx.db.insert("auditLogs", {
      actorName: "Hermes agent",
      action: "hermes.verify",
      entity: "bookings",
      entityId: booking._id,
      summary: `Verified ${guest.fullName} by phone + code ${code}`,
    });

    return {
      verified: true as const,
      guest: {
        fullName: guest.fullName,
        surfLevel: guest.surfLevel ?? null,
        allergies: guest.allergies ?? null,
      },
      booking: {
        reservationCode: code,
        status: booking.status,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        room: room?.name ?? null,
        bed: bed?.label ?? null,
        adults: booking.adults,
        children: booking.children,
        totalAmount: booking.totalAmount,
        paid,
        balance: Math.round((booking.totalAmount - paid) * 100) / 100,
        currency: booking.currency,
        portalToken: booking.portalToken,
      },
    };
  },
});
