import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import {
    AlertCircle,
    Clock,
    LogOut,
    Monitor,
    Moon,
    Settings,
    ShieldCheck,
    Sun,
    User
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getThemePreference, setThemePreference, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";

interface UserMenuProps {
    trigger?: React.ReactNode;
    placement?: "bottom-end" | "top-end" | "top-center";
    menuClassName?: string;
}

export function UserMenu({ trigger, placement = "bottom-end", menuClassName }: UserMenuProps) {
    const { user } = useUser();
    const { signOut, openUserProfile } = useClerk();
    const convexUser = useQuery(api.users.current);

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<ThemePreference>(() => getThemePreference());

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const status = (convexUser?.verificationStatus as string) || "UNVERIFIED";

    const handleThemeChange = (newTheme: ThemePreference) => {
        setTheme(newTheme);
        setThemePreference(newTheme);
    };

    const StatusIcon = {
        VERIFIED: ShieldCheck,
        PENDING: Clock,
        UNVERIFIED: AlertCircle,
        REJECTED: AlertCircle
    }[status] || AlertCircle;

    const statusColor = {
        VERIFIED: "text-[var(--success)]",
        PENDING: "text-[var(--warning)]",
        UNVERIFIED: "text-[var(--text-muted)]",
        REJECTED: "text-[var(--danger)]"
    }[status];

    // Determine position classes
    let positionClasses = "absolute right-0 mt-3"; // bottom-end (default)
    let animationClasses = "animate-in fade-in slide-in-from-top-2";

    if (placement === "top-end") {
        positionClasses = "absolute right-0 bottom-full mb-3";
        animationClasses = "animate-in fade-in slide-in-from-bottom-2";
    } else if (placement === "top-center") {
        positionClasses = "absolute left-0 right-0 bottom-full mb-3";
        animationClasses = "animate-in fade-in slide-in-from-bottom-2";
    }

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger */}
            {trigger ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Open profile menu"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    className="cursor-pointer"
                >
                    {trigger}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Open profile menu"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    className={`relative rounded-full transition-all ring-2 ring-offset-2 ring-offset-[var(--bg-app)] ${isOpen ? 'ring-[var(--accent-vivid)]' : 'ring-transparent hover:ring-[var(--border-subtle)]'}`}
                >
                    <img
                        src={user.imageUrl}
                        alt={user.fullName || "User"}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                    />
                    {/* Status Indicator Dot */}
                    {status === "VERIFIED" && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-[var(--success)] text-[var(--text-on-accent)] p-0.5 rounded-full ring-2 ring-[var(--bg-app)]">
                            <ShieldCheck size={10} />
                        </div>
                    )}
                </button>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={cn(
                    positionClasses,
                    "glass-3 w-[calc(100vw-2rem)] max-w-72 rounded-2xl shadow-xl p-2 z-50 duration-200",
                    animationClasses,
                    menuClassName
                )}>

                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-[var(--border-subtle)] mb-2">
                        <p className="font-bold text-[var(--text-primary)] truncate">{user.fullName}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{user.primaryEmailAddress?.emailAddress}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                        <Link
                            to="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-2.5 text-sm rounded-xl hover:bg-[var(--surface-deep)] transition-colors group"
                        >
                            <div className="flex items-center gap-3 text-[var(--text-primary)]">
                                <Settings size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-vivid)]" />
                                <span>Settings</span>
                            </div>
                            {/* Verification Badge */}
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[var(--surface-card)] ${statusColor} border-[var(--border-subtle)]`}>
                                <StatusIcon size={12} />
                                {status === "VERIFIED" ? "Verified" : "Check status"}
                            </div>
                        </Link>

                        <Button
                            onClick={() => { openUserProfile(); setIsOpen(false); }}
                            variant="ghost"
                            className="flex items-center justify-start gap-3 w-full px-4 text-sm text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-deep)] group"
                        >
                            <User size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-vivid)]" />
                            <span className="whitespace-nowrap">Manage account</span>
                        </Button>
                    </div>

                    {/* Theme Toggle */}
                    <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] px-2">
                        <div className="flex bg-[var(--surface-deep)]/50 p-1 rounded-xl">
                            {[
                                { id: "light", icon: Sun, label: "Light" },
                                { id: "dark", icon: Moon, label: "Dark" },
                                { id: "system", icon: Monitor, label: "System" }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleThemeChange(opt.id as ThemePreference)}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${theme === opt.id
                                        ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        }`}
                                    title={opt.label}
                                >
                                    <opt.icon size={14} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                        <Button
                            onClick={() => signOut()}
                            variant="danger"
                            className="flex items-center justify-start gap-3 w-full px-4 text-sm rounded-xl"
                        >
                            <LogOut size={18} />
                            <span>Sign out</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
