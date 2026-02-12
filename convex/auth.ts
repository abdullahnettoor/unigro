import type { QueryCtx, MutationCtx } from "./_generated/server";

declare const process: any;

export async function checkAdmin(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthorized: Please sign in.");
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    const normalizedAdmins = adminEmails.map((e: string) => e.trim());

    if (!normalizedAdmins.includes(identity.email || "")) {
        throw new Error("Unauthorized: Admin access required.");
    }

    return identity;
}
