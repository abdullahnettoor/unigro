import { type ComponentType } from "react";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface QuickActivityCardProps {
    title: string;
    value: string;
    hint: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    accent?: boolean;
}

export function QuickActivityCard({
    title,
    value,
    hint,
    icon: Icon,
    accent = false,
}: QuickActivityCardProps) {
    return (
        <GlassSurface
            tier="glass-2"
            className={`min-w-[240px] p-5 ${accent ? "border-[var(--accent-vivid)]/35 bg-[var(--accent-soft)]/35" : ""}`}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{title}</span>
                <Icon size={16} className={accent ? "text-[var(--accent-vivid)]" : "text-[var(--text-muted)]"} />
            </div>
            <div className="text-2xl font-semibold font-mono text-[var(--text-primary)]">{value}</div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
        </GlassSurface>
    );
}
