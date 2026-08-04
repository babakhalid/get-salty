import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { DataModel } from "./_generated/dataModel";

const PasswordWithName = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: (params.name as string) ?? undefined,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordWithName],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return;
      // First user ever becomes admin; everyone after signs up as crew
      // (an admin can promote them from Settings).
      const anyOther = await ctx.db
        .query("users")
        .filter((q) => q.neq(q.field("_id"), userId))
        .first();
      await ctx.db.patch(userId, {
        role: anyOther ? "crew" : "admin",
        active: true,
      });
    },
  },
});
