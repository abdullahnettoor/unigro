import * as React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[var(--bg-app)] text-[var(--text-primary)] font-[family-name:var(--font-body)]">
      {children}
    </div>
  );
}
