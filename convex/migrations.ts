import { mutation } from "./_generated/server";

export const migrateUsers = mutation({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        for (const user of users) {
            const isVerified = (user as any).isVerified;
            if (user.verificationStatus) continue;
            await ctx.db.patch(user._id, {
                verificationStatus: isVerified ? "VERIFIED" : "UNVERIFIED",
            });
        }
    },
});
