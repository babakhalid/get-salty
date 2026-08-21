import { internalMutation } from "./_generated/server";
import { generatePortalToken, generateReservationCode } from "./lib/access";
import type { Id } from "./_generated/dataModel";
import { CALENDAR_DATA } from "./_calendarData";

/**
 * Import the real Get Salty booking calendar from the owner's spreadsheet.
 * Replaces the placeholder rooms and demo bookings with the real 10 rooms,
 * every stay and every date block. Catalog (packages/activities/services),
 * team and users are left untouched. Idempotent-ish: it clears bookings,
 * guests, blocks and rooms first, so re-running gives the same result.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Wipe existing bookings + everything hanging off them, guests, blocks, rooms/beds.
    for (const t of [
      "bookingActivities",
      "bookingServices",
      "payments",
      "guestRequests",
      "bookings",
      "guests",
      "roomBlocks",
      "beds",
      "rooms",
      "roomTypes",
    ] as const) {
      for (const row of await ctx.db.query(t).collect()) await ctx.db.delete(row._id);
    }

    // 1b. Seed the catalog if it's empty, so the calendar agenda has package /
    //     activity / service rows and bookings can carry their board type.
    const PACKAGES = [
      { name: "Bed & Breakfast", description: "Room + breakfast." },
      { name: "Room Only", description: "Room only, no meals." },
      { name: "BNB", description: "Bed & breakfast (BNB)." },
      { name: "BB + Surf", description: "Bed & breakfast plus surf sessions." },
      { name: "Surf Package", description: "Surf-focused stay." },
    ];
    const pkgIdByName = new Map<string, Id<"packages">>();
    const existingPackages = await ctx.db.query("packages").collect();
    for (const p of PACKAGES) {
      const found = existingPackages.find((x) => x.name === p.name);
      const id =
        found?._id ??
        (await ctx.db.insert("packages", {
          name: p.name,
          description: p.description,
          price: 0,
          nights: 7,
          includedItems: [],
          active: true,
        }));
      pkgIdByName.set(p.name, id);
    }
    // Activities & services (seed only if none exist) — so the agenda rows show.
    if ((await ctx.db.query("activities").collect()).length === 0) {
      const acts = [
        { name: "Surf", type: "surf_lesson" as const, color: "#2f948f", startTime: "10:00" },
        { name: "Surf skate", type: "other" as const, color: "#87755a", startTime: "16:00" },
        { name: "Yoga / Pilates", type: "yoga" as const, color: "#f9c74f", startTime: "19:00" },
        { name: "Excursion", type: "excursion" as const, color: "#c05b4d", startTime: "09:30" },
      ];
      for (const a of acts) {
        await ctx.db.insert("activities", {
          name: a.name,
          type: a.type,
          capacityPerSession: 12,
          price: 0,
          durationMin: 120,
          color: a.color,
          active: true,
          startTime: a.startTime,
        });
      }
    }
    const svcNames = new Set(
      (await ctx.db.query("services").collect()).map((s) => s.name),
    );
    for (const [name, unit, time] of [
      ["Breakfast", "per_day", "09:00"],
      ["Dinner", "per_day", "20:00"],
      ["Laundry", "per_unit", undefined],
      ["Transfer", "per_unit", undefined],
    ] as const) {
      if (!svcNames.has(name)) {
        await ctx.db.insert("services", {
          name,
          price: 0,
          unit: unit as "per_day" | "per_unit",
          active: true,
          startTime: time,
        });
      }
    }

    // 2. Rooms sold BY BED — each room is a per-bed unit with N bed sub-rows
    //    (2 for double/twin, 3 for Parents, 4 for Appart). "dorm" mode is the
    //    app's per-bed machinery: bed sub-rows on the calendar, per-bed
    //    availability, one guest per bed.
    const roomIdByName = new Map<string, Id<"rooms">>();
    const bedIdsByRoom = new Map<string, Id<"beds">[]>();
    let sort = 0;
    for (const [name, capacity, description] of CALENDAR_DATA.rooms) {
      const typeId = await ctx.db.insert("roomTypes", {
        name,
        description,
        mode: "dorm",
        capacity,
        basePrice: 0,
      });
      const roomId = await ctx.db.insert("rooms", {
        roomTypeId: typeId,
        name,
        status: "available",
        description,
        sortOrder: sort++,
      });
      const beds: Id<"beds">[] = [];
      for (let i = 0; i < capacity; i++) {
        beds.push(
          await ctx.db.insert("beds", {
            roomId,
            label: `Bed ${i + 1}`,
            sortOrder: i,
          }),
        );
      }
      bedIdsByRoom.set(name, beds);
      roomIdByName.set(name, roomId);
    }

    // 3. Bookings. One guest record per distinct name — a guest who takes
    //    several rooms (apartment) or the whole house (retreat), or who comes
    //    back on other dates, is the SAME guest holding several bookings, not
    //    duplicated people. The spreadsheet keeps the guest in a room across
    //    date rows; here that's one booking per room they occupy.
    const guestIdByName = new Map<string, Id<"guests">>();
    async function guestFor(name: string): Promise<Id<"guests">> {
      const existing = guestIdByName.get(name);
      if (existing) return existing;
      const id = await ctx.db.insert("guests", { fullName: name });
      guestIdByName.set(name, id);
      return id;
    }

    let created = 0;
    for (const b of CALENDAR_DATA.bookings) {
      const roomId = roomIdByName.get(b.room);
      const beds = bedIdsByRoom.get(b.room);
      if (!roomId || !beds) continue;
      const guestId = await guestFor(b.name);
      const pkgId = b.package ? pkgIdByName.get(b.package) : undefined;
      const board = "board" in b && b.board ? ` · ${b.board}` : "";
      // Occupy beds = guest count (capped at the room's beds); one booking
      // row per bed, all sharing the guest. Solo stays leave beds free.
      const occupants = Math.max(1, Math.min(b.adults + b.children, beds.length));
      let adultsLeft = b.adults;
      let childrenLeft = b.children;
      for (let i = 0; i < occupants; i++) {
        const isChild = adultsLeft <= 0 && childrenLeft > 0;
        if (isChild) childrenLeft--;
        else adultsLeft--;
        await ctx.db.insert("bookings", {
          guestId,
          roomId,
          bedId: beds[i],
          packageId: pkgId,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status as "confirmed" | "checked_in" | "checked_out",
          source: "direct",
          adults: isChild ? 0 : 1,
          children: isChild ? 1 : 0,
          totalAmount: 0,
          currency: "EUR",
          notes: `[Imported from calendar]${board}`,
          portalToken: generatePortalToken(),
          reservationCode: generateReservationCode(),
        });
        created++;
      }
    }

    // 4. Date blocks (renovation / blocked).
    let blocked = 0;
    for (const bl of CALENDAR_DATA.blocks) {
      const roomId = roomIdByName.get(bl.room);
      if (!roomId) continue;
      await ctx.db.insert("roomBlocks", {
        roomId,
        start: bl.start,
        end: bl.end,
        reason: bl.reason,
      });
      blocked++;
    }

    return `Imported ${CALENDAR_DATA.rooms.length} rooms, ${created} bookings, ${blocked} blocks.`;
  },
});
