import { mutation } from "./_generated/server";

export const migrateUsers = mutation({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        for (const user of users) {
            // Cast to any to access old 'isVerified' field
            const isVerified = (user as any).isVerified;

            // If verificationStatus is already set, skip
            if (user.verificationStatus) continue;

            await ctx.db.patch(user._id, {
                verificationStatus: isVerified ? "VERIFIED" : "UNVERIFIED",
                // We can't delete 'isVerified' in Convex easily without re-creating, 
                // but patch ignores extra fields if they are not in schema (usually).
                // However, Schema Validation fails if REQUIRED fields are missing.
            });
        }
    },
});
