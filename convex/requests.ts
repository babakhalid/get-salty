import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/access";

/** All guest requests (portal orders, requirements, transfer declarations),
 *  newest first, enriched for the central Requests page. */
export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("declined")),
    ),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const rows = args.status
      ? await ctx.db
          .query("guestRequests")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(300)
      : await ctx.db.query("guestRequests").order("desc").take(300);

    const [activities, services, users] = await Promise.all([
      ctx.db.query("activities").collect(),
      ctx.db.query("services").collect(),
      ctx.db.query("users").collect(),
    ]);
    const activityById = new Map(activities.map((a) => [a._id, a]));
    const serviceById = new Map(services.map((s) => [s._id, s]));
    const userById = new Map(users.map((u) => [u._id, u]));

    const enriched = await Promise.all(
      rows.map(async (request) => {
        const booking = await ctx.db.get(request.bookingId);
        const guest = booking ? await ctx.db.get(booking.guestId) : null;
        const room = booking ? await ctx.db.get(booking.roomId) : null;
        const itemName = request.payload.activityId
          ? activityById.get(request.payload.activityId)?.name
          : request.payload.serviceId
            ? serviceById.get(request.payload.serviceId)?.name
            : undefined;
        const itemPrice = request.payload.activityId
          ? activityById.get(request.payload.activityId)?.price
          : request.payload.serviceId
            ? serviceById.get(request.payload.serviceId)?.price
            : undefined;
        return {
          _id: request._id,
          createdAt: request._creationTime,
          type: request.type,
          status: request.status,
          itemName,
          amount:
            itemPrice !== undefined
              ? itemPrice * (request.payload.qty ?? 1)
              : undefined,
          qty: request.payload.qty,
          date: request.payload.date,
          note: request.payload.note,
          guestName: guest?.fullName ?? "Unknown",
          roomName: room?.name ?? "—",
          reservationCode: booking?.reservationCode,
          bookingId: request.bookingId,
          bookingActive: !!booking && booking.status !== "cancelled",
          resolvedByName: request.resolvedBy
            ? (userById.get(request.resolvedBy)?.name ?? "Staff")
            : undefined,
        };
      }),
    );
    return enriched;
  },
});

export const pendingCount = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const pending = await ctx.db
      .query("guestRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return pending.length;
  },
});
