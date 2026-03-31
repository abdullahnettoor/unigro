import { Button } from "@/components/ui/button";
import { ArrowIcon, CreateIcon } from "@/lib/icons";

export function StepFooterBar({
  step,
  total,
  nextLabel,
  submitLabel,
  isSubmitting,
  onNext,
  onSubmit,
}: {
  step: number;
  total: number;
  nextLabel: string;
  submitLabel: string;
  isSubmitting: boolean;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const isLast = step === total - 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-subtle)] glass-sticky p-4 pb-safe-offset-4 shadow-lg sm:pb-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <div className="hidden text-xs font-semibold text-[var(--text-muted)] sm:block">
          {isLast ? "Final step" : nextLabel}
        </div>

        <Button
          type="button"
          onClick={isLast ? onSubmit : onNext}
          disabled={isSubmitting}
          className="ml-auto w-full sm:w-auto"
          size="lg"
        >
          {isSubmitting ? (
            "Saving…"
          ) : isLast ? (
            <>
              <CreateIcon />
              {submitLabel}
            </>
          ) : (
            <>
              Next step
              <ArrowIcon />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
