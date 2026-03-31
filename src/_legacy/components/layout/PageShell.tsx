import * as React from "react";

import { cn } from "@/lib/utils";

type MaxWidth = "md" | "lg" | "xl";

const widthMap: Record<MaxWidth, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
};

interface PageShellProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: MaxWidth;
  sidebar?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  actionsClassName?: string;
  children: React.ReactNode;
}

export function PageShell({
  title,
  subtitle,
  actions,
  maxWidth = "xl",
  sidebar,
  className,
  headerClassName,
  titleClassName,
  subtitleClassName,
  actionsClassName,
  children,
}: PageShellProps) {
  const hasHeader = title || subtitle || actions;

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 md:py-6",
        widthMap[maxWidth],
        sidebar ? "md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-5 lg:gap-6" : "",
        className
      )}
    >
      {sidebar}
      <div className="min-w-0 md:py-4">
        {hasHeader ? (
          <header className={cn("mb-5 sm:mb-6", headerClassName)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                {title ? (
                  <h1 className={cn("font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl", titleClassName)}>
                    {title}
                  </h1>
                ) : null}
                {subtitle ? (
                  <p className={cn("mt-1 text-sm text-[var(--text-muted)] sm:text-base", subtitleClassName)}>
                    {subtitle}
                  </p>
                ) : null}
              </div>
              {actions ? <div className={cn("flex items-center gap-3", actionsClassName)}>{actions}</div> : null}
            </div>
          </header>
        ) : null}
        {children}
      </div>
    </div>
  );
}
