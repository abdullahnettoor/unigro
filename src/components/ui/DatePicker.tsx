import { format } from "date-fns";
import * as Icons from "@/lib/icons";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
}: DatePickerProps) {
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "group relative flex h-12 w-full items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 px-4 py-2 text-left transition-all hover:bg-[var(--surface-3)]/60 focus:outline-none focus:ring-4 focus:ring-[var(--accent-vivid)]/10 disabled:opacity-50",
            className
          )}
        >
          <Icons.StartDateIcon className="shrink-0 text-[var(--accent-vivid)]" size={18} />
          <span className={cn(
            "flex-1 text-sm font-medium transition-colors",
            selectedDate ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          )}>
            {selectedDate ? format(selectedDate, "PPP") : placeholder}
          </span>
          <Icons.ExpandIcon className="shrink-0 text-[var(--text-muted)]/50 group-hover:text-[var(--text-muted)] transition-colors" size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="glass-3 p-0 border-[var(--border-subtle)] rounded-[24px] overflow-hidden shadow-[var(--shadow-lg)]" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          captionLayout="dropdown"
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
          }}
          initialFocus
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
