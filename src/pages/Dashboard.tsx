import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { CalendarClock, CheckCircle2, ChevronRight, Plus, WalletCards } from "lucide-react";

import { VerificationModal } from "@/components/auth/VerificationModal";
import { QuickActivityCard } from "@/components/dashboard/QuickActivityCard";
import { VerificationBanner } from "@/components/dashboard/VerificationBanner";
import { PageShell } from "@/components/layout/PageShell";
import { UserMenu } from "@/components/layout/UserMenu";
import { PotCard } from "@/components/shared/PotCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatCurrency } from "@/lib/utils";

import { api } from "../../convex/_generated/api";

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
    const [potView, setPotView] = useState<"participating" | "organizing">("participating");

    const managedPots = useMemo(() => pots?.filter((p) => p.foremanId === user?._id) || [], [pots, user?._id]);
    const joinedPots = useMemo(() => pots?.filter((p) => p.foremanId !== user?._id) || [], [pots, user?._id]);

    const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "there";

    const pendingApprovals = useMemo(() => {
        if (!managedPots.length) return 0;
        return managedPots.reduce((acc, pot) => {
            const tx = (pot as unknown as { transactions?: Array<{ status: string }> }).transactions || [];
            return acc + tx.filter((t) => t.status === "PENDING").length;
        }, 0);
    }, [managedPots]);

    const nextPaymentAmount = joinedPots[0]?.config.contribution || managedPots[0]?.config.contribution || 0;
    const nextPaymentCurrency = joinedPots[0]?.config.currency || managedPots[0]?.config.currency || "INR";
    const filteredPots = potView === "organizing" ? managedPots : joinedPots;
    const recentPots = filteredPots.slice(0, 4);

    const greeting = getGreeting();
    const displayName = user?.name?.split(" ")[0] || "there";

    return (
        <PageShell
            maxWidth="xl"
            title={`${greeting}, ${displayName}`}
            subtitle="Your UniGro is thriving"
            titleClassName="text-3xl sm:text-4xl"
            subtitleClassName="text-sm text-[var(--accent-vivid)]"
            headerClassName="relative"
            actionsClassName="absolute right-0 top-0"
            actions={
                <>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <UserMenu
                            placement="bottom-end"
                            trigger={
                                <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-[var(--accent-vivid)]/25">
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
                </>
            }
        >
            {user && user.verificationStatus === "UNVERIFIED" && (
                <VerificationBanner status="UNVERIFIED" onClick={() => setShowVerificationModal(true)} />
            )}
            {user && user.verificationStatus === "PENDING" && <VerificationBanner status="PENDING" />}
            {user && user.verificationStatus === "REJECTED" && (
                <VerificationBanner status="REJECTED" onClick={() => setShowVerificationModal(true)} />
            )}

            <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Quick activity</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
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
                    <Link
                        to="/create"
                        className="group min-w-[240px] rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/20 p-5 text-left transition-colors hover:border-[var(--accent-vivid)]/40 hover:bg-[var(--accent-vivid)]/8"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Create pot</span>
                            <Plus size={16} className="text-[var(--accent-vivid)]" />
                        </div>
                        <div className="text-xl font-semibold text-[var(--text-primary)]">Start a new pot</div>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">Set up members, payouts, and schedule.</p>
                    </Link>
                </div>
            </section>

            <section className="mb-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <Link to="/pots" className="group inline-flex items-center gap-2">
                        <h2 className="text-2xl font-semibold font-display text-[var(--text-primary)] group-hover:text-[var(--accent-vivid)] transition-colors">
                            My pots
                        </h2>
                        <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-vivid)] transition-colors" />
                    </Link>
                    <div className="ml-auto flex items-center gap-2">
                        <SegmentedControl
                            value={potView}
                            onChange={setPotView}
                            options={[
                                { value: "participating", label: "Participating", count: joinedPots.length },
                                { value: "organizing", label: "Organizing", count: managedPots.length },
                            ]}
                        />
                    </div>
                </div>

                {!pots ? (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="glass-2 h-48 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : recentPots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/30 py-12 text-center text-[var(--text-muted)]">
                        {potView === "organizing"
                            ? "You are not organizing any pots yet."
                            : "You have not joined any pots yet."}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {recentPots.map((pot) => (
                                <PotCard key={pot._id} pot={pot} currentUserId={user?._id} />
                            ))}
                        </div>
                        {filteredPots.length > recentPots.length ? (
                            <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                                <span>Showing {recentPots.length} of {filteredPots.length} pots</span>
                                <Link to="/pots" className="font-semibold text-[var(--accent-vivid)] hover:underline">
                                    See all
                                </Link>
                            </div>
                        ) : null}
                    </>
                )}
            </section>

            {showVerificationModal && <VerificationModal onClose={() => setShowVerificationModal(false)} />}
        </PageShell>
    );
}
