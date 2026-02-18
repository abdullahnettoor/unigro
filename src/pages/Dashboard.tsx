import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { PotCard } from "../components/PotCard";
import { Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { VerificationModal } from "../components/VerificationModal";

type VerificationStatus = "UNVERIFIED" | "PENDING" | "REJECTED";

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
            className={`mb-6 rounded-2xl border p-4 sm:mb-8 ${toneClass} ${hoverClass} flex items-center gap-4 ${c.interactive ? "cursor-pointer transition-colors" : ""}`}
        >
            <div className="shrink-0 rounded-full bg-black/5 p-2">
                <Icon size={22} />
            </div>
            <div>
                <h3 className="mb-1 font-bold">{c.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{c.message}</p>
            </div>
        </div>
    );
}

export function Dashboard() {
    const pots = useQuery(api.pots.list);
    const user = useQuery(api.users.current);
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const managedPots = pots?.filter(p => p.foremanId === user?._id) || [];
    const joinedPots = pots?.filter(p => p.foremanId !== user?._id) || [];

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 sm:py-8">

            {/* Verification Banner */}
            {user && user.verificationStatus === "UNVERIFIED" && (
                <VerificationBanner status="UNVERIFIED" onClick={() => setShowVerificationModal(true)} />
            )}

            {user && user.verificationStatus === "PENDING" && (
                <VerificationBanner status="PENDING" />
            )}

            {user && user.verificationStatus === "REJECTED" && (
                <VerificationBanner status="REJECTED" onClick={() => setShowVerificationModal(true)} />
            )}

            {/* Global Header */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold">Dashboard</h1>
                    <p className="text-[var(--text-muted)]">Track your pots, payments, and upcoming cycles.</p>
                </div>
                <Link
                    to="/create"
                    className="flex items-center justify-center gap-2 bg-[var(--accent-vivid)] text-[var(--text-on-accent)] px-4 py-2 rounded-full font-bold hover:opacity-90 transition-opacity w-full sm:w-auto"
                >
                    <Plus size={20} />
                    New Pot
                </Link>
            </header>

            {/* Managed Section - Only show if user manages pots */}
            {managedPots.length > 0 && (
                <section className="mb-12">
                    <header className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
                                Pots you organize
                                {pots && <span className="rounded-full bg-[var(--surface-deep)]/80 px-2 py-0.5 text-sm text-[var(--text-muted)]">{managedPots.length}</span>}
                            </h2>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {managedPots.map((pot) => (
                            <PotCard key={pot._id} pot={pot} currentUserId={user?._id} />
                        ))}
                    </div>
                </section>
            )}

            {/* Investments Section */}
            <section>
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-display font-bold flex items-center gap-3">
                            Pots you joined
                            {pots && <span className="rounded-full bg-[var(--surface-deep)]/80 px-2 py-0.5 text-sm text-[var(--text-muted)]">{joinedPots.length}</span>}
                        </h2>
                    </div>
                </header>

                {!pots ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(i => <div key={i} className="bg-[var(--surface-elevated)]/50 h-40 rounded-2xl animate-pulse border border-[var(--border-subtle)]" />)}
                    </div>
                ) : joinedPots.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--surface-elevated)]/30">
                        <p className="text-[var(--text-muted)]">You haven't joined any pots yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {joinedPots.map((pot) => (
                            <PotCard key={pot._id} pot={pot} currentUserId={user?._id} />
                        ))}
                    </div>
                )}
            </section>

            {showVerificationModal && (
                <VerificationModal onClose={() => setShowVerificationModal(false)} />
            )}
        </div>
    );
}
