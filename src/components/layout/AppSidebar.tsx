import { Link, useLocation } from "react-router-dom";
import { Home, Settings as SettingsIcon, ShieldAlert, WalletCards } from "lucide-react";

import { Surface } from "@/components/ui/Surface";

interface AppSidebarProps {
  firstName: string;
  imageUrl?: string;
  showAdmin?: boolean;
}

export function AppSidebar({ firstName, imageUrl, showAdmin = false }: AppSidebarProps) {
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active
      ? "bg-[var(--accent-vivid)]/12 font-semibold text-[var(--accent-vivid)]"
      : "text-[var(--text-muted)] hover:bg-[var(--surface-card)]/60"
    }`;

  return (
    <aside className="hidden md:block">
      <Surface tier={2} className="sticky safe-top-offset flex h-[calc(100dvh-1.5rem)] flex-col p-3 lg:p-4">
        <Link to="/" className="mb-4 flex items-center gap-2 rounded-xl px-2 py-1.5">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[var(--accent-vivid)] text-[var(--text-on-accent)] text-xs font-bold">
            G
          </div>
          <span className="text-base font-display font-bold text-[var(--text-primary)]">GrowPot</span>
        </Link>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Workspace</p>
        <div className="space-y-2">
          {showAdmin && (
            <Link to="/admin" className={navItemClass(isActive("/admin"))}>
              <ShieldAlert size={16} />
              Admin
            </Link>
          )}
          <Link to="/" className={navItemClass(isActive("/"))}>
            <Home size={16} />
            Dashboard
          </Link>
          <Link to="/pots" className={navItemClass(isActive("/pots"))}>
            <WalletCards size={16} />
            Pots
          </Link>
          <Link to="/settings" className={navItemClass(isActive("/settings"))}>
            <SettingsIcon size={16} />
            Settings
          </Link>
        </div>
        <div className="mt-5 rounded-xl bg-[var(--surface-card)]/65 p-3">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Desktop scaffold</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Data-backed widgets can be added here as backend endpoints expand.
          </p>
        </div>

        <div className="mt-auto border-t border-[var(--border-subtle)]/70 pt-3">
          <Link to="/settings" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-[var(--surface-card)]/60 transition-colors">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-[var(--border-subtle)] shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[var(--surface-deep)] text-xs font-semibold text-[var(--text-muted)]">
                  {firstName?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{firstName || "User"}</p>
              <p className="text-xs text-[var(--text-muted)]">Profile settings</p>
            </div>
          </Link>
        </div>
      </Surface>
    </aside>
  );
}
