import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useLocation } from "react-router-dom";
import { Bell, CalendarClock, CheckCircle2, Home, Plus, Search, Settings as SettingsIcon, ShieldAlert, ShieldCheck, WalletCards } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { PotCard } from "../components/PotCard";
import { VerificationModal } from "../components/VerificationModal";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { GlassSurface } from "../components/ui/GlassSurface";
import { UserMenu } from "../components/UserMenu";
import { formatCurrency } from "../lib/utils";

type VerificationStatus = "UNVERIFIED" | "PENDING" | "REJECTED";
type DashboardMode = "joined" | "organized";

function VerificationBanner({
    status,
    onClick,
}: {
    status: VerificationStatus;
    onClick?: () => void;
}) {
    const config = {
        UNVERIFIED: {
            title: "Verify your identity",
            message: "Upload a government ID to unlock full features and build trust.",
            icon: ShieldAlert,
            tone: "warning",
            interactive: true,
        },
        PENDING: {
            title: "Verification pending",
            message: "Your documents are under review. This usually takes up to 24 hours.",
            icon: ShieldCheck,
            tone: "warning",
            interactive: false,
        },
        REJECTED: {
            title: "Verification rejected",
            message: "Action required. Open this alert to view the reason and submit again.",
            icon: ShieldAlert,
            tone: "danger",
            interactive: true,
        },
    } as const;
    const c = config[status];
    const toneClass = c.tone === "warning"
        ? "bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)]"
        : "bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)]";
    const hoverClass = c.interactive ? (c.tone === "warning" ? "hover:bg-[var(--warning)]/15" : "hover:bg-[var(--danger)]/15") : "";
    const Icon = c.icon;

    return (
        <div
            onClick={c.interactive ? onClick : undefined}
            className={`mb-6 flex items-center gap-4 rounded-2xl border p-4 sm:mb-8 ${toneClass} ${hoverClass} ${c.interactive ? "cursor-pointer transition-colors" : ""}`}
        >
            <div className="shrink-0 rounded-full bg-black/5 p-2">
                <Icon size={22} />
            </div>
            <div>
                <h3 className="mb-1 font-semibold">{c.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{c.message}</p>
            </div>
        </div>
    );
}

function QuickActivityCard({
    title,
    value,
    hint,
    icon: Icon,
    accent = false,
}: {
    title: string;
    value: string;
    hint: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    accent?: boolean;
}) {
    return (
        <GlassSurface
            tier="glass-2"
            className={`min-w-[240px] p-5 ${accent ? "border-[var(--accent-vivid)]/35 bg-[var(--accent-soft)]/35" : ""}`}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{title}</span>
                <Icon size={16} className={accent ? "text-[var(--accent-vivid)]" : "text-[var(--text-muted)]"} />
            </div>
            <div className="text-2xl font-semibold font-mono text-[var(--text-primary)]">{value}</div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
        </GlassSurface>
    );
}

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
    const [mode, setMode] = useState<DashboardMode>("joined");

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
    const activeList = mode === "joined" ? joinedPots : managedPots;

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
                        <div className="mb-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <h1 className="truncate text-3xl font-display font-bold tracking-tight lg:text-4xl">{greeting}, {firstName}</h1>
                                    <p className="mt-1 text-sm text-[var(--accent-vivid)]">Your GrowPot is thriving</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        aria-label="Notifications"
                                        className="glass-1 relative inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-primary)]"
                                    >
                                        <Bell size={18} />
                                        <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="glass-1 flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 py-2">
                                    <Search size={16} className="text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        placeholder="Search pots or rewards..."
                                        className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                                    />
                                </div>
                                <Link
                                    to="/create"
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent-vivid)] px-5 py-2 font-semibold text-[var(--text-on-accent)] shadow-[0_8px_20px_rgba(43,110,87,0.20)] transition-opacity hover:opacity-90"
                                >
                                    <Plus size={18} />
                                    Create New Pot
                                </Link>
                            </div>
                        </div>
                        <div className="glass-1 rounded-2xl p-5">
                            <div>
                                <h1 className="text-3xl font-bold font-display">Dashboard</h1>
                                <p className="text-[var(--text-muted)]">Track your pots, payments, and next actions.</p>
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
                                {mode === "organized" ? "Pots you organize" : "Pots you joined"}
                            </h2>
                            <span className="rounded-full bg-[var(--surface-deep)]/80 px-2 py-0.5 text-sm text-[var(--text-muted)]">
                                {activeList.length}
                            </span>
                        </div>
                        <SegmentedControl
                            value={mode}
                            onChange={setMode}
                            options={[
                                { value: "joined", label: "Participating" },
                                { value: "organized", label: "Organizing" },
                            ]}
                        />
                    </div>

                    {!pots ? (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="glass-2 h-48 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : activeList.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/30 py-12 text-center text-[var(--text-muted)]">
                            {mode === "organized" ? "You are not organizing any pots yet." : "You have not joined any pots yet."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {activeList.map((pot) => (
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
