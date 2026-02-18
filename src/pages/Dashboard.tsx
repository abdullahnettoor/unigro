import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { PotCard } from "../components/PotCard";
import { Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { VerificationModal } from "../components/VerificationModal";

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
                <div
                    onClick={() => setShowVerificationModal(true)}
                    className="mb-6 sm:mb-8 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[var(--warning)]/20 transition-colors"
                >
                    <div className="bg-[var(--warning)]/20 p-2 rounded-full text-[var(--warning)] shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h3 className="text-[var(--warning)] font-bold mb-1">Verify your identity</h3>
                        <p className="text-[var(--text-muted)] text-sm">Upload a Government ID to build trust and unlock full features.</p>
                    </div>
                </div>
            )}

            {user && user.verificationStatus === "PENDING" && (
                <div className="mb-6 sm:mb-8 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-xl flex items-center gap-4">
                    <div className="bg-[var(--warning)]/20 p-2 rounded-full text-[var(--warning)] shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="text-[var(--warning)] font-bold mb-1">Verification Pending</h3>
                        <p className="text-[var(--text-muted)] text-sm">Your documents are under review. This usually takes 24 hours.</p>
                    </div>
                </div>
            )}

            {user && user.verificationStatus === "REJECTED" && (
                <div
                    onClick={() => setShowVerificationModal(true)}
                    className="mb-6 sm:mb-8 p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[var(--danger)]/20 transition-colors"
                >
                    <div className="bg-[var(--danger)]/20 p-2 rounded-full text-[var(--danger)] shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h3 className="text-[var(--danger)] font-bold mb-1">Verification Rejected</h3>
                        <p className="text-[var(--text-muted)] text-sm">Action required. Click to view reason and resubmit.</p>
                    </div>
                </div>
            )}

            {/* Global Header */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold">Dashboard</h1>
                    <p className="text-[var(--text-muted)]">Track your pots, payments, and investments.</p>
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
                                {pots && <span className="bg-[var(--surface-deep)]/80 text-sm px-2 py-0.5 rounded-full text-[var(--text-muted)]">{managedPots.length}</span>}
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
                            {pots && <span className="bg-[var(--surface-deep)]/80 text-sm px-2 py-0.5 rounded-full text-[var(--text-muted)]">{joinedPots.length}</span>}
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
