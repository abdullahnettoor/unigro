"use client";

import * as React from "react";
import {
  type DayButton,
  DayPicker,
  getDefaultClassNames,
  type Locale,
} from "react-day-picker";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      className={cn("p-2 text-[var(--text-primary)]", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        month_caption: cn(
          "relative flex h-9 items-center justify-center px-9",
          defaultClassNames.month_caption
        ),
        nav: cn(
          "absolute inset-x-0 top-1 flex items-center justify-between z-10 pointer-events-none",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant, size: "icon" }),
          "h-7 w-7 !min-h-0 !min-w-0 !w-7 !h-7 !p-0 pointer-events-auto bg-transparent rounded-full aspect-square flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] aria-disabled:opacity-40",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant, size: "icon" }),
          "h-7 w-7 !min-h-0 !min-w-0 !w-7 !h-7 !p-0 pointer-events-auto bg-transparent rounded-full aspect-square flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] aria-disabled:opacity-40",
          defaultClassNames.button_next
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        dropdowns: cn(
          "flex items-center gap-2 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative inline-flex items-center rounded-md border border-[var(--border-subtle)]/60 px-2 py-1",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 h-full w-full appearance-none bg-transparent opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "inline-flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]",
          defaultClassNames.caption_label
        ),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "w-9 text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-muted)]",
          defaultClassNames.weekday
        ),
        weeks: cn("flex flex-col gap-1", defaultClassNames.weeks),
        week: cn("flex w-full", defaultClassNames.week),
        day: cn(
          "relative w-full p-0 text-center",
          defaultClassNames.day
        ),
        day_button: cn(
          "h-9 w-9 !min-h-0 rounded-full text-sm font-normal text-[var(--text-primary)] hover:bg-[var(--surface-deep)]/60 aria-selected:bg-[var(--accent-vivid)] aria-selected:text-[var(--text-on-accent)]",
          defaultClassNames.day_button
        ),
        range_start: cn(
          "rounded-l-full bg-[var(--surface-deep)]",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-r-full bg-[var(--surface-deep)]",
          defaultClassNames.range_end
        ),
        today: cn(
          "border border-[var(--accent-vivid)]/40 rounded-full",
          defaultClassNames.today
        ),
        outside: cn(
          "text-[var(--text-muted)] opacity-50 aria-selected:text-[var(--text-muted)] aria-selected:opacity-50",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-[var(--text-muted)]/40",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        chevron: cn("text-[var(--text-muted)]", defaultClassNames.chevron),
        ...classNames,
      }}
      components={{
        Chevron: ({ className: iconClassName, orientation, ...iconProps }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("size-4", iconClassName)} {...iconProps} />;
          }
          if (orientation === "right") {
            return <ChevronRight className={cn("size-4", iconClassName)} {...iconProps} />;
          }
          return <ChevronDown className={cn("size-4", iconClassName)} {...iconProps} />;
        },
        DayButton: ({ ...dayProps }) => (
          <CalendarDayButton locale={locale} {...dayProps} />
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 text-[var(--text-primary)] data-[selected-single=true]:bg-[var(--accent-vivid)] data-[selected-single=true]:text-[var(--text-on-accent)] data-[selected-single=true]:opacity-100 data-[range-middle=true]:bg-[var(--surface-deep)]/60 data-[range-start=true]:bg-[var(--accent-vivid)] data-[range-start=true]:text-[var(--text-on-accent)] data-[range-end=true]:bg-[var(--accent-vivid)] data-[range-end=true]:text-[var(--text-on-accent)]",
        className
      )}
      {...props}
    />
  );
}

export { CalendarDayButton };
