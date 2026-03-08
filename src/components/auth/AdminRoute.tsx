import { Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { LogoLoader } from "@/components/ui/LogoLoader";

import { api } from "@convex/api";

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const isAdmin = useQuery(api.users.isAdmin);

    if (isAdmin === undefined) {
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
