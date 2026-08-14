import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logAudit, requireRole } from "./lib/access";

/** Team roster with monthly salaries — feeds payroll into the expense ledger. */

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "manager");
    const members = await ctx.db.query("teamMembers").collect();
    return members.sort((a, b) =>
      a.active === b.active ? a.name.localeCompare(b.name) : a.active ? -1 : 1,
    );
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("teamMembers")),
    name: v.string(),
    position: v.string(),
    salary: v.number(),
    active: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const actor = await requireRole(ctx, "manager");
    if (fields.salary < 0) throw new Error("Salary can't be negative");
    if (id) {
      const before = await ctx.db.get(id);
      await ctx.db.patch(id, fields);
      await logAudit(ctx, actor, {
        action: "team.update",
        entity: "teamMembers",
        entityId: id,
        summary: `Updated team member ${fields.name}`,
        before,
        after: fields,
      });
      return id;
    }
    const newId = await ctx.db.insert("teamMembers", fields);
    await logAudit(ctx, actor, {
      action: "team.create",
      entity: "teamMembers",
      entityId: newId,
      summary: `Added team member ${fields.name} (${fields.position})`,
      after: fields,
    });
    return newId;
  },
});

export const remove = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "manager");
    const member = await ctx.db.get(args.id);
    if (!member) return;
    await ctx.db.delete(args.id);
    await logAudit(ctx, actor, {
      action: "team.delete",
      entity: "teamMembers",
      entityId: args.id,
      summary: `Removed team member ${member.name}`,
      before: member,
    });
  },
});

/**
 * One click: book this month's payroll (sum of active salaries) as a fixed
 * expense. Guarded so the same month can't be booked twice.
 */
export const recordPayroll = mutation({
  args: { month: v.string() }, // "YYYY-MM"
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "manager");
    if (!/^\d{4}-\d{2}$/.test(args.month)) throw new Error("Invalid month");
    const marker = `[Payroll ${args.month}]`;
    const expenses = await ctx.db.query("expenses").collect();
    if (expenses.some((e) => e.description.startsWith(marker))) {
      throw new Error(`Payroll for ${args.month} is already recorded`);
    }
    const members = (await ctx.db.query("teamMembers").collect()).filter(
      (m) => m.active && m.salary > 0,
    );
    const total = members.reduce((s, m) => s + m.salary, 0);
    if (total <= 0) throw new Error("No active team members with a salary");
    // One expense line per person, so exports show exactly who was paid what.
    let firstId = null;
    for (const member of members) {
      const id = await ctx.db.insert("expenses", {
        category: "salary",
        kind: "fixed",
        amount: Math.round(member.salary * 100) / 100,
        currency: "EUR",
        date: `${args.month}-28`,
        description: `${marker} ${member.name} — ${member.position}`,
        recordedBy: actor._id,
      });
      firstId ??= id;
    }
    await logAudit(ctx, actor, {
      action: "expense.payroll",
      entity: "expenses",
      entityId: firstId!,
      summary: `Payroll ${args.month}: €${total.toFixed(2)} across ${members.length} team members`,
      after: { month: args.month, total, members: members.length },
    });
    return { total, members: members.length };
  },
});
