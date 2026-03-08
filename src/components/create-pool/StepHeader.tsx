import { motion } from "framer-motion";

export function StepHeader({
  title,
  step,
  total,
  stepLabel,
  onBack,
  backLabel,
}: {
  title: string;
  step: number;
  total: number;
  stepLabel: string;
  onBack: () => void;
  backLabel: string;
}) {
  const progress = ((step + 1) / total) * 100;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] glass-sticky px-4 pt-12 pb-4 backdrop-blur-md sm:pt-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)]/60"
          >
            {backLabel}
          </button>
          <div className="text-lg font-bold text-[var(--text-primary)]">{title}</div>
          <div className="w-[72px]" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-[var(--text-muted)]">
            <span>Step {step + 1} of {total}</span>
            <span>{stepLabel}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]/70">
            <motion.div
              className="h-full bg-[var(--accent-vivid)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
