import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { surfLevelValidator } from "./schema";

/**
 * Guest portal — public, no auth. Every function is scoped strictly to the
 * booking matched by the unguessable portal token.
 */

async function bookingByToken(ctx: QueryCtx | MutationCtx, token: string) {
  const booking = await ctx.db
    .query("bookings")
    .withIndex("by_portalToken", (q) => q.eq("portalToken", token))
    .unique();
  if (!booking || booking.status === "cancelled") return null;
  return booking;
}

export const stay = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const booking = await bookingByToken(ctx, args.token);
    if (!booking) return null;
    const [guest, room] = await Promise.all([
      ctx.db.get(booking.guestId),
      ctx.db.get(booking.roomId),
    ]);
    const roomType = room ? await ctx.db.get(room.roomTypeId) : null;
    const [activities, services, myRequests, myActivities] = await Promise.all([
      ctx.db.query("activities").collect(),
      ctx.db.query("services").collect(),
      ctx.db
        .query("guestRequests")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .collect(),
      ctx.db
        .query("bookingActivities")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .collect(),
    ]);
    const activityById = new Map(activities.map((a) => [a._id, a]));
    return {
      guestName: guest?.fullName ?? "Guest",
      surfLevel: guest?.surfLevel,
      allergies: guest?.allergies,
      reservationCode: booking.reservationCode,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      roomName: room?.name,
      roomTypeName: roomType?.name,
      adults: booking.adults,
      children: booking.children,
      catalog: {
        activities: activities
          .filter((a) => a.active)
          .map((a) => ({
            _id: a._id,
            name: a.name,
            price: a.price,
            durationMin: a.durationMin,
            type: a.type,
          })),
        services: services
          .filter((s) => s.active)
          .map((s) => ({ _id: s._id, name: s.name, price: s.price, unit: s.unit })),
      },
      booked: myActivities.map((a) => ({
        name: activityById.get(a.activityId)?.name ?? "Activity",
        date: a.date,
        participants: a.participants,
      })),
      requests: myRequests.map((r) => ({
        _id: r._id,
        type: r.type,
        status: r.status,
        payload: {
          note: r.payload.note,
          qty: r.payload.qty,
          date: r.payload.date,
          activityName: r.payload.activityId
            ? (activityById.get(r.payload.activityId)?.name ?? "Activity")
            : undefined,
          serviceName: r.payload.serviceId
            ? (services.find((s) => s._id === r.payload.serviceId)?.name ??
              "Service")
            : undefined,
        },
      })),
    };
  },
});

export const updatePreferences = mutation({
  args: {
    token: v.string(),
    surfLevel: v.optional(surfLevelValidator),
    allergies: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await bookingByToken(ctx, args.token);
    if (!booking) throw new Error("Invalid link");
    const guest = await ctx.db.get(booking.guestId);
    if (!guest) throw new Error("Guest not found");

    const patch: Record<string, unknown> = {};
    if (args.surfLevel !== undefined) patch.surfLevel = args.surfLevel;
    if (args.allergies !== undefined) patch.allergies = args.allergies;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(booking.guestId, patch);
    }
    if (args.note) {
      await ctx.db.insert("guestRequests", {
        bookingId: booking._id,
        type: "requirement",
        payload: { note: args.note },
        status: "pending",
      });
    }
    await ctx.db.insert("auditLogs", {
      actorName: `Guest: ${guest.fullName}`,
      action: "portal.updatePreferences",
      entity: "guests",
      entityId: booking.guestId,
      summary: `${guest.fullName} updated preferences via portal`,
      before: { surfLevel: guest.surfLevel, allergies: guest.allergies },
      after: patch,
    });
  },
});

export const placeOrder = mutation({
  args: {
    token: v.string(),
    // A basket: guests can request several activities/services at once.
    items: v.array(
      v.object({
        activityId: v.optional(v.id("activities")),
        serviceId: v.optional(v.id("services")),
        qty: v.number(),
        date: v.optional(v.string()),
        note: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const booking = await bookingByToken(ctx, args.token);
    if (!booking) throw new Error("Invalid link");
    if (args.items.length === 0) throw new Error("Nothing selected");
    if (args.items.length > 15) throw new Error("Too many items in one request");
    const guest = await ctx.db.get(booking.guestId);

    const names: string[] = [];
    for (const item of args.items) {
      if (!item.activityId && !item.serviceId) throw new Error("Invalid item");
      if (item.qty < 1 || item.qty > 20) throw new Error("Invalid quantity");
      const doc = item.activityId
        ? await ctx.db.get(item.activityId)
        : await ctx.db.get(item.serviceId!);
      if (!doc) throw new Error("Item not found");
      names.push(`${doc.name} ×${item.qty}`);
      await ctx.db.insert("guestRequests", {
        bookingId: booking._id,
        type: "order",
        payload: {
          activityId: item.activityId,
          serviceId: item.serviceId,
          qty: item.qty,
          date: item.date,
          note: item.note,
        },
        status: "pending",
      });
    }

    await ctx.db.insert("auditLogs", {
      actorName: `Guest: ${guest?.fullName ?? "Unknown"}`,
      action: "portal.placeOrder",
      entity: "guestRequests",
      entityId: booking._id,
      summary: `${guest?.fullName} requested ${names.join(", ")} via portal`,
      after: { items: args.items },
    });
  },
});
