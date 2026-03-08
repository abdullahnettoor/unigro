import { PoolIcon } from "@/lib/icons";

export function EmptyPools() {
  return (
    <div className="glass-2 relative overflow-hidden rounded-[24px] border border-dashed border-[var(--border-subtle)] p-8 text-center">
      <div className="pointer-events-none absolute right-8 top-8 h-16 w-16 rounded-full bg-[var(--accent-vivid)]/15 blur-2xl" />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]">
        <PoolIcon size={24} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">No pools yet</h3>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Join a savings pool to start earning together.</p>
    </div>
  );
}
