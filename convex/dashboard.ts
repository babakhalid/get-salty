import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/access";

export const overview = query({
  args: { today: v.string(), monthStart: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { today, monthStart } = args;

    const [bookings, rooms, beds, roomTypes, payments, pendingRequests, pendingGuestRequests] =
      await Promise.all([
        ctx.db.query("bookings").collect(),
        ctx.db.query("rooms").collect(),
        ctx.db.query("beds").collect(),
        ctx.db.query("roomTypes").collect(),
        ctx.db.query("payments").collect(),
        ctx.db
          .query("channelRequests")
          .withIndex("by_status", (q) => q.eq("status", "pending"))
          .collect(),
        ctx.db
          .query("guestRequests")
          .withIndex("by_status", (q) => q.eq("status", "pending"))
          .collect(),
      ]);

    const active = bookings.filter(
      (b) => b.status !== "cancelled" && b.status !== "no_show",
    );

    const arrivals = active.filter((b) => b.checkIn === today);
    const departures = active.filter((b) => b.checkOut === today);
    const inHouse = active.filter(
      (b) => b.checkIn <= today && b.checkOut > today,
    );

    // Sellable units tonight: dorm beds count individually, private rooms once
    const typeById = new Map(roomTypes.map((t) => [t._id, t]));
    const sellableUnits = rooms
      .filter((r) => r.status === "available")
      .reduce((n, room) => {
        const type = typeById.get(room.roomTypeId);
        if (type?.mode === "dorm") {
          return n + beds.filter((b) => b.roomId === room._id).length;
        }
        return n + 1;
      }, 0);
    const occupiedUnits = inHouse.length;

    const revenueMtd = payments
      .filter((p) => p.date >= monthStart && p.date <= today)
      .reduce((sum, p) => sum + (p.direction === "in" ? p.amount : -p.amount), 0);

    // Guests + activity roster for today
    const arrivalDetails = await Promise.all(
      arrivals.map(async (b) => {
        const guest = await ctx.db.get(b.guestId);
        const room = await ctx.db.get(b.roomId);
        return {
          bookingId: b._id,
          guestName: guest?.fullName ?? "Unknown",
          roomName: room?.name ?? "",
          pax: b.adults + b.children,
          status: b.status,
        };
      }),
    );
    const departureDetails = await Promise.all(
      departures.map(async (b) => {
        const guest = await ctx.db.get(b.guestId);
        const room = await ctx.db.get(b.roomId);
        return {
          bookingId: b._id,
          guestName: guest?.fullName ?? "Unknown",
          roomName: room?.name ?? "",
          pax: b.adults + b.children,
          status: b.status,
        };
      }),
    );

    const todayActivities = await ctx.db
      .query("bookingActivities")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    const roster: Record<
      string,
      { name: string; color: string; startTime?: string; total: number }
    > = {};
    for (const item of todayActivities) {
      const booking = await ctx.db.get(item.bookingId);
      if (!booking || booking.status === "cancelled") continue;
      const activity = await ctx.db.get(item.activityId);
      if (!activity) continue;
      roster[item.activityId] ??= {
        name: activity.name,
        color: activity.color,
        startTime: activity.startTime,
        total: 0,
      };
      roster[item.activityId].total += item.participants;
    }

    return {
      arrivals: arrivalDetails,
      departures: departureDetails,
      guestsInHouse: inHouse.reduce((n, b) => n + b.adults + b.children, 0),
      occupancy:
        sellableUnits === 0 ? 0 : Math.round((occupiedUnits / sellableUnits) * 100),
      occupiedUnits,
      sellableUnits,
      revenueMtd,
      pendingChannelRequests: pendingRequests.length,
      pendingGuestRequests: pendingGuestRequests.length,
      activityRoster: Object.values(roster).sort((a, b) =>
        (a.startTime ?? "99").localeCompare(b.startTime ?? "99"),
      ),
    };
  },
});
