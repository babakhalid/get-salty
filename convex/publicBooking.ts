import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { generatePortalToken, generateReservationCode } from "./lib/access";
import { surfLevelValidator } from "./schema";

/**
 * Public self-service booking — no auth. Guests check availability and
 * submit a booking that lands on the calendar as an "inquiry" (slot held,
 * staff confirm from the booking drawer). Every submission is audit-logged.
 */

const HOLDING_STATUSES = ["inquiry", "confirmed", "checked_in"] as const;

function overlaps(b: Doc<"bookings">, checkIn: string, checkOut: string) {
  return (
    (HOLDING_STATUSES as readonly string[]).includes(b.status) &&
    b.checkIn < checkOut &&
    b.checkOut > checkIn
  );
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function nightsBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function validateStay(checkIn: string, checkOut: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    throw new Error("Invalid dates");
  }
  if (checkIn < isoToday()) throw new Error("Check-in must be in the future");
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new Error("Check-out must be after check-in");
  if (nights > 30) throw new Error("For stays over 30 nights, contact us directly");
  return nights;
}

export const availability = query({
  args: { checkIn: v.string(), checkOut: v.string() },
  handler: async (ctx, args) => {
    const nights = validateStay(args.checkIn, args.checkOut);

    const [roomTypes, rooms, beds, bookings, packages, services] = await Promise.all([
      ctx.db.query("roomTypes").collect(),
      ctx.db.query("rooms").collect(),
      ctx.db.query("beds").collect(),
      ctx.db.query("bookings").collect(),
      ctx.db.query("packages").collect(),
      ctx.db.query("services").collect(),
    ]);

    const taken = bookings.filter((b) => overlaps(b, args.checkIn, args.checkOut));

    const types = roomTypes.map((type) => {
      const typeRooms = rooms.filter(
        (r) => r.roomTypeId === type._id && r.status === "available",
      );
      let unitsLeft = 0;
      if (type.mode === "dorm") {
        for (const room of typeRooms) {
          const roomBeds = beds.filter((b) => b.roomId === room._id);
          const takenBeds = new Set(
            taken.filter((b) => b.roomId === room._id && b.bedId).map((b) => b.bedId),
          );
          unitsLeft += roomBeds.length - takenBeds.size;
        }
      } else {
        unitsLeft = typeRooms.filter(
          (room) => !taken.some((b) => b.roomId === room._id),
        ).length;
      }
      return {
        roomTypeId: type._id,
        name: type.name,
        description: type.description,
        mode: type.mode,
        capacity: type.capacity,
        pricePerNight: type.basePrice,
        amenities: type.amenities ?? [],
        unitsLeft,
        totalForStay: type.basePrice * nights,
      };
    });

    return {
      nights,
      roomTypes: types,
      // packages designed for exactly this stay length
      packages: packages
        .filter((p) => p.active && p.nights === nights)
        .map((p) => ({
          packageId: p._id,
          name: p.name,
          description: p.description,
          price: p.price,
        })),
      services: services
        .filter((s) => s.active)
        .map((s) => ({
          serviceId: s._id,
          name: s.name,
          price: s.price,
          unit: s.unit,
        })),
    };
  },
});

export const createRequest = mutation({
  args: {
    checkIn: v.string(),
    checkOut: v.string(),
    roomTypeId: v.id("roomTypes"),
    packageId: v.optional(v.id("packages")),
    services: v.optional(
      v.array(v.object({ serviceId: v.id("services"), qty: v.number() })),
    ),
    adults: v.number(),
    children: v.number(),
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    country: v.optional(v.string()),
    surfLevel: v.optional(surfLevelValidator),
    allergies: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nights = validateStay(args.checkIn, args.checkOut);
    const fullName = args.fullName.trim();
    if (fullName.length < 2 || fullName.length > 80) throw new Error("Please enter your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) throw new Error("Please enter a valid email");

    const type = await ctx.db.get(args.roomTypeId);
    if (!type) throw new Error("Room type not found");
    if (args.adults < 1) throw new Error("At least one adult required");
    const pax = args.adults + args.children;
    if (type.mode === "dorm" && pax > 1) {
      throw new Error("Dorm beds are booked per person — submit one request per bed");
    }
    if (pax > type.capacity) {
      throw new Error(`${type.name} sleeps up to ${type.capacity}`);
    }

    // Find the first free room (or dorm bed) of the requested type.
    const [rooms, beds, bookings] = await Promise.all([
      ctx.db.query("rooms").collect(),
      ctx.db.query("beds").collect(),
      ctx.db.query("bookings").collect(),
    ]);
    const taken = bookings.filter((b) => overlaps(b, args.checkIn, args.checkOut));
    const typeRooms = rooms
      .filter((r) => r.roomTypeId === args.roomTypeId && r.status === "available")
      .sort((a, b) => a.sortOrder - b.sortOrder);

    let roomId = null;
    let bedId = undefined;
    if (type.mode === "dorm") {
      outer: for (const room of typeRooms) {
        const takenBeds = new Set(
          taken.filter((b) => b.roomId === room._id && b.bedId).map((b) => b.bedId),
        );
        for (const bed of beds
          .filter((b) => b.roomId === room._id)
          .sort((a, b) => a.sortOrder - b.sortOrder)) {
          if (!takenBeds.has(bed._id)) {
            roomId = room._id;
            bedId = bed._id;
            break outer;
          }
        }
      }
    } else {
      roomId = typeRooms.find((room) => !taken.some((b) => b.roomId === room._id))?._id ?? null;
    }
    if (!roomId) throw new Error("Sorry — nothing free for those dates anymore");

    let totalAmount = type.basePrice * nights;
    if (args.packageId) {
      const pkg = await ctx.db.get(args.packageId);
      if (!pkg || !pkg.active) throw new Error("Package not available");
      if (pkg.nights !== nights) throw new Error("Package doesn't match your stay length");
      totalAmount = pkg.price;
    }

    // Extra services picked at booking time (multiple allowed)
    const extraServices: { serviceId: Id<"services">; qty: number; amount: number }[] = [];
    for (const item of args.services ?? []) {
      if (item.qty < 1 || item.qty > 30) throw new Error("Invalid service quantity");
      const service = await ctx.db.get(item.serviceId);
      if (!service || !service.active) throw new Error("Service not available");
      const amount = service.price * item.qty;
      extraServices.push({ serviceId: item.serviceId, qty: item.qty, amount });
      totalAmount += amount;
    }

    const guestId = await ctx.db.insert("guests", {
      fullName,
      email: args.email,
      phone: args.phone,
      country: args.country,
      surfLevel: args.surfLevel,
      allergies: args.allergies,
    });

    const portalToken = generatePortalToken();
    const reservationCode = generateReservationCode();
    const bookingId = await ctx.db.insert("bookings", {
      guestId,
      roomId,
      bedId,
      packageId: args.packageId,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      status: "inquiry",
      source: "direct",
      adults: args.adults,
      children: args.children,
      totalAmount,
      currency: "EUR",
      notes: args.notes ? `[Self-service] ${args.notes}` : "[Self-service booking]",
      portalToken,
      reservationCode,
    });

    for (const item of extraServices) {
      await ctx.db.insert("bookingServices", {
        bookingId,
        serviceId: item.serviceId,
        qty: item.qty,
        amount: item.amount,
      });
    }

    // Package line items, same as staff-created bookings
    if (args.packageId) {
      const pkg = await ctx.db.get(args.packageId);
      if (pkg) {
        for (const item of pkg.includedItems) {
          if (item.kind === "activity") {
            await ctx.db.insert("bookingActivities", {
              bookingId,
              activityId: item.refId as Id<"activities">,
              date: args.checkIn,
              participants: item.qty,
            });
          } else {
            await ctx.db.insert("bookingServices", {
              bookingId,
              serviceId: item.refId as Id<"services">,
              qty: item.qty,
              amount: 0,
            });
          }
        }
      }
    }

    await ctx.db.insert("auditLogs", {
      actorName: `Guest: ${fullName} (self-service)`,
      action: "booking.selfService",
      entity: "bookings",
      entityId: bookingId,
      summary: `Self-service request: ${fullName} · ${args.checkIn} → ${args.checkOut} · ${type.name}`,
      after: {
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        roomType: type.name,
        pax,
        totalAmount,
      },
    });

    return { portalToken, reservationCode, totalAmount, nights, roomTypeName: type.name };
  },
});
