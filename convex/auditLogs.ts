import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireRole, requireUser } from "./lib/access";

export const list = query({
  args: {
    entity: v.optional(v.string()),
    actorId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "manager");
    const limit = Math.min(args.limit ?? 100, 400);
    let logs;
    if (args.actorId) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actorId", args.actorId))
        .order("desc")
        .take(limit);
    } else if (args.entity) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_entity", (q) => q.eq("entity", args.entity!))
        .order("desc")
        .take(limit);
    } else {
      logs = await ctx.db.query("auditLogs").order("desc").take(limit);
    }
    if (args.entity && args.actorId) {
      logs = logs.filter((l) => l.entity === args.entity);
    }
    return logs;
  },
});

export const recent = query({
  args: {},
  handler: async (ctx) => {
    // Crew see an empty feed rather than a crashed dashboard.
    const user = await requireUser(ctx);
    if (user.role !== "admin" && user.role !== "manager") return [];
    return await ctx.db.query("auditLogs").order("desc").take(12);
  },
});
