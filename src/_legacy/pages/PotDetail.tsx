import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SignInButton } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Coins, Edit2, Gavel, ShieldAlert } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { DesktopSidebar } from "@/components/pot-detail/DesktopSidebar";
import { MemberDashboard } from "@/components/pot-detail/MemberDashboard";
import { MembersList } from "@/components/pot-detail/MembersList";
import { MobileActionBar } from "@/components/pot-detail/MobileActionBar";
import { MobileStats } from "@/components/pot-detail/MobileStats";
import { AddMemberModal } from "@/components/pot-detail/modals/AddMemberModal";
import { DeletePotModal } from "@/components/pot-detail/modals/DeletePotModal";
import { JoinPotModal } from "@/components/pot-detail/modals/JoinPotModal";
import { NextRoundModal } from "@/components/pot-detail/modals/NextRoundModal"; // New
import { RunDrawAnimationModal } from "@/components/pot-detail/modals/RunDrawAnimationModal";
import { SplitSlotModal } from "@/components/pot-detail/modals/SplitSlotModal"; // New
import { WinnerSelectionModal } from "@/components/pot-detail/modals/WinnerSelectionModal";
import { OrganizeTab } from "@/components/pot-detail/OrganizeTab";
import { PaymentModal } from "@/components/pot-detail/PaymentComponents";
import { PotHero } from "@/components/pot-detail/PotHero";
import { PotHistory } from "@/components/pot-detail/PotHistory"; // New
import { RulesTab } from "@/components/pot-detail/RulesTab";
import { SlotsTab } from "@/components/pot-detail/SlotsTab";
import { TabNav } from "@/components/pot-detail/TabNav";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Button } from "@/components/ui/button";
import { LogoLoader } from "@/components/ui/LogoLoader";
import { Surface } from "@/components/ui/Surface";
import { getNextCycleDate, getPotDisplayProgress, getPotFinancials, getSlotStats, getVirtualOpenSlots } from "@/lib/pot";
import { formatCurrency } from "@/lib/utils";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export type Tab = 'dashboard' | 'rules' | 'slots' | 'members' | 'history' | 'approvals' | 'organize';

import { OrganizerDisplay } from "@/components/pot-detail/OrganizerDisplay";

export function PotDetail() {
    const { potId } = useParams<{ potId: string }>();
    const navigate = useNavigate();

    const pot = useQuery(api.pots.get, { potId: potId as Id<"pots"> });
    const currentUser = useQuery(api.users.current);
    const transactions = useQuery(api.transactions.list, { potId: potId as Id<"pots"> });

    const activatePot = useMutation(api.pots.activate);
    const runDraw = useMutation(api.pots.runDraw);
    const deleteSlot = useMutation(api.pots.deleteSlot);
    const recordCashPayment = useMutation(api.transactions.recordCashPayment); // Hoisted for Foreman Action
    const foremanDetails = useQuery(api.users.get, { userId: pot?.foremanId || "" as any });
    const feedback = useFeedback();

    // UI State
    const [showAddMember, setShowAddMember] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false); // New
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showNextRoundModal, setShowNextRoundModal] = useState(false);
    const [showDeletePotModal, setShowDeletePotModal] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showMobileStats, setShowMobileStats] = useState(false);
    const [showRunDrawAnimation, setShowRunDrawAnimation] = useState(false);

    const [showWinnerSelection, setShowWinnerSelection] = useState(false);
    const [selectedWinnerSlotNum, setSelectedWinnerSlotNum] = useState<number | null>(null);

    // Global Payment Modal State (for History & Foreman actions)
    const [globalPaymentState, setGlobalPaymentState] = useState<{
        slotId: Id<"slots">,
        cycle: number,
        amount: number,
        isForemanAction?: boolean, // New: Trigger Foreman Mode
        userId?: Id<"users"> // For Foreman to know who he is marking for
    } | null>(null);

    const [activeTab, setActiveTab] = useState<Tab>('rules');

    // Computed State
    const isDraft = pot?.status === "DRAFT";
    const isActive = pot?.status === "ACTIVE";

    const isForeman = currentUser?._id === pot?.foremanId;
    // Source Deduplication: Ensure allSlots contains unique items by _id
    const dbSlots = pot?.slots || [];
    const allSlots = Array.from(new Map(dbSlots.map(s => [s._id, s])).values());

    const mySlots = currentUser ? allSlots.filter(s =>
        s.userId === currentUser._id ||
        (s.isSplit && (s as any).splitOwners?.some((o: any) => o.userId === currentUser._id))
    ) : [];

    // Ghost Membership Recognition
    const [isGhostMember, setIsGhostMember] = useState(false);
    useEffect(() => {
        const guestIds = JSON.parse(localStorage.getItem("unigro_ghost_memberships") || "[]");
        if (guestIds.length > 0 && !currentUser) {
            const joinedAsGhost = allSlots.some(s => s.userId && guestIds.includes(s.userId));
            setIsGhostMember(joinedAsGhost);
        } else {
            setIsGhostMember(false);
        }
    }, [allSlots, currentUser]);

    const isMember = mySlots.length > 0 || isGhostMember;
    const activeSlots = allSlots.filter(s => s.status === "FILLED" || s.status === "RESERVED");

    // Use shared utilities for slot/progress calculations
    const { filledSlots: filledCount, availableSlots: availableCount, hasOpenSlots } = getSlotStats(
        pot || { status: "", currentMonth: 0, config: { totalSlots: 0, duration: 0, contribution: 0, totalValue: 0, frequency: "" } },
        allSlots as any
    );
    const virtualOpenSlots = pot ? getVirtualOpenSlots(pot as any, allSlots as any) : [];

    const splitEligibleSlots = [
        ...virtualOpenSlots.map(s => ({ ...s, remainingPercentage: 100 })),
        ...allSlots
            .filter(s => s.isSplit)
            .map(s => {
                const filledShares = (s as any).splitOwners
                    ?.filter((o: any) => o.status === "ACTIVE")
                    .reduce((sum: number, o: any) => sum + o.sharePercentage, 0) || 0;
                return {
                    ...s,
                    remainingPercentage: 100 - filledShares
                };
            })
            .filter(s => s.remainingPercentage > 0)
    ];

    // Progress bar uses shared utility
    const progressInfo = pot ? getPotDisplayProgress(pot as any, allSlots as any, (transactions || []) as any) : null;
    const displayProgress = progressInfo?.percent ?? 0;

    // Keep default tab role-aware without state updates during render.
    useEffect(() => {
        setActiveTab((prev) => {
            if (prev !== "rules") return prev;
            if (currentUser && isForeman) return "organize";
            return currentUser && isMember ? "dashboard" : "rules";
        });
    }, [currentUser, isMember, isForeman]);

    if (pot === undefined || transactions === undefined) {
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--bg-app)]">
                <LogoLoader size="lg" />
            </div>
        );
    }

    if (pot === null) {
        return (
            <PageShell title="Pot Not Found">
                <div className="max-w-2xl mx-auto py-12 px-6 text-center space-y-6">
                    <ShieldAlert size={48} className="mx-auto text-[var(--danger)]/80" />
                    <h2 className="text-xl font-bold">This pot doesn't exist</h2>
                    <p className="text-[var(--text-muted)] text-sm">
                        It may have been deleted by the organizer or the link is invalid.
                    </p>
                    <Button onClick={() => navigate("/")} variant="primary">
                        Return to Dashboard
                    </Button>
                </div>
            </PageShell>
        );
    }


    const { commissionPct, commissionAmount, winningAmount } = getPotFinancials(pot as any);
    const gracePeriod = pot.config.gracePeriodDays || 0;

    // Date Logic — uses shared utility
    const nextDueDate = getNextCycleDate(pot.startDate, pot.currentMonth, pot.config.frequency).dateStr;
    const nextDrawDate = getNextCycleDate(pot.startDate, pot.currentMonth, pot.config.frequency, gracePeriod, pot.nextDrawDate).dateStr;

    // Actions
    const handleActivate = async () => {
        if (availableCount > 0) {
            feedback.toast.info("Cannot activate yet", `${availableCount} slots are still empty.`);
            return;
        }
        const ok = await feedback.confirm({
            title: "Activate pot?",
            message: "Financial rules will be locked after activation.",
            confirmText: "Activate",
        });
        if (!ok) return;
        try {
            await activatePot({ potId: pot._id });
            feedback.toast.success("Pot activated", "Members can now start payments.");
        } catch (error: any) {
            console.error(error);
            const msg = error.message.includes("Verified") ? "You must be verified to activate a pot." : "Failed to activate pot.";
            feedback.toast.error("Activation failed", msg);
        }
    };

    const handleContactOrganizer = () => {
        if (!foremanDetails) return;
        const body = `Hi ${foremanDetails.name}, I'm interested in joining your pot "${pot.title}", but it appears to be full. Please let me know if a slot becomes available.`;
        const encodedBody = encodeURIComponent(body);
        const subject = encodeURIComponent(`Inquiry about UniGro: ${pot.title}`);

        if (foremanDetails.phone) {
            window.open(`https://wa.me/${foremanDetails.phone.replace(/\D/g, '')}?text=${encodedBody}`, '_blank');
        } else if (foremanDetails.email) {
            window.location.href = `mailto:${foremanDetails.email}?subject=${subject}&body=${encodedBody}`;
        } else {
            feedback.toast.info("Contact Organizer", `Please contact ${foremanDetails.name} directly.`);
        }
    };


    /** Used by RunDrawAnimationModal — fires the mutation and returns the winning slot number */
    const executeRandomDraw = async (): Promise<number> => {
        setIsDrawing(true);
        try {
            const winningSlotNumber = await runDraw({ potId: pot._id });
            return winningSlotNumber;
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            setIsDrawing(false);
        }
    };

    /** Used by WinnerSelectionModal for manual override */
    const handleManualDraw = async () => {
        if (!selectedWinnerSlotNum) return;
        setIsDrawing(true);
        try {
            await runDraw({ potId: pot._id, customWinnerSlotNumber: selectedWinnerSlotNum });
            setShowWinnerSelection(false);
            setSelectedWinnerSlotNum(null);
            feedback.toast.success("Draw completed", "Winner has been selected.");
        } catch (err) {
            console.error(err);
            feedback.toast.error("Draw failed", "Please try again.");
        } finally {
            setIsDrawing(false);
        }
    };

    /** Legacy alias kept for OrganizeTab / DesktopSidebar primary action */
    const handleDraw = () => setShowRunDrawAnimation(true);

    const handleShare = async () => {
        const shareData = {
            title: `Join my UniGro: ${pot.title}`,
            text: `Pool Value: ${formatCurrency(pot.config.totalValue, pot.config.currency)}. Join now!`,
            url: window.location.href
        };
        if (navigator.share) await navigator.share(shareData);
        else {
            await navigator.clipboard.writeText(window.location.href);
            feedback.toast.success("Link copied", "Share it with your members.");
        }
    };

    // Current Winner Logic
    const currentWinnerSlot = activeSlots.find(s => s.drawOrder === pot.currentMonth);

    // --- MEMBER LIST AGGREGATION LOGIC ---
    const memberStats = new Map<string, any>();

    allSlots.forEach(slot => {
        // 1. Process Full Owner (Only if not split)
        if (slot.userId && slot.user && !slot.isSplit) {
            const userId = String(slot.userId);
            if (!memberStats.has(userId)) {
                memberStats.set(userId, {
                    userId: userId,
                    user: slot.user,
                    slots: [],
                    totalShare: 0,
                    totalDue: 0,
                    missedPayments: [],
                    paidCount: 0
                });
            }
            const stats = memberStats.get(userId);
            // Check payment
            // Check payment
            const tx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === pot.currentMonth && (t.userId === userId || !t.userId));
            const isPaid = tx?.status === "PAID";
            const due = pot.config.contribution;

            // Calculate Overdue
            // Logic Matches MemberDashboard: Iterate 1 to currentMonth (exclusive of current, or inclusive? MemberDashboard uses < currentMonth for Past Overdue)
            // MemberDashboard uses: for (let cycle = 1; cycle < pot.currentMonth; cycle++)
            // This means it strictly looks for PAST cycles. Current month is handled separately.
            if (pot.status === "ACTIVE") {
                for (let m = 1; m < pot.currentMonth; m++) {
                    // For full owners, slotId + monthIndex is unique enough (recordPayment ensures ownership)
                    // BUT MemberDashboard uses: (t.userId === currentUserId || !t.userId)
                    // We should use the same loose check to find ANY transaction for this slot+month
                    // because for full slots, there is only one user.
                    const pastTx = transactions.find(t => t.slotId === slot._id && t.monthIndex === m && (t.userId === userId || !t.userId));

                    if (!pastTx || pastTx.status === "UNPAID") {
                        stats.missedPayments.push({
                            slotId: slot._id,
                            slotNumber: slot.slotNumber,
                            monthIndex: m,
                            amount: due,
                            share: 100,
                            status: pastTx?.status || 'UNPAID',
                            isMyPayment: userId === currentUser?._id
                        });
                    }
                }
            }


            if (!stats.slots.some((s: any) => s._id === slot._id)) {
                stats.slots.push({ ...slot, share: 100, isPaid, due });
            }
            stats.totalShare += 100;
            if (!isPaid) stats.totalDue += due;
            else stats.paidCount++;
        }

        // 2. Process Split Owners
        if (slot.isSplit && slot.splitOwners) {
            slot.splitOwners.forEach((owner: any) => {
                const userId = String(owner.userId);
                if (!memberStats.has(userId)) {
                    memberStats.set(userId, {
                        userId: userId,
                        user: {
                            _id: userId,
                            name: owner.userName || "Unknown",
                            phone: owner.userPhone,
                            pictureUrl: owner.userPictureUrl
                        },
                        slots: [],
                        totalShare: 0,
                        totalDue: 0,
                        missedPayments: [],
                        paidCount: 0
                    });
                }
                const stats = memberStats.get(userId);
                // Check payment (MUST match userId)
                const tx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === pot.currentMonth && t.userId === userId);
                const isPaid = tx?.status === "PAID";
                const due = (pot.config.contribution * owner.sharePercentage) / 100;

                // Calculate Overdue
                if (pot.status === "ACTIVE") {
                    for (let m = 1; m < pot.currentMonth; m++) {
                        // Match MemberDashboard Logic: (t.userId === currentUserId || !t.userId)
                        // Here 'userId' var is the split owner's ID.
                        const pastTx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === m && (t.userId === userId || !t.userId));

                        if (!pastTx || pastTx.status === "UNPAID") {
                            // Double check if this user actually owns the slot share? We know they do from 'splitOwners'.
                            stats.missedPayments.push({
                                slotId: slot._id,
                                slotNumber: slot.slotNumber,
                                monthIndex: m,
                                amount: due,
                                share: owner.sharePercentage,
                                status: pastTx?.status || 'UNPAID',
                                isMyPayment: userId === currentUser?._id
                            });
                        }
                    }
                }



                if (!stats.slots.some((s: any) => s._id === slot._id)) {
                    stats.slots.push({ ...slot, share: owner.sharePercentage, isPaid, due });
                }
                stats.totalShare += owner.sharePercentage;
                if (!isPaid) stats.totalDue += due;
            });
        }
    });

    // Final Deduplication of memberList by userId just in case
    const memberListMap = new Map();
    Array.from(memberStats.values()).forEach(m => memberListMap.set(String(m.userId), m));
    const memberList = Array.from(memberListMap.values()).sort((a, b) => a.user.name.localeCompare(b.user.name));
    const pendingApprovalsCount = transactions?.filter((t) => t.status === "PENDING").length || 0;


    const myCurrentCycleUnpaidSlot = mySlots.find((slot) => {
        const tx = transactions?.find((t) => t.slotId === slot._id && t.monthIndex === pot.currentMonth);
        return !tx || tx.status === "UNPAID";
    });

    const isAnyModalOpen = showAddMember || showSplitModal || showJoinModal || showNextRoundModal || showDeletePotModal || !!globalPaymentState || showWinnerSelection || showRunDrawAnimation;

    const primaryAction = (() => {
        // Visitor/Non-member viewing pot with space
        if (!isMember && !isForeman && hasOpenSlots) {
            return {
                label: "Join Pot",
                helper: "Choose your slots and join this pot.",
                onClick: () => setShowJoinModal(true),
                tone: "primary",
            };
        }

        // Visitor/Non-member viewing full pot
        if (!isMember && !isForeman && !hasOpenSlots) {
            return {
                label: "Contact Organizer",
                helper: "This pot is currently full. Contact the manager for updates.",
                onClick: handleContactOrganizer,
                tone: "secondary",
            };
        }

        // Foreman case
        if (isForeman) {
            if (hasOpenSlots) {
                return {
                    label: "Invite Members",
                    helper: "Share this pot to fill remaining slots.",
                    onClick: handleShare,
                    tone: "primary",
                };
            }
            if (isDraft) {
                return {
                    label: "Activate Pot",
                    helper: "All slots filled. Ready to start.",
                    onClick: handleActivate,
                    tone: "primary",
                };
            }
            if (isActive && !currentWinnerSlot) {
                return {
                    label: isDrawing ? "Running draw..." : "Run draw",
                    helper: "Select a winner for the current cycle.",
                    onClick: handleDraw,
                    disabled: isDrawing,
                    tone: "primary",
                };
            }
            if (isActive && currentWinnerSlot) {
                return {
                    label: "Next round",
                    helper: "Close this cycle and move to the next one.",
                    onClick: () => setShowNextRoundModal(true),
                    tone: "primary",
                };
            }
        }

        // Member case
        if (isMember && isActive && myCurrentCycleUnpaidSlot) {
            return {
                label: "Pay now",
                helper: "Submit payment for your current cycle.",
                onClick: () =>
                    setGlobalPaymentState({
                        slotId: myCurrentCycleUnpaidSlot._id,
                        cycle: pot.currentMonth,
                        amount: pot.config.contribution,
                    }),
                tone: "primary",
            };
        }

        return null;
    })();

    const handleOrganizerClick = () => {
        setActiveTab("rules");
        setTimeout(() => {
            document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSlotClick = (_: string, slotNumber: number, isOpen: boolean, isSplit: boolean) => {
        if (!isDraft) return;

        if (isOpen) {
            setShowAddMember(true);
        } else if (isSplit) {
            // Find the slot to verify it's partially filled
            const slotData = allSlots.find(s => s.slotNumber === slotNumber);
            if (slotData && (slotData as any).remainingPercentage !== undefined && (slotData as any).remainingPercentage > 0) {
                setShowSplitModal(true);
            }
        }
    }


    // --- RENDER ---
    return (
        <div className="min-h-dvh">
            <PageShell maxWidth="xl" className="py-4 sm:py-6 lg:px-8">
                {/* Mobile Sticky Topbar */}
                <div className="sticky top-0 z-[60] -mx-4 -mt-4 mb-4 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[rgba(var(--bg-app-rgb),0.8)] px-4 py-3 backdrop-blur-md lg:hidden">
                    <button onClick={() => navigate(currentUser ? '/pots' : '/')} className="rounded-full p-2 hover:bg-[var(--surface-deep)]">
                        <img src="/monogram.svg" alt="UniGro" className="h-6 w-6" />
                    </button>
                    <div className="flex-1 min-w-0 text-center flex flex-col items-center justify-center">
                        <h2 className="truncate font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-tight">{pot.title}</h2>
                    </div>
                    {isForeman && isDraft && filledCount === 0 ? (
                        <button onClick={() => window.location.href = `/create?edit=${pot._id}`} className="rounded-full p-2 hover:bg-[var(--surface-deep)] text-[var(--text-muted)] flex-shrink-0">
                            <Edit2 size={18} />
                        </button>
                    ) : (
                        <div className="flex-shrink-0 p-1 cursor-pointer hover:scale-105 transition-transform" onClick={handleOrganizerClick}>
                            <OrganizerDisplay foremanId={pot.foremanId} avatarOnly={true} />
                        </div>
                    )}
                </div>

                {/* Desktop Back Link */}
                {currentUser && (
                    <button
                        onClick={() => navigate('/pots')}
                        className="mb-4 hidden lg:flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                    >
                        <ChevronLeft size={16} /> Back to pots
                    </button>
                )}

                {/* Full Pot Banner for Visitors */}
                {!isMember && !isForeman && !hasOpenSlots && (
                    <Surface tier={3} className="mb-6 border-l-4 border-l-[var(--warning)] p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="bg-[var(--warning)]/20 p-2 rounded-full text-[var(--warning)]">
                            <ShieldAlert size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[var(--text-primary)]">Pot is currently full</p>
                            <p className="text-xs text-[var(--text-muted)]">All slots have been taken. Contact the organizer to request an opening.</p>
                        </div>
                        <button
                            onClick={handleContactOrganizer}
                            className="text-xs font-bold text-[var(--accent-vivid)] hover:underline whitespace-nowrap"
                        >
                            Contact
                        </button>
                    </Surface>
                )}

                {/* MAIN 2-COLUMN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start pb-24 lg:pb-8">

                    {/* LEFT COLUMN: Hero & Content */}
                    <div className="space-y-6">
                        {/* Hero Visualizer Section */}
                        <PotHero
                            pot={pot}
                            allSlots={allSlots}
                            transactions={transactions || []}
                            isMember={isMember}
                            isForeman={isForeman}
                            isDraft={isDraft}
                            isActive={isActive}
                            hasOpenSlots={hasOpenSlots}
                            progressInfo={progressInfo}
                            filledCount={filledCount}
                            displayProgress={displayProgress}
                            onOrganizerClick={handleOrganizerClick}
                            onSlotClick={handleSlotClick}
                        />

                        {/* Desktop / Tablet Status Cards */}
                        <div className="hidden md:grid md:grid-cols-3 gap-4">
                            <Surface tier={2} className="p-4">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Next payment</p>
                                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{nextDueDate}</p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">Member contribution due</p>
                            </Surface>
                            <Surface tier={2} className="p-4">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Next draw</p>
                                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{nextDrawDate}</p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">Payout schedule</p>
                            </Surface>
                            <Surface tier={2} className="p-4">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Winning pot</p>
                                <p className="mt-2 text-lg font-semibold text-[var(--accent-secondary)]">
                                    {formatCurrency(winningAmount, pot.config.currency)}
                                </p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    After {commissionPct.toFixed(2)}% fee
                                </p>
                            </Surface>
                        </div>

                        {/* MOBILE/TABLET EXPANDABLE STATS & CONTROLS */}
                        <MobileStats
                            pot={pot}
                            showMobileStats={showMobileStats}
                            setShowMobileStats={setShowMobileStats}
                            winningAmount={winningAmount}
                            commissionPct={commissionPct}
                            commissionAmount={commissionAmount}
                            nextDueDate={nextDueDate}
                            nextDrawDate={nextDrawDate}
                            handleShare={handleShare}
                        />

                        {/* Tab Navigation */}
                        <div id="tabs-section" className="scroll-mt-24">
                            <TabNav
                                isMember={isMember}
                                isForeman={isForeman}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                pendingApprovalsCount={pendingApprovalsCount}
                                memberListLength={memberList.length}
                            />
                        </div>

                        {/* TAB CONTENT AREAS */}
                        <div className="min-h-[400px]">
                            {/* TAB CONTENT: DASHBOARD */}
                            {activeTab === 'dashboard' && (isMember || isForeman) && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {isMember && !isDraft && (
                                        <MemberDashboard
                                            pot={pot}
                                            mySlots={mySlots}
                                            transactions={transactions || []}
                                            nextDueDate={nextDueDate}
                                            currentUserId={currentUser?._id || ""}
                                            onPay={(slotId, cycle, amount) => setGlobalPaymentState({ slotId, cycle, amount })}
                                        />
                                    )}

                                    {currentWinnerSlot && (
                                        <Surface tier={2} className="border-l-4 border-l-[var(--gold)] rounded-2xl p-5 flex items-center gap-4">
                                            <div className="bg-[var(--gold)]/20 p-3 rounded-full text-[var(--gold)]">
                                                <Gavel size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Cycle {pot.currentMonth} Winner</p>
                                                <p className="text-xl font-display font-black text-[var(--gold)]">#{currentWinnerSlot.slotNumber} • {currentWinnerSlot.user?.name}</p>
                                            </div>
                                        </Surface>
                                    )}
                                </div>
                            )}

                            {/* TAB CONTENT: MEMBERS */}
                            {activeTab === 'members' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <MembersList
                                        members={memberList}
                                        potId={pot._id}
                                        currentMonth={pot.currentMonth}
                                        isForeman={isForeman}
                                        isActive={isActive}
                                        currentUserId={currentUser?._id}
                                        currency={pot.config.currency}
                                    />
                                </div>
                            )}

                            {/* TAB CONTENT: RULES & INFO */}
                            {activeTab === 'rules' && (
                                <RulesTab pot={pot} gracePeriod={gracePeriod} />
                            )}

                            {/* TAB CONTENT: SLOTS */}
                            {activeTab === 'slots' && (
                                <SlotsTab
                                    pot={pot}
                                    allSlots={allSlots}
                                    currentUserId={currentUser?._id}
                                    isForeman={isForeman}
                                    isDraft={isDraft}
                                    setShowAddMember={setShowAddMember}
                                    setShowSplitModal={setShowSplitModal}
                                    deleteSlot={deleteSlot}
                                />
                            )}

                            {/* TAB CONTENT: HISTORY */}
                            {activeTab === 'history' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <PotHistory
                                        pot={pot}
                                        allSlots={allSlots}
                                        transactions={transactions || []}
                                        mySlots={mySlots}
                                        currentUserId={currentUser?._id}
                                        onPay={(slotId, cycle, amount) => {
                                            setGlobalPaymentState({
                                                slotId,
                                                cycle,
                                                amount
                                            });
                                        }}
                                    />
                                </div>
                            )}

                            {/* TAB CONTENT: ORGANIZE (Foreman only) */}
                            {activeTab === 'organize' && isForeman && (
                                <OrganizeTab
                                    pot={pot}
                                    isDraft={isDraft}
                                    isActive={isActive}
                                    isForeman={isForeman}
                                    currentWinnerSlot={currentWinnerSlot}
                                    isDrawing={isDrawing}
                                    transactions={transactions || []}
                                    allSlots={allSlots}
                                    commissionPct={commissionPct}
                                    handleActivate={handleActivate}
                                    handleDraw={handleDraw}
                                    setShowWinnerSelection={setShowWinnerSelection}
                                    setGlobalPaymentState={setGlobalPaymentState}
                                    onDeletePot={() => setShowDeletePotModal(true)}
                                />
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR STATS & DESKTOP PRIMARY ACTION */}
                    <DesktopSidebar
                        pot={pot}
                        primaryAction={primaryAction}
                        winningAmount={winningAmount}
                        commissionPct={commissionPct}
                        commissionAmount={commissionAmount}
                        nextDueDate={nextDueDate}
                        nextDrawDate={nextDrawDate}
                        handleShare={handleShare}
                    />
                </div>

                {/* MOBILE & TABLET STICKY BOTTOM ACTION BAR */}
                {currentUser && (
                    <MobileActionBar
                        pot={pot}
                        primaryAction={primaryAction}
                        isAnyModalOpen={isAnyModalOpen}
                    />
                )}

                {/* Modals */}
                {globalPaymentState && (
                    <PaymentModal
                        potId={pot._id}
                        slotId={globalPaymentState.slotId}
                        monthIndex={globalPaymentState.cycle}
                        amount={globalPaymentState.amount}
                        currency={pot.config.currency}
                        onClose={() => setGlobalPaymentState(null)}
                        isForeman={globalPaymentState.isForemanAction}
                        onForemanRecord={async (date) => {
                            await recordCashPayment({
                                potId: pot._id,
                                slotId: globalPaymentState.slotId,
                                monthIndex: globalPaymentState.cycle,
                                userId: globalPaymentState.userId as Id<"users">,
                                paidAt: date
                            });
                        }}
                    />
                )}

                {showJoinModal && (
                    <JoinPotModal
                        potId={pot._id}
                        totalValue={pot.config.totalValue}
                        contribution={pot.config.contribution}
                        totalSlots={pot.config.totalSlots}
                        filledSlots={filledCount}
                        currency={pot.config.currency}
                        onClose={() => setShowJoinModal(false)}
                        onViewRules={() => {
                            setShowJoinModal(false);
                            setActiveTab('rules');
                        }}
                    />
                )}

                {showAddMember && (
                    <AddMemberModal
                        potId={pot._id}
                        openSlots={virtualOpenSlots as any}
                        onClose={() => setShowAddMember(false)}
                    />
                )}

                {showSplitModal && (
                    <SplitSlotModal
                        potId={pot._id}
                        openSlots={splitEligibleSlots as any}
                        onClose={() => setShowSplitModal(false)}
                    />
                )}

                {showNextRoundModal && (() => {
                    const currentMonthTxs = (transactions || []).filter(t => t.monthIndex === pot.currentMonth);
                    const paidSlotIds = new Set(currentMonthTxs.filter(t => t.status === "PAID").map(t => t.slotId));
                    const pendingSlotIds = new Set(currentMonthTxs.filter(t => t.status === "PENDING").map(t => t.slotId));
                    const eligibleForPayment = allSlots.filter(s => s.status === "FILLED");
                    const unpaidCount = eligibleForPayment.filter(s => !paidSlotIds.has(s._id) && !pendingSlotIds.has(s._id)).length;
                    const pendingCount = eligibleForPayment.filter(s => pendingSlotIds.has(s._id)).length;
                    return (
                        <NextRoundModal
                            potId={pot._id}
                            currentMonth={pot.currentMonth}
                            totalMonths={pot.config.duration}
                            defaultNextDate={new Date().toISOString().split('T')[0]}
                            isOccasional={pot.config.frequency === 'occasional'}
                            unpaidCount={unpaidCount}
                            pendingCount={pendingCount}
                            onClose={() => setShowNextRoundModal(false)}
                        />
                    );
                })()}

                {showWinnerSelection && (
                    <WinnerSelectionModal
                        activeSlots={activeSlots}
                        selectedWinnerSlotNum={selectedWinnerSlotNum}
                        setSelectedWinnerSlotNum={setSelectedWinnerSlotNum}
                        setShowWinnerSelection={setShowWinnerSelection}
                        handleDraw={handleManualDraw}
                    />
                )}

                {showRunDrawAnimation && (
                    <RunDrawAnimationModal
                        eligibleSlots={activeSlots.filter(s => !s.drawOrder)}
                        onRunDraw={executeRandomDraw}
                        onClose={() => setShowRunDrawAnimation(false)}
                        currency={pot.config.currency || "USD"}
                        winningAmount={winningAmount}
                        currentMonth={pot.currentMonth}
                    />
                )}

                {showDeletePotModal && (
                    <DeletePotModal
                        potId={pot._id}
                        potTitle={pot.title}
                        potStatus={pot.status}
                        onClose={() => setShowDeletePotModal(false)}
                    />
                )}

                {/* Visitor/Guest CTA Banners */}
                {!currentUser && !isAnyModalOpen && !showMobileStats && (
                    isGhostMember ? <SecureAccountBanner /> : <VisitorBanner />
                )}
            </PageShell>
        </div>
    );
}

function VisitorBanner() {
    return (
        <div className="fixed inset-x-4 bottom-6 z-50 animate-in slide-in-from-bottom-8 duration-500">
            <Surface tier={3} rounded="3xl" className="mx-auto max-w-md border border-[var(--accent-vivid)]/30 p-6 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-vivid)] to-[var(--accent-secondary)]" />
                <div className="flex flex-col gap-4 relative z-10">
                    <div>
                        <h4 className="text-xl font-display font-black text-[var(--accent-vivid)] mb-1">Join this Pot!</h4>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                            You've been invited to participate in this group savings. Log in to reserve your slot and start saving together.
                        </p>
                    </div>
                    <SignInButton mode="modal">
                        <Button variant="primary" size="lg" fullWidth className="group shadow-lg shadow-[var(--accent-vivid)]/20 font-bold gap-2">
                            Get Started Now <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </SignInButton>
                </div>
                <div className="absolute -bottom-6 -right-6 opacity-10">
                    <Coins size={120} className="text-[var(--accent-vivid)]" />
                </div>
            </Surface>
        </div>
    );
}

function SecureAccountBanner() {
    return (
        <div className="fixed inset-x-4 bottom-6 z-50 animate-in slide-in-from-bottom-8 duration-500">
            <Surface tier={3} rounded="3xl" className="mx-auto max-w-md border border-[var(--accent-secondary)]/30 p-6 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-vivid)]" />
                <div className="flex flex-col gap-4 relative z-10">
                    <div>
                        <h4 className="text-xl font-display font-black text-[var(--accent-secondary)] mb-1">Secure your slots!</h4>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                            You've reserved your place in this pot. Sign up officially to track your payments and participate in the draw.
                        </p>
                    </div>
                    <SignInButton mode="modal">
                        <Button variant="accent" size="lg" fullWidth className="group shadow-lg shadow-[var(--accent-secondary)]/20 font-bold gap-2">
                            Create Account <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </SignInButton>
                </div>
                <div className="absolute -bottom-6 -right-6 opacity-10">
                    <ShieldAlert size={120} className="text-[var(--accent-secondary)]" />
                </div>
            </Surface>
        </div>
    );
}
