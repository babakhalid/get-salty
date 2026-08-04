import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logAudit, requireRole, requireUser } from "./lib/access";

// ── Room types ─────────────────────────────────────────────────────────

export const listRoomTypes = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("roomTypes").collect();
  },
});

export const upsertRoomType = mutation({
  args: {
    id: v.optional(v.id("roomTypes")),
    name: v.string(),
    description: v.optional(v.string()),
    mode: v.union(v.literal("private"), v.literal("dorm")),
    capacity: v.number(),
    basePrice: v.number(),
    amenities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...fields }) => {
    const actor = await requireRole(ctx, "manager");
    if (id) {
      const before = await ctx.db.get(id);
      await ctx.db.patch(id, fields);
      await logAudit(ctx, actor, {
        action: "roomType.update",
        entity: "roomTypes",
        entityId: id,
        summary: `Updated room type "${fields.name}"`,
        before,
        after: fields,
      });
      return id;
    }
    const newId = await ctx.db.insert("roomTypes", fields);
    await logAudit(ctx, actor, {
      action: "roomType.create",
      entity: "roomTypes",
      entityId: newId,
      summary: `Created room type "${fields.name}"`,
      after: fields,
    });
    return newId;
  },
});

// ── Rooms ──────────────────────────────────────────────────────────────

export const listRooms = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const rooms = await ctx.db.query("rooms").collect();
    return rooms.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const upsertRoom = mutation({
  args: {
    id: v.optional(v.id("rooms")),
    roomTypeId: v.id("roomTypes"),
    name: v.string(),
    floor: v.optional(v.string()),
    status: v.union(v.literal("available"), v.literal("maintenance")),
    notes: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    bedCount: v.optional(v.number()), // for dorms: sync beds to this count
  },
  handler: async (ctx, { id, bedCount, ...fields }) => {
    const actor = await requireRole(ctx, "manager");
    const roomType = await ctx.db.get(fields.roomTypeId);
    if (!roomType) throw new Error("Room type not found");

    let roomId = id;
    if (roomId) {
      const before = await ctx.db.get(roomId);
      await ctx.db.patch(roomId, {
        ...fields,
        sortOrder: fields.sortOrder ?? before?.sortOrder ?? 0,
      });
      await logAudit(ctx, actor, {
        action: "room.update",
        entity: "rooms",
        entityId: roomId,
        summary: `Updated room "${fields.name}"`,
        before,
        after: fields,
      });
    } else {
      const all = await ctx.db.query("rooms").collect();
      roomId = await ctx.db.insert("rooms", {
        ...fields,
        sortOrder: fields.sortOrder ?? all.length,
      });
      await logAudit(ctx, actor, {
        action: "room.create",
        entity: "rooms",
        entityId: roomId,
        summary: `Created room "${fields.name}"`,
        after: fields,
      });
    }

    // Keep dorm bed rows in sync with the requested count.
    if (roomType.mode === "dorm" && bedCount !== undefined) {
      const beds = await ctx.db
        .query("beds")
        .withIndex("by_room", (q) => q.eq("roomId", roomId))
        .collect();
      const sorted = beds.sort((a, b) => a.sortOrder - b.sortOrder);
      for (let i = sorted.length; i < bedCount; i++) {
        await ctx.db.insert("beds", {
          roomId,
          label: `Bed ${i + 1}`,
          sortOrder: i,
        });
      }
      for (let i = bedCount; i < sorted.length; i++) {
        await ctx.db.delete(sorted[i]._id);
      }
    }
    return roomId;
  },
});

export const listBeds = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const beds = await ctx.db.query("beds").collect();
    return beds.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
