import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { Bell, CalendarClock, CheckCircle2, Home, Plus, Settings as SettingsIcon, ShieldAlert, WalletCards } from "lucide-react";

import { VerificationModal } from "@/components/auth/VerificationModal";
import { QuickActivityCard } from "@/components/dashboard/QuickActivityCard";
import { VerificationBanner } from "@/components/dashboard/VerificationBanner";
import { UserMenu } from "@/components/layout/UserMenu";
import { PotCard } from "@/components/shared/PotCard";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { formatCurrency } from "@/lib/utils";

import { api } from "../../convex/_generated/api";

export function DashboardSidebar({
    firstName,
    imageUrl,
}: {
    firstName: string;
    imageUrl?: string;
}) {
    const location = useLocation();
    const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));
    const navItemClass = (active: boolean) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active
            ? "bg-[var(--accent-vivid)]/12 font-semibold text-[var(--accent-vivid)]"
            : "text-[var(--text-muted)] hover:bg-[var(--surface-card)]/60"
        }`;

    return (
        <aside className="hidden md:block">
            <GlassSurface tier="glass-2" className="sticky top-3 flex h-[calc(100vh-1.5rem)] flex-col p-3 lg:p-4">
                <Link to="/" className="mb-4 flex items-center gap-2 rounded-xl px-2 py-1.5">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-[var(--accent-vivid)] text-[var(--text-on-accent)] text-xs font-bold">
                        G
                    </div>
                    <span className="text-base font-display font-bold text-[var(--text-primary)]">GrowPot</span>
                </Link>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Workspace</p>
                <div className="space-y-2">
                    {firstName === "Admin" && (
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
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Data-backed widgets can be added here as backend endpoints expand.</p>
                </div>

                <div className="mt-auto border-t border-[var(--border-subtle)]/70 pt-3">
                    <UserMenu
                        placement="top-center"
                        menuClassName="w-full"
                        trigger={
                            <div className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left">
                                <div className="h-9 w-9 overflow-hidden rounded-full border border-[var(--border-subtle)]">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="grid h-full w-full place-items-center bg-[var(--surface-deep)] text-xs font-semibold text-[var(--text-muted)]">
                                            {firstName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 text-left">
                                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{firstName}</p>
                                    <p className="text-xs text-[var(--text-muted)]">Profile menu</p>
                                </div>
                            </div>
                        }
                    />
                </div>
            </GlassSurface>
        </aside>
    );
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

export function Dashboard() {
    const pots = useQuery(api.pots.list);
    const user = useQuery(api.users.current);
    const { user: clerkUser } = useUser();
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const managedPots = useMemo(() => pots?.filter((p) => p.foremanId === user?._id) || [], [pots, user?._id]);
    const joinedPots = useMemo(() => pots?.filter((p) => p.foremanId !== user?._id) || [], [pots, user?._id]);

    const pendingApprovals = useMemo(() => {
        if (!managedPots.length) return 0;
        return managedPots.reduce((acc, pot) => {
            const tx = (pot as unknown as { transactions?: Array<{ status: string }> }).transactions || [];
            return acc + tx.filter((t) => t.status === "PENDING").length;
        }, 0);
    }, [managedPots]);

    const nextPaymentAmount = joinedPots[0]?.config.contribution || managedPots[0]?.config.contribution || 0;
    const nextPaymentCurrency = joinedPots[0]?.config.currency || managedPots[0]?.config.currency || "INR";
    const recentPots = pots?.slice(0, 4) || [];

    const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "there";
    const greeting = getGreeting();

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-5 md:py-3 lg:gap-6">
            <DashboardSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} />

            <div className="md:py-4">
                {user && user.verificationStatus === "UNVERIFIED" && (
                    <VerificationBanner status="UNVERIFIED" onClick={() => setShowVerificationModal(true)} />
                )}
                {user && user.verificationStatus === "PENDING" && <VerificationBanner status="PENDING" />}
                {user && user.verificationStatus === "REJECTED" && (
                    <VerificationBanner status="REJECTED" onClick={() => setShowVerificationModal(true)} />
                )}

                <header className="mb-6 sm:mb-8">
                    <div className="rounded-2xl p-1 md:hidden">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-3xl font-display font-bold tracking-tight">{greeting}, {firstName}</h1>
                                <p className="mt-1 text-sm text-[var(--accent-vivid)]">Your GrowPot is thriving</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    aria-label="Notifications"
                                    className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--surface-deep)]/70"
                                >
                                    <Bell size={18} />
                                    <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                                </button>
                                <UserMenu
                                    placement="bottom-end"
                                    trigger={
                                        <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-[var(--accent-vivid)]/25">
                                            {clerkUser?.imageUrl ? (
                                                <img src={clerkUser.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="grid h-full w-full place-items-center bg-[var(--surface-deep)] text-sm font-semibold text-[var(--text-muted)]">
                                                    {firstName.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-3xl font-display font-bold tracking-tight lg:text-4xl">{greeting}, {firstName}</h1>
                                <p className="mt-1 text-sm text-[var(--accent-vivid)]">Your GrowPot is thriving</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    aria-label="Notifications"
                                    className="glass-1 relative inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-primary)]"
                                >
                                    <Bell size={18} />
                                    <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                                </button>
                                <Link
                                    to="/create"
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent-vivid)] px-5 py-2 font-semibold text-[var(--text-on-accent)] shadow-[0_8px_20px_rgba(43,110,87,0.20)] transition-opacity hover:opacity-90"
                                >
                                    <Plus size={18} />
                                    Create New Pot
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="mb-8">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Quick activity</h2>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
                        <QuickActivityCard
                            title="Next payment"
                            value={formatCurrency(nextPaymentAmount, nextPaymentCurrency)}
                            hint={nextPaymentAmount > 0 ? "Your next due contribution" : "Join a pot to see upcoming dues"}
                            icon={CalendarClock}
                            accent
                        />
                        <QuickActivityCard
                            title="Pending approvals"
                            value={`${pendingApprovals}`}
                            hint="Approvals waiting in your organized pots"
                            icon={CheckCircle2}
                        />
                        <QuickActivityCard
                            title="Your active pots"
                            value={`${(joinedPots.length + managedPots.length).toString()}`}
                            hint={`${managedPots.length} organized · ${joinedPots.length} joined`}
                            icon={WalletCards}
                        />
                    </div>
                </section>

                <section className="mb-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-semibold font-display">
                                Recent pots
                            </h2>
                            <span className="rounded-full bg-[var(--surface-deep)]/80 px-2 py-0.5 text-sm text-[var(--text-muted)]">
                                {pots?.length || 0}
                            </span>
                        </div>
                        <Link to="/pots" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--surface-deep)]/50 px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
                            View All Pots
                        </Link>
                    </div>

                    {!pots ? (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="glass-2 h-48 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : recentPots.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/30 py-12 text-center text-[var(--text-muted)]">
                            You have not joined or organized any pots yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {recentPots.map((pot) => (
                                <PotCard key={pot._id} pot={pot} currentUserId={user?._id} />
                            ))}
                        </div>
                    )}
                </section>

                {showVerificationModal && <VerificationModal onClose={() => setShowVerificationModal(false)} />}
            </div>
        </div>
    );
}
