import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface VerificationGuardProps {
    status: "UNVERIFIED" | "PENDING" | "REJECTED" | "VERIFIED";
}

export function VerificationGuard({ status }: VerificationGuardProps) {
    const navigate = useNavigate();

    if (status === "VERIFIED") return null;

    const config = {
        UNVERIFIED: {
            title: "Identity Verification Required",
            message: "Verify your identity to activate this pool and invite members.",
            color: "var(--accent-vivid)",
            icon: <ShieldAlert size={20} className="text-[var(--accent-vivid)]" />,
            cta: "Get Verified"
        },
        PENDING: {
            title: "Verification in Progress",
            message: "Our team is reviewing your documents. You'll be notified soon.",
            color: "var(--text-muted)",
            icon: <ShieldAlert size={20} className="text-[var(--text-muted)]" />,
            cta: "Check Status"
        },
        REJECTED: {
            title: "Verification Rejected",
            message: "There was an issue with your documents. Please try again.",
            color: "#ef4444",
            icon: <ShieldAlert size={20} className="text-red-500" />,
            cta: "Re-submit"
        }
    };

    const current = config[status as keyof typeof config] || config.UNVERIFIED;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 p-1 shadow-sm backdrop-blur-md"
        >
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-1)] shadow-inner">
                        {current.icon}
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-display text-sm font-bold text-[var(--text-primary)]">
                            {current.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-[var(--text-muted)] sm:max-w-md">
                            {current.message}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate("/settings")}
                    className="group flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--bg-app)] px-6 text-xs font-bold text-[var(--text-primary)] transition-all hover:bg-[var(--surface-1)] active:scale-95 sm:self-center"
                    style={{ border: `1px solid ${current.color}40` }}
                >
                    {current.cta}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </motion.div>
    );
}
