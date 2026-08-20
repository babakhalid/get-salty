import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logAudit, requireUser } from "./lib/access";

/**
 * Conversion-tracking config (Meta Pixel + Google Tag/Ads). The IDs are
 * public (they run in the guest booking page), so `get` needs no auth.
 * Editing is limited to admin and marketing.
 */

export const get = query({
  args: {},
  handler: async (ctx) => {
    const cfg = await ctx.db.query("trackingConfig").first();
    if (!cfg || !cfg.enabled) return null;
    return {
      metaPixelId: cfg.metaPixelId ?? null,
      googleTagId: cfg.googleTagId ?? null,
      googleAdsPurchaseLabel: cfg.googleAdsPurchaseLabel ?? null,
      googleAdsLeadLabel: cfg.googleAdsLeadLabel ?? null,
    };
  },
});

// Full record for the Settings editor (any signed-in staff can read; only
// admin/marketing can write).
export const getForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const cfg = await ctx.db.query("trackingConfig").first();
    return (
      cfg ?? {
        metaPixelId: "",
        googleTagId: "",
        googleAdsPurchaseLabel: "",
        googleAdsLeadLabel: "",
        enabled: false,
      }
    );
  },
});

export const set = mutation({
  args: {
    metaPixelId: v.optional(v.string()),
    googleTagId: v.optional(v.string()),
    googleAdsPurchaseLabel: v.optional(v.string()),
    googleAdsLeadLabel: v.optional(v.string()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    if (actor.role !== "admin" && actor.role !== "marketing") {
      throw new Error("Only admin and marketing can edit tracking");
    }
    const clean = (v?: string) => {
      const t = (v ?? "").trim();
      return t.length ? t : undefined;
    };
    const fields = {
      metaPixelId: clean(args.metaPixelId),
      googleTagId: clean(args.googleTagId),
      googleAdsPurchaseLabel: clean(args.googleAdsPurchaseLabel),
      googleAdsLeadLabel: clean(args.googleAdsLeadLabel),
      enabled: args.enabled,
    };
    const existing = await ctx.db.query("trackingConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("trackingConfig", fields);
    }
    await logAudit(ctx, actor, {
      action: "tracking.update",
      entity: "trackingConfig",
      entityId: existing?._id ?? "new",
      summary: `Updated conversion tracking (${fields.enabled ? "enabled" : "disabled"})`,
      after: {
        metaPixelId: fields.metaPixelId,
        googleTagId: fields.googleTagId,
        enabled: fields.enabled,
      },
    });
  },
});
