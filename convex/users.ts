import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logAudit, requireRole, requireUser } from "./lib/access";
import { roleValidator } from "./schema";

export const me = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await requireUser(ctx);
    } catch {
      return null;
    }
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("users").collect();
  },
});

export const setRole = mutation({
  args: { userId: v.id("users"), role: roleValidator },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "admin");
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target._id === actor._id) throw new Error("Cannot change your own role");
    await ctx.db.patch(args.userId, { role: args.role });
    await logAudit(ctx, actor, {
      action: "user.setRole",
      entity: "users",
      entityId: args.userId,
      summary: `Changed ${target.name ?? target.email} role to ${args.role}`,
      before: { role: target.role },
      after: { role: args.role },
    });
  },
});

export const setActive = mutation({
  args: { userId: v.id("users"), active: v.boolean() },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "admin");
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target._id === actor._id) throw new Error("Cannot deactivate yourself");
    await ctx.db.patch(args.userId, { active: args.active });
    await logAudit(ctx, actor, {
      action: args.active ? "user.activate" : "user.deactivate",
      entity: "users",
      entityId: args.userId,
      summary: `${args.active ? "Activated" : "Deactivated"} ${target.name ?? target.email}`,
      before: { active: target.active },
      after: { active: args.active },
    });
  },
});
