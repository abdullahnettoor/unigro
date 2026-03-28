import { Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { OfflineFallback } from "@/components/shared/OfflineFallback";
import { LogoLoader } from "@/components/ui/LogoLoader";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

import { api } from "@convex/api";

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const isAdmin = useQuery(api.users.isAdmin);
    const { isOnline } = useNetworkStatus();

    if (isAdmin === undefined) {
        if (!isOnline) {
            return (
                <OfflineFallback
                    title="Admin tools unavailable offline"
                    message="Admin access needs a live permission check before this area can open."
                />
            );
        }
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--bg-app)]">
                <LogoLoader size="lg" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
