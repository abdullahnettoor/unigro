import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { PotCard } from "../components/PotCard";
import { CalendarClock, CheckCircle2, Plus, ShieldAlert, ShieldCheck, WalletCards } from "lucide-react";
import { VerificationModal } from "../components/VerificationModal";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { GlassSurface } from "../components/ui/GlassSurface";

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
            className={`min-w-[220px] p-4 ${accent ? "border-[var(--accent-vivid)]/35 bg-[var(--accent-soft)]/35" : ""}`}
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

export function Dashboard() {
    const pots = useQuery(api.pots.list);
    const user = useQuery(api.users.current);
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
    const activeList = mode === "joined" ? joinedPots : managedPots;

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            {user && user.verificationStatus === "UNVERIFIED" && (
                <VerificationBanner status="UNVERIFIED" onClick={() => setShowVerificationModal(true)} />
            )}
            {user && user.verificationStatus === "PENDING" && <VerificationBanner status="PENDING" />}
            {user && user.verificationStatus === "REJECTED" && (
                <VerificationBanner status="REJECTED" onClick={() => setShowVerificationModal(true)} />
            )}

            <header className="glass-3 mb-6 rounded-3xl p-4 sm:mb-8 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-display">Dashboard</h1>
                    <p className="text-[var(--text-muted)]">Track your pots, payments, and next actions.</p>
                </div>
                <Link
                    to="/create"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-vivid)] px-4 py-2 font-semibold text-[var(--text-on-accent)] shadow-[0_10px_25px_rgba(43,110,87,0.25)] transition-opacity hover:opacity-90 sm:w-auto"
                >
                    <Plus size={18} />
                    New Pot
                </Link>
                </div>
            </header>

            <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Quick activity</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible">
                    <QuickActivityCard
                        title="Next payment"
                        value={`₹${nextPaymentAmount.toLocaleString()}`}
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
                <SegmentedControl
                    className="mb-4"
                    value={mode}
                    onChange={setMode}
                    options={[
                        { value: "joined", label: "Participating" },
                        { value: "organized", label: "Organizing" },
                    ]}
                />
                <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-2xl font-semibold font-display">
                        {mode === "organized" ? "Pots you organize" : "Pots you joined"}
                    </h2>
                    <span className="rounded-full bg-[var(--surface-deep)]/80 px-2 py-0.5 text-sm text-[var(--text-muted)]">
                        {activeList.length}
                    </span>
                </div>

                {!pots ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-48 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/50" />
                        ))}
                    </div>
                ) : activeList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/30 py-12 text-center text-[var(--text-muted)]">
                        {mode === "organized" ? "You are not organizing any pots yet." : "You have not joined any pots yet."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {activeList.map((pot) => (
                            <PotCard key={pot._id} pot={pot} currentUserId={user?._id} />
                        ))}
                    </div>
                )}
            </section>

            {showVerificationModal && <VerificationModal onClose={() => setShowVerificationModal(false)} />}
        </div>
    );
}
