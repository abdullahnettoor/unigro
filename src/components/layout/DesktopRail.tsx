import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavAdminIcon, NavHomeIcon, NavPoolsIcon, NavSettingsIcon } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DesktopRailProps {
    showAdmin?: boolean;
    userImageUrl?: string;
    userName?: string;
}

interface NavItem {
    icon: React.ReactNode;
    label: string;
    to: string;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    { icon: <NavHomeIcon size={20} />, label: "Home", to: "/" },
    { icon: <NavPoolsIcon size={20} />, label: "My Pools", to: "/pools" },
    { icon: <NavSettingsIcon size={20} />, label: "Settings", to: "/settings" },
    { icon: <NavAdminIcon size={20} />, label: "Admin", to: "/admin", adminOnly: true },
];

export function DesktopRail({ showAdmin = false, userImageUrl, userName }: DesktopRailProps) {
    const location = useLocation();
    const [expanded, setExpanded] = useState(false);

    const isActive = (to: string) =>
        to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    // Hide on detail/create pages
    if (
        location.pathname.startsWith("/pools/") ||
        location.pathname === "/create"
    ) {
        return null;
    }

    const visibleItems = navItems.filter((item) => !item.adminOnly || showAdmin);

    return (
        <TooltipProvider delayDuration={300}>
            <aside
                className={cn(
                    "hidden lg:flex flex-col",
                    "fixed left-0 top-0 h-full z-40",
                    "border-r border-[var(--border-subtle)]/60",
                    "glass-2",
                    "bg-[var(--surface-1)]/40",
                    "transition-all duration-300 ease-in-out",
                    expanded ? "w-[220px]" : "w-[64px]"
                )}
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
            >
                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-3 px-3.5 py-5 overflow-hidden"
                    aria-label="UniGro Home"
                >
                    <img
                        src="/monogram.svg"
                        alt="UniGro"
                        className="h-7 w-7 shrink-0"
                    />
                    <span
                        className={cn(
                            "font-display font-bold text-base text-[var(--text-primary)] whitespace-nowrap",
                            "transition-all duration-200",
                            expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                        )}
                    >
                        UniGro
                    </span>
                </Link>

                {/* Divider */}
                <div className="mx-3 h-px bg-[var(--border-subtle)]/60 mb-3" />

                {/* Nav items */}
                <nav className="flex-1 flex flex-col gap-1 px-2" aria-label="Main navigation">
                    {visibleItems.map((item) => {
                        const active = isActive(item.to);
                        return (
                            <Tooltip key={item.to}>
                                <TooltipTrigger asChild>
                                    <Link
                                        to={item.to}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                            "relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl",
                                            "transition-all duration-200 overflow-hidden",
                                            active
                                                ? "text-[var(--accent-vivid)]"
                                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        {active && (
                                            <span className="absolute inset-0 -z-10 rounded-xl bg-[var(--accent-vivid)]/15" />
                                        )}
                                        <span className="shrink-0">{item.icon}</span>
                                        <span
                                            className={cn(
                                                "text-sm font-medium whitespace-nowrap",
                                                "transition-all duration-200",
                                                expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 w-0"
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                {!expanded && (
                                    <TooltipContent side="right">
                                        <p>{item.label}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* User avatar at bottom */}
                <div className="p-2 border-t border-[var(--border-subtle)]/60">
                    <Link
                        to="/settings"
                        className={cn(
                            "flex items-center gap-3 px-2 py-2 rounded-xl overflow-hidden",
                            "transition-all duration-200",
                            "hover:bg-white/6"
                        )}
                    >
                        <div className="h-8 w-8 shrink-0 rounded-full border border-white/15 overflow-hidden bg-[var(--surface-deep)] grid place-items-center">
                            {userImageUrl ? (
                                <img src={userImageUrl} alt={userName || "Profile"} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-[var(--text-muted)]">
                                    {userName?.charAt(0)?.toUpperCase() || "U"}
                                </span>
                            )}
                        </div>
                        <div
                            className={cn(
                                "min-w-0 transition-all duration-200",
                                expanded ? "opacity-100" : "opacity-0 w-0"
                            )}
                        >
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                {userName || "User"}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">Settings</p>
                        </div>
                    </Link>
                </div>
            </aside>
        </TooltipProvider>
    );
}
