import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  generatePortalToken,
  generateReservationCode,
  logAudit,
  requireRole,
  requireUser,
} from "./lib/access";
import { assertSlotFree } from "./bookings";

/**
 * Mock Channex.io adapter.
 *
 * The `channelRequests.payload` shape mirrors a Channex booking webhook so
 * that swapping in the real integration later only means: register a real
 * webhook (convex/http.ts) that inserts into `channelRequests`, and push
 * availability updates back through the Channex REST API. Nothing else in
 * the app changes — the inbox, accept/reject flow and calendar stay as-is.
 */

const SOURCE_BY_TYPE = {
  booking_com: "booking_com",
  airbnb: "airbnb",
  expedia: "expedia",
  hostelworld: "hostelworld",
} as const;

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const channels = await ctx.db.query("channels").collect();
    const pending = await ctx.db
      .query("channelRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return channels.map((c) => ({
      ...c,
      pendingCount: pending.filter((r) => r.channelId === c._id).length,
    }));
  },
});

export const requests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const rows = args.status
      ? await ctx.db
          .query("channelRequests")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(100)
      : await ctx.db.query("channelRequests").order("desc").take(100);
    const channels = await ctx.db.query("channels").collect();
    const byId = new Map(channels.map((c) => [c._id, c]));
    return rows.map((r) => ({
      ...r,
      channelName: byId.get(r.channelId)?.name ?? "Unknown",
      channelType: byId.get(r.channelId)?.type,
    }));
  },
});

/** Dev/mock helper: fabricate an incoming OTA booking request. */
export const simulateIncoming = mutation({
  args: {
    channelId: v.id("channels"),
    payload: v.object({
      ota_reservation_code: v.string(),
      guest_name: v.string(),
      guest_email: v.optional(v.string()),
      guest_country: v.optional(v.string()),
      arrival_date: v.string(),
      departure_date: v.string(),
      room_type: v.string(),
      occupancy: v.number(),
      total_price: v.number(),
      currency: v.string(),
      notes: v.optional(v.string()),
    }),
    type: v.optional(
      v.union(
        v.literal("new_booking"),
        v.literal("modification"),
        v.literal("cancellation"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    const id = await ctx.db.insert("channelRequests", {
      channelId: args.channelId,
      type: args.type ?? "new_booking",
      payload: args.payload,
      status: "pending",
    });
    await ctx.db.patch(args.channelId, { lastSyncAt: Date.now() });
    await logAudit(ctx, actor, {
      action: "channel.simulateIncoming",
      entity: "channelRequests",
      entityId: id,
      summary: `Simulated ${args.payload.guest_name} request from channel`,
      after: args.payload,
    });
    return id;
  },
});

export const accept = mutation({
  args: {
    requestId: v.id("channelRequests"),
    roomId: v.id("rooms"),
    bedId: v.optional(v.id("beds")),
  },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "pending") throw new Error("Already resolved");
    const channel = await ctx.db.get(request.channelId);
    const p = request.payload;

    if (request.type === "cancellation") {
      // Find the linked booking by OTA code and cancel it.
      const bookings = await ctx.db.query("bookings").collect();
      const match = bookings.find(
        (b) => b.channelBookingId === p.ota_reservation_code,
      );
      if (match) await ctx.db.patch(match._id, { status: "cancelled" });
      await ctx.db.patch(args.requestId, {
        status: "accepted",
        resolvedBy: actor._id,
        linkedBookingId: match?._id,
      });
      await logAudit(ctx, actor, {
        action: "channel.acceptCancellation",
        entity: "channelRequests",
        entityId: args.requestId,
        summary: `Accepted cancellation of ${p.ota_reservation_code} (${p.guest_name})`,
      });
      return match?._id;
    }

    await assertSlotFree(
      ctx,
      args.roomId,
      args.bedId,
      p.arrival_date,
      p.departure_date,
    );

    const guestId = await ctx.db.insert("guests", {
      fullName: p.guest_name,
      email: p.guest_email,
      country: p.guest_country,
    });
    const bookingId = await ctx.db.insert("bookings", {
      guestId,
      roomId: args.roomId,
      bedId: args.bedId,
      checkIn: p.arrival_date,
      checkOut: p.departure_date,
      status: "confirmed",
      source: channel ? SOURCE_BY_TYPE[channel.type] : "direct",
      channelBookingId: p.ota_reservation_code,
      adults: p.occupancy,
      children: 0,
      totalAmount: p.total_price,
      currency: p.currency,
      notes: p.notes,
      createdBy: actor._id,
      portalToken: generatePortalToken(),
      reservationCode: generateReservationCode(),
    });
    await ctx.db.patch(args.requestId, {
      status: "accepted",
      resolvedBy: actor._id,
      linkedBookingId: bookingId,
    });
    await logAudit(ctx, actor, {
      action: "channel.accept",
      entity: "channelRequests",
      entityId: args.requestId,
      summary: `Accepted ${channel?.name ?? "OTA"} booking for ${p.guest_name}`,
      after: { bookingId },
    });
    return bookingId;
  },
});

export const reject = mutation({
  args: { requestId: v.id("channelRequests"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "pending") throw new Error("Already resolved");
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      resolvedBy: actor._id,
    });
    await logAudit(ctx, actor, {
      action: "channel.reject",
      entity: "channelRequests",
      entityId: args.requestId,
      summary: `Rejected ${request.payload.guest_name} (${request.payload.ota_reservation_code})${args.reason ? `: ${args.reason}` : ""}`,
    });
  },
});

export const upsertChannel = mutation({
  args: {
    id: v.optional(v.id("channels")),
    name: v.string(),
    type: v.union(
      v.literal("booking_com"),
      v.literal("airbnb"),
      v.literal("expedia"),
      v.literal("hostelworld"),
    ),
    status: v.union(
      v.literal("connected"),
      v.literal("mock"),
      v.literal("error"),
      v.literal("disabled"),
    ),
  },
  handler: async (ctx, { id, ...fields }) => {
    const actor = await requireRole(ctx, "manager");
    if (id) {
      const before = await ctx.db.get(id);
      await ctx.db.patch(id, fields);
      await logAudit(ctx, actor, {
        action: "channel.update",
        entity: "channels",
        entityId: id,
        summary: `Updated channel "${fields.name}"`,
        before,
        after: fields,
      });
      return id;
    }
    const newId = await ctx.db.insert("channels", fields);
    await logAudit(ctx, actor, {
      action: "channel.create",
      entity: "channels",
      entityId: newId,
      summary: `Connected channel "${fields.name}"`,
      after: fields,
    });
    return newId;
  },
});
