import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import { NavHomeIcon, NavPoolsIcon, NavSettingsIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { icon: NavHomeIcon, label: "Home", to: "/" },
    { icon: NavPoolsIcon, label: "Pools", to: "/pools" },
    { icon: NavSettingsIcon, label: "Settings", to: "/settings" },
] as const;

const HIDDEN_PATHS = ["/create"];

export function BottomNav() {
    const location = useLocation();
    const navRef = useRef<HTMLElement>(null);

    const isActive = (to: string) =>
        to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    // Hide on detail and create pages
    if (
        location.pathname.startsWith("/pools/") ||
        HIDDEN_PATHS.includes(location.pathname)
    ) {
        return null;
    }

    const activeIndex = NAV_ITEMS.findIndex((item) => isActive(item.to));

    return (
        <>
            {/* Fade veil behind nav */}
            <div
                aria-hidden
                className="fixed inset-x-0 bottom-0 z-30 h-32 pointer-events-none lg:hidden"
                style={{
                    background:
                        "linear-gradient(to top, var(--bg-app) 0%, rgba(var(--bg-app-rgb), 0.96) 30%, rgba(var(--bg-app-rgb), 0.6) 70%, transparent 100%)",
                }}
            />

            {/* Nav bar */}
            <nav
                ref={navRef}
                aria-label="Main navigation"
                className={cn(
                    "fixed z-40 lg:hidden",
                    "left-1/2 -translate-x-1/2",
                    "bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]",
                    "flex items-stretch",
                    "rounded-[20px]",
                    "border border-[var(--border-subtle)]",
                    "bg-[var(--surface-1)]",
                    "shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]",
                    "overflow-hidden",
                )}
            >
                {NAV_ITEMS.map((item, i) => {
                    const active = activeIndex === i;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-label={item.label}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1",
                                "w-[72px] py-3 sm:w-20 sm:py-3.5",
                                "transition-colors duration-200",
                                active
                                    ? "text-[var(--accent-vivid)]"
                                    : "text-[var(--text-muted)] active:text-[var(--text-primary)]",
                            )}
                        >
                            {/* Active background */}
                            {active && (
                                <span
                                    className="pointer-events-none absolute inset-[3px] rounded-[15px] bg-[var(--accent-vivid)]/10"
                                    aria-hidden
                                />
                            )}

                            {/* Active top line indicator */}
                            <span
                                className={cn(
                                    "absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full transition-all duration-300",
                                    active
                                        ? "w-6 bg-[var(--accent-vivid)]"
                                        : "w-0 bg-transparent"
                                )}
                                aria-hidden
                            />

                            {/* Icon */}
                            <span
                                className={cn(
                                    "transition-transform duration-200",
                                    active ? "scale-[1.12]" : "scale-100"
                                )}
                            >
                                <Icon
                                    strokeWidth={active ? 2.2 : 1.8}
                                    className="h-[22px] w-[22px]"
                                />
                            </span>

                            {/* Label — always visible */}
                            <span
                                className={cn(
                                    "text-[10px] leading-none tracking-wide transition-all duration-200",
                                    active
                                        ? "font-semibold opacity-100"
                                        : "font-medium opacity-70"
                                )}
                            >
                                {item.label}
                            </span>

                            {/* Divider between items */}
                            {i < NAV_ITEMS.length - 1 && (
                                <span
                                    aria-hidden
                                    className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-px bg-[var(--border-subtle)]/60"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
