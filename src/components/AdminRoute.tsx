import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const isAdmin = useQuery(api.users.isAdmin);

    if (isAdmin === undefined) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#1B3022]">
                <Loader2 className="animate-spin text-[#C1FF72]" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
