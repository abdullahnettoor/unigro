import { cn } from "./Button";

interface SegmentedOption<T extends string> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string> {
    value: T;
    onChange: (value: T) => void;
    options: SegmentedOption<T>[];
    className?: string;
    buttonClassName?: string;
}

export function SegmentedControl<T extends string>({
    value,
    onChange,
    options,
    className,
    buttonClassName,
}: SegmentedControlProps<T>) {
    return (
        <div className={cn("glass-1 inline-flex rounded-full p-1", className)}>
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        aria-pressed={active}
                        className={cn(
                            "min-h-9 rounded-full px-4 text-xs font-semibold transition-colors",
                            buttonClassName,
                            active
                                ? "bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                        )}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
