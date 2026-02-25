import { formatCurrency } from "@/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

interface MobileActionBarProps {
    pot: Doc<"pots">;
    primaryAction: any;
    isAnyModalOpen: boolean;
}

export function MobileActionBar({
    pot,
    primaryAction,
    isAnyModalOpen
}: MobileActionBarProps) {
    if (!primaryAction || isAnyModalOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[70] p-4 lg:hidden pointer-events-none">
            <div className="glass-3 rounded-3xl p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border border-[var(--border-subtle)]/30 flex items-center justify-between gap-4 pointer-events-auto animate-in slide-in-from-bottom-10 duration-[500ms]">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{primaryAction.label === "Join Pot" ? "Starts at" : "EMI Amount"}</p>
                    <p className="text-lg font-display font-black text-[var(--text-primary)] leading-tight">{formatCurrency(pot.config.contribution, pot.config.currency)}</p>
                </div>
                <button
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled}
                    className={`px-8 h-14 rounded-2xl text-sm font-black transition-all active:scale-95 whitespace-nowrap ${primaryAction.tone === "secondary"
                        ? "bg-[var(--accent-secondary)] text-[var(--text-primary)]"
                        : "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-[0_8px_20px_rgba(var(--accent-vivid-rgb),0.3)]"
                        } disabled:opacity-50`}
                >
                    {primaryAction.label.toUpperCase()}
                </button>
            </div>
        </div>
    );
}
