import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : undefined;

/**
 * Clerk appearance — maps UniGro's design tokens onto Clerk's theming variables.
 * Using direct hex values (not CSS vars) for maximum browser compatibility
 * as recommended by Clerk docs.
 *
 * We detect the current theme at render-time and pass the appropriate palette.
 */
function getClerkAppearance() {
    const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";

    return {
        variables: {
            // Primary action color (buttons, links, focus rings)
            colorPrimary: isDark ? "#A7E3D0" : "#2E6B5B",
            colorPrimaryForeground: isDark ? "#101015" : "#FDFBF8",

            // Card / modal background
            colorBackground: isDark ? "#1A161C" : "#FDFBF8",

            // Text
            colorForeground: isDark ? "#F2ECE6" : "#1E1A16",
            colorMutedForeground: isDark ? "#B9ADB0" : "#6F6257",
            colorMuted: isDark ? "#221E24" : "#F3EEE8",

            // Inputs
            colorInput: isDark ? "#221E24" : "#F3EEE8",
            colorInputForeground: isDark ? "#F2ECE6" : "#1E1A16",

            // Borders & neutrals
            colorBorder: isDark ? "#3D343F" : "#D9CFC6",
            colorNeutral: isDark ? "#B9ADB0" : "#6F6257",

            // Status colors
            colorSuccess: isDark ? "#90E0C5" : "#2E7C5F",
            colorWarning: isDark ? "#F2B26B" : "#C98239",
            colorDanger: isDark ? "#E37A73" : "#C34A3C",

            // Focus ring
            colorRing: isDark ? "#A7E3D0" : "#2E6B5B",

            // Shadow
            colorShadow: isDark
                ? "rgba(0, 0, 0, 0.3)"
                : "rgba(20, 16, 12, 0.1)",

            // Modal backdrop
            colorModalBackdrop: isDark
                ? "rgba(18, 16, 19, 0.75)"
                : "rgba(30, 26, 22, 0.45)",

            // Typography — matches UniGro's font stack
            fontFamily: '"Manrope", sans-serif',
            fontFamilyButtons: '"Google Sans", sans-serif',

            // Geometry
            borderRadius: "14px",
            spacing: "1rem",
        },
    };
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    if (!convex || !convexUrl || !clerkKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh bg-[var(--bg-app)] text-[var(--text-primary)] p-4">
                <div className="max-w-md bg-[var(--surface-elevated)] p-8 rounded-xl border border-[var(--danger)]/20 shadow-2xl">
                    <h2 className="text-2xl font-bold mb-4 text-[var(--danger)]">Configuration Missing</h2>
                    <p className="mb-4 text-[var(--text-muted)]">The application cannot start because some environment variables are missing.</p>
                    <ul className="space-y-2 mb-6 font-mono text-sm bg-[var(--surface-deep)]/70 p-4 rounded text-[var(--warning)]">
                        {!convexUrl && <li>❌ VITE_CONVEX_URL is missing</li>}
                        {!clerkKey && <li>❌ VITE_CLERK_PUBLISHABLE_KEY is missing</li>}
                    </ul>
                    <p className="text-sm text-[var(--text-muted)]">
                        Please create a <code className="bg-[var(--surface-deep)]/80 px-1 py-0.5 rounded text-[var(--text-primary)]">.env.local</code> file in the project root with these keys.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ClerkProvider publishableKey={clerkKey} appearance={getClerkAppearance()}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
