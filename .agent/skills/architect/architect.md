---
name: react-convex-clerk-architect
description: Expert in building and maintaining full-stack applications using React, Vite, Convex (backend/database), and Clerk (authentication). Use this when the user needs to scaffold features, debug queries/mutations, or implement auth flows.
---

# React + Convex + Clerk Application Skill

This skill ensures that all code generation and architectural advice follow the industry-standard "Weightless Stack" (Real-time, Serverless, Type-safe).



## Core Architecture Standards

### 1. Project Structure
Maintain a strict separation between frontend and backend:
- `convex/`: Backend schema, queries, mutations, and actions.
- `src/components/`: Reusable UI components.
- `src/hooks/`: Custom React hooks (including Convex `useQuery`/`useMutation` wrappers).
- `src/main.tsx`: Clerk and Convex provider initialization.

### 2. Authentication Flow (Clerk + Convex)
- All backend functions must validate the user identity using `ctx.auth.getUserIdentity()`.
- **Never** trust a `userId` passed as a raw argument from the frontend; always derive it from the auth token.
- Use `<Authenticated>`, `<Unauthenticated>`, and `<AuthLoading>` components from `convex/react` to manage UI states.

### 3. Backend Implementation (Convex)
- **Schema**: Always define a strict `convex/schema.ts` using `v.string()`, `v.number()`, etc.
- **Indices**: Define indices for any field used in a `.filter()` or `.order()` to ensure performance.
- **Internal Functions**: Use `internalQuery` and `internalMutation` for logic that should not be exposed to the client.

| Function Type | Use Case |
| :--- | :--- |
| **Query** | Fetching data (Auto-reactive). |
| **Mutation** | Modifying data (Atomic transactions). |
| **Action** | Side effects (Emailing, LLM calls, Third-party APIs). |

### 4. Frontend Implementation (React + Vite)
- Use **Vite** for fast HMR and environment variable management (`import.meta.env`).
- Use **TypeScript** for end-to-end type safety between the Convex schema and React components.
- Implementation of **Optimistic Updates** is required for mutations to ensure a "zero-latency" feel.

## Implementation Instructions

1. **Schema First**: Before writing UI, define the data model in `convex/schema.ts`.
2. **Auth Integration**: Ensure the Clerk JWT Template for Convex is configured.
3. **Type-Safe Hooks**: Use the generated `api` object (e.g., `useQuery(api.users.get)`) instead of manual strings.
4. **Environment Variables**:
   - `VITE_CONVEX_URL`: Public backend URL.
   - `VITE_CLERK_PUBLISHABLE_KEY`: Clerk public key.

## Example: Protected Mutation
`feat(db): implement secure user profile update`

```typescript
// convex/users.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateProfile = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { name: args.name });
    }
  },
});
```