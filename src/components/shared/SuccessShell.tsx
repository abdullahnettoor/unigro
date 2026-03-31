import * as React from "react";

import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/monetization/AdSlot";
import { cn } from "@/lib/utils";

type SuccessPlacement = "success-create" | "success-join";

interface SuccessShellProps {
  eyebrow: string;
  title: string;
  description: string;
  summary: React.ReactNode;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tertiaryAction?: {
    label: string;
    onClick: () => void;
  };
  sponsorPlacement?: SuccessPlacement;
  sponsorTitle?: string;
  sponsorBody?: string;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function SuccessShell({
  eyebrow,
  title,
  description,
  summary,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  sponsorPlacement,
  sponsorTitle,
  sponsorBody,
  children,
  className,
  compact = false,
}: SuccessShellProps) {
  return (
    <div className={cn("min-h-dvh bg-[var(--bg-app)] px-4 py-6 sm:px-6", className)}>
      <div className={cn("mx-auto flex w-full max-w-2xl flex-col", compact ? "gap-4" : "gap-5")}>
        <Surface tier={2} className={cn("rounded-[32px] border border-[var(--border-subtle)]/70", compact ? "p-5 sm:p-6" : "p-6 sm:p-7")}>
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">
                {eyebrow}
              </p>
              <h1 className={cn("font-display font-bold leading-tight text-[var(--text-primary)]", compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl")}>
                {title}
              </h1>
              <p className={cn("max-w-xl leading-relaxed text-[var(--text-muted)]", compact ? "text-sm" : "text-sm sm:text-base")}>
                {description}
              </p>
            </div>

            <div>{summary}</div>

            {children}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 flex-1 rounded-full" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
              {secondaryAction ? (
                <Button variant="secondary" className="h-12 flex-1 rounded-full" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              ) : null}
            </div>

            {tertiaryAction ? (
              <Button variant="ghost" className="h-10 rounded-full" onClick={tertiaryAction.onClick}>
                {tertiaryAction.label}
              </Button>
            ) : null}
          </div>
        </Surface>

        {sponsorPlacement ? (
          <AdSlot
            placement={sponsorPlacement}
            audience="all-free"
            title={sponsorTitle}
            body={sponsorBody}
            className={cn(
              sponsorPlacement === "success-create" ? "rounded-[30px] p-5 sm:p-6" : "rounded-[26px]",
              compact ? "min-h-[32vh] flex items-start" : ""
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
