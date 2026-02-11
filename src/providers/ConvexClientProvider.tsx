import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : undefined;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    if (!convex || !convexUrl || !clerkKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#1B3022] text-white p-4">
                <div className="max-w-md bg-[#232931] p-8 rounded-xl border border-red-500/20 shadow-2xl">
                    <h2 className="text-2xl font-bold mb-4 text-red-400">Configuration Missing</h2>
                    <p className="mb-4 text-gray-300">The application cannot start because some environment variables are missing.</p>
                    <ul className="space-y-2 mb-6 font-mono text-sm bg-black/30 p-4 rounded text-yellow-300">
                        {!convexUrl && <li>❌ VITE_CONVEX_URL is missing</li>}
                        {!clerkKey && <li>❌ VITE_CLERK_PUBLISHABLE_KEY is missing</li>}
                    </ul>
                    <p className="text-sm text-gray-400">
                        Please create a <code className="bg-black/50 px-1 py-0.5 rounded text-white">.env.local</code> file in the project root with these keys.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ClerkProvider publishableKey={clerkKey}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
