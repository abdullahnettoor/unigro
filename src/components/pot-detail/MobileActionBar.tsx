import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
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
        <>
            {/* Gradient Bottom Blur over scrolling content */}
            <div className="fixed bottom-0 inset-x-0 h-32 pointer-events-none z-[60] lg:hidden backdrop-blur-md [mask-image:linear-gradient(to_top,black_20%,transparent_100%)] bg-[var(--surface-elevated)]/20" />
            <div className="fixed bottom-0 left-0 right-0 z-[70] p-4 lg:hidden pointer-events-none">
                <Surface tier={3} className="rounded-3xl p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border border-[var(--border-subtle)]/30 flex items-center justify-between gap-4 pointer-events-auto animate-in slide-in-from-bottom-10 duration-[500ms]">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{primaryAction.label === "Join Pot" ? "Starts at" : "EMI Amount"}</p>
                        <p className="text-lg font-display font-black text-[var(--text-primary)] leading-tight">{formatCurrency(pot.config.contribution, pot.config.currency)}</p>
                    </div>
                    <Button
                        onClick={primaryAction.onClick}
                        disabled={primaryAction.disabled}
                        size="lg"
                        className="whitespace-nowrap"
                        variant={primaryAction.tone === "secondary" ? "secondary" : "primary"}
                    >
                        {primaryAction.label.toUpperCase()}
                    </Button>
                </Surface>
            </div>
        </>
    );
}
