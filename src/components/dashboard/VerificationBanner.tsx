import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Surface } from "@/components/ui/Surface";

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "REJECTED";

interface VerificationBannerProps {
    status: VerificationStatus;
    onClick?: () => void;
}

export function VerificationBanner({ status, onClick }: VerificationBannerProps) {
    const config = {
        UNVERIFIED: {
            title: "Verify your identity",
            message: "Upload a government ID to unlock full features and build trust.",
            icon: ShieldAlert,
            tone: "warning",
            interactive: true,
        },
        PENDING: {
            title: "Verification pending",
            message: "Your documents are under review. This usually takes up to 24 hours.",
            icon: ShieldCheck,
            tone: "warning",
            interactive: false,
        },
        REJECTED: {
            title: "Verification rejected",
            message: "Action required. Open this alert to view the reason and submit again.",
            icon: ShieldAlert,
            tone: "danger",
            interactive: true,
        },
    } as const;
    const c = config[status];
    const toneClass = c.tone === "warning"
        ? "bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)]"
        : "bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)]";
    const hoverClass = c.interactive ? (c.tone === "warning" ? "hover:bg-[var(--warning)]/15" : "hover:bg-[var(--danger)]/15") : "";
    const Icon = c.icon;

    return (
        <Surface
            tier={2}
            onClick={c.interactive ? onClick : undefined}
            className={`mb-6 flex items-center gap-4 rounded-2xl border p-4 sm:mb-8 ${toneClass} ${hoverClass} ${c.interactive ? "cursor-pointer transition-colors" : ""}`}
        >
            <div className="shrink-0 rounded-full bg-[var(--surface-surface)]/20 p-2">
                <Icon size={22} />
            </div>
            <div>
                <h3 className="mb-1 font-semibold">{c.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{c.message}</p>
            </div>
        </Surface>
    );
}
