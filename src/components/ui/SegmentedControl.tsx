import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
    value: T;
    label: string;
    count?: number;
}

interface SegmentedControlProps<T extends string> {
    value: T;
    onChange: (value: T) => void;
    options: SegmentedOption<T>[];
    className?: string;
    buttonClassName?: string;
    density?: "comfortable" | "compact";
}

export function SegmentedControl<T extends string>({
    value,
    onChange,
    options,
    className,
    buttonClassName,
    density = "compact",
}: SegmentedControlProps<T>) {
    return (
        <div className={cn("glass-1 inline-flex rounded-full p-0.5", className)}>
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        aria-pressed={active}
                        className={cn(
                            "rounded-full font-semibold transition-colors",
                            density === "compact" ? "btn-chip h-7 px-3 text-[11px]" : "h-10 px-4 text-sm",
                            buttonClassName,
                            active
                                ? "bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                        )}
                    >
                        <span className="inline-flex items-center gap-2">
                            <span>{opt.label}</span>
                            {active && typeof opt.count === "number" ? (
                                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[var(--surface-deep)]/80 px-1 text-[10px] font-semibold text-[var(--text-muted)]">
                                    {opt.count}
                                </span>
                            ) : null}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
