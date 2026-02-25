import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useFeedback } from "../components/FeedbackProvider";
import { SplitSlotModal } from "../components/SplitSlotModal"; // New
import { AddMemberModal } from "../components/AddMemberModal";
import { JoinPotModal } from "../components/JoinPotModal";
import { NextRoundModal } from "../components/NextRoundModal"; // New
import { PotVisualizer } from "../components/PotVisualizer";
import { PaymentModal } from "../components/PaymentComponents";
import { PotHistory } from "../components/PotHistory"; // New
import { Gavel, CheckCircle, Clock, Calendar, Coins, Share2, Layers, ShieldCheck, Trash2, Edit2, Info, ShieldAlert, PieChart, Users, ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { getSlotStats, getPotDisplayProgress, getPotFinancials, getNextCycleDate, getVirtualOpenSlots } from "../lib/pot";

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
    const [isDrawing, setIsDrawing] = useState(false);
    const [showMobileStats, setShowMobileStats] = useState(false);

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

    type Tab = 'dashboard' | 'rules' | 'slots' | 'members' | 'history' | 'approvals' | 'organize';
    const [activeTab, setActiveTab] = useState<Tab>('rules');

    // Computed State
    const isDraft = pot?.status === "DRAFT";
    const isActive = pot?.status === "ACTIVE";

    const isForeman = currentUser?._id === pot?.foremanId;
    const allSlots = pot?.slots || [];
    const mySlots = currentUser ? allSlots.filter(s =>
        s.userId === currentUser._id ||
        (s.isSplit && (s as any).splitOwners?.some((o: any) => o.userId === currentUser._id))
    ) : [];
    const isMember = mySlots.length > 0;
    const activeSlots = allSlots.filter(s => s.status === "FILLED" || s.status === "RESERVED");

    // Use shared utilities for slot/progress calculations
    const { filledSlots: filledCount, availableSlots: availableCount, hasOpenSlots } = getSlotStats(
        pot || { status: "", currentMonth: 0, config: { totalSlots: 0, duration: 0, contribution: 0, totalValue: 0, frequency: "" } },
        allSlots as any
    );
    const virtualOpenSlots = pot ? getVirtualOpenSlots(pot as any, allSlots as any) : [];

    const splitEligibleSlots = [
        ...virtualOpenSlots,
        ...allSlots.filter(s => s.isSplit && (s as any).remainingPercentage > 0)
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

    if (!pot || transactions === undefined) return <div className="p-8 text-center animate-pulse">Loading pot details...</div>;


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
        const subject = encodeURIComponent(`Inquiry about GrowPot: ${pot.title}`);

        if (foremanDetails.phone) {
            window.open(`https://wa.me/${foremanDetails.phone.replace(/\D/g, '')}?text=${encodedBody}`, '_blank');
        } else if (foremanDetails.email) {
            window.location.href = `mailto:${foremanDetails.email}?subject=${subject}&body=${encodedBody}`;
        } else {
            feedback.toast.info("Contact Organizer", `Please contact ${foremanDetails.name} directly.`);
        }
    };


    const handleDraw = async () => {
        const ok = await feedback.confirm({
            title: "Run the draw?",
            message: "This will select the winner for the current cycle.",
            confirmText: "Run draw",
        });
        if (!ok) return;
        setIsDrawing(true);
        try {
            if (selectedWinnerSlotNum) {
                await runDraw({ potId: pot._id, customWinnerSlotNumber: selectedWinnerSlotNum });
            } else {
                await runDraw({ potId: pot._id });
            }
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

    const handleShare = async () => {
        const shareData = {
            title: `Join my GrowPot: ${pot.title}`,
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
        // 1. Process Full Owner
        if (slot.userId && slot.user) {
            const userId = slot.userId;
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


            stats.slots.push({ ...slot, share: 100, isPaid, due });
            stats.totalShare += 100;
            if (!isPaid) stats.totalDue += due;
            else stats.paidCount++;
        }

        // 2. Process Split Owners
        if (slot.isSplit && slot.splitOwners) {
            slot.splitOwners.forEach((owner: any) => {
                const userId = owner.userId;
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



                stats.slots.push({ ...slot, share: owner.sharePercentage, isPaid, due });
                stats.totalShare += owner.sharePercentage;
                if (!isPaid) stats.totalDue += due;
            });
        }
    });

    const memberList = Array.from(memberStats.values()).sort((a, b) => a.user.name.localeCompare(b.user.name));
    const pendingApprovalsCount = transactions?.filter((t) => t.status === "PENDING").length || 0;

    const tabButtonClass = (tab: Tab) =>
        `px-3 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap rounded-full ${activeTab === tab
            ? "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`;

    const myCurrentCycleUnpaidSlot = mySlots.find((slot) => {
        const tx = transactions?.find((t) => t.slotId === slot._id && t.monthIndex === pot.currentMonth);
        return !tx || tx.status === "UNPAID";
    });

    const isAnyModalOpen = showAddMember || showSplitModal || showJoinModal || showNextRoundModal || !!globalPaymentState || showWinnerSelection;

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
                    tone: "secondary",
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



    // --- RENDER ---
    return (
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:px-8 bg-[var(--bg-app)] min-h-screen">
            {/* Mobile Sticky Topbar */}
            <div className="sticky top-0 z-[60] -mx-4 -mt-4 mb-4 flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/80 px-4 py-3 backdrop-blur-md lg:hidden">
                <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-[var(--surface-deep)]">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[var(--accent-vivid)] uppercase tracking-widest leading-none mb-0.5">GrowPot {pot.status}</p>
                    <h2 className="truncate font-display text-base font-bold text-[var(--text-primary)]">{pot.title}</h2>
                </div>
                {isForeman && (
                    <button onClick={() => window.location.href = `/create?edit=${pot._id}`} className="rounded-full p-2 hover:bg-[var(--surface-deep)] text-[var(--text-muted)]">
                        <Edit2 size={18} />
                    </button>
                )}
            </div>

            {/* Desktop Back Link */}
            <button
                onClick={() => navigate('/pots')}
                className="mb-4 hidden lg:flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
                <ChevronLeft size={16} /> Back to pots
            </button>

            {/* Full Pot Banner for Visitors */}
            {!isMember && !isForeman && !hasOpenSlots && (
                <div className="mb-6 glass-3 border-l-4 border-l-[var(--warning)] p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
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
                </div>
            )}

            {/* MAIN 2-COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start pb-24 lg:pb-8">

                {/* LEFT COLUMN: Hero & Content */}
                <div className="space-y-6">
                    {/* Hero Visualizer Section */}
                    <div className="glass-3 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-4 right-4 z-20 hidden sm:block">
                            <OrganizerDisplay foremanId={pot.foremanId} />
                        </div>
                        <div className="mb-2 text-center sm:text-left">
                            <span className="text-[10px] font-bold text-[var(--accent-vivid)] uppercase tracking-widest bg-[var(--accent-vivid)]/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                                GrowPot {pot.status}
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-display font-black text-[var(--text-primary)]">{pot.title}</h1>
                        </div>

                        {(isMember || isForeman || (isActive && hasOpenSlots)) && (
                            <div className="mt-4">
                                <PotVisualizer pot={pot} slots={allSlots} currentMonthIndex={pot.currentMonth} transactions={transactions || []} />
                            </div>
                        )}

                        {/* Quick Progress Bar for small screens/non-members */}
                        <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
                            <div className="flex justify-between items-end mb-2">
                                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-bold">
                                    {isActive ? "Collection status" : "Filling status"}
                                </div>
                                <div className="text-xs font-mono text-[var(--text-primary)] font-bold">
                                    {isActive ? `${progressInfo?.count ?? 0} / ${progressInfo?.total ?? 0} paid` : `${filledCount} / ${pot.config.totalSlots} joined`}
                                </div>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-deep)] border border-[var(--border-subtle)]/30">
                                <div
                                    className="h-full bg-gradient-to-r from-[var(--accent-vivid)] to-[var(--accent-secondary)] transition-all duration-500 shadow-[0_0_10px_var(--accent-vivid)]"
                                    style={{ width: `${Math.min(100, displayProgress)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* MOBILE/TABLET EXPANDABLE STATS & CONTROLS */}
                    <div className="lg:hidden">
                        <div className={`glass-3 rounded-3xl overflow-hidden transition-all duration-500 ${showMobileStats ? 'pb-6' : ''}`}>
                            <button
                                onClick={() => setShowMobileStats(!showMobileStats)}
                                className="w-full p-4 flex items-center justify-between text-sm font-bold transition-all hover:bg-[var(--surface-elevated)] border-none bg-transparent"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-[var(--accent-secondary)]/20 p-2 rounded-xl text-[var(--accent-secondary)]">
                                        <PieChart size={18} />
                                    </div>
                                    <span>Pot Details & Stats</span>
                                </div>
                                <div className={`transition-transform duration-300 ${showMobileStats ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>

                            {/* Collapsible Content Area */}
                            <div className={`grid transition-all duration-500 ease-in-out ${showMobileStats ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                                <div className="overflow-hidden">
                                    <div className="px-6 py-2 space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Winning Pot</p>
                                                <p className="text-4xl font-display font-black text-[var(--accent-secondary)]">{formatCurrency(winningAmount, pot.config.currency)}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">After {commissionPct.toFixed(2)}% commission ({formatCurrency(commissionAmount, pot.config.currency)})</p>
                                            </div>

                                            <div className="h-px bg-[var(--border-subtle)] opacity-20" />

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Round Pool</p>
                                                    <p className="text-lg font-mono font-bold">{formatCurrency(pot.config.totalValue, pot.config.currency)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">EMI</p>
                                                    <p className="text-lg font-mono font-bold">{formatCurrency(pot.config.contribution, pot.config.currency)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 bg-[var(--surface-deep)]/60 p-3 rounded-2xl border border-[var(--border-subtle)]/30">
                                                <div className="bg-[var(--accent-vivid)]/20 p-2 rounded-xl text-[var(--accent-vivid)]">
                                                    <Clock size={16} />
                                                </div>
                                                <div className="flex-1 flex justify-between items-center min-w-0">
                                                    <p className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Next Payment</p>
                                                    <p className="text-xs font-bold truncate ml-2">{nextDueDate}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 bg-[var(--surface-deep)]/60 p-3 rounded-2xl border border-[var(--border-subtle)]/30">
                                                <div className="bg-[var(--accent-secondary)]/20 p-2 rounded-xl text-[var(--accent-secondary)]">
                                                    <Calendar size={16} />
                                                </div>
                                                <div className="flex-1 flex justify-between items-center min-w-0">
                                                    <p className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Next Draw</p>
                                                    <p className="text-xs font-bold truncate ml-2">{nextDrawDate}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleShare}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-full hover:bg-[var(--surface-deep)] text-xs font-bold transition-colors text-[var(--text-muted)]"
                                        >
                                            <Share2 size={14} /> Share details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="sticky top-0 sm:top-4 z-40 -mx-4 sm:mx-0 px-4 sm:px-0 bg-[var(--bg-app)]/50 backdrop-blur-sm py-2">
                        <div className="glass-2 flex gap-1 overflow-x-auto rounded-full p-1 scrollbar-hide">
                            {(isMember || isForeman) && (
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={tabButtonClass("dashboard")}
                                >
                                    Overview
                                </button>
                            )}

                            {isForeman && (
                                <button
                                    onClick={() => setActiveTab('organize')}
                                    className={tabButtonClass("organize")}
                                >
                                    Organize {pendingApprovalsCount > 0 && <span className="ml-1 bg-[var(--accent-vivid)] text-[var(--text-on-accent)] px-1.5 py-0.5 rounded-full text-[10px]">{pendingApprovalsCount}</span>}
                                </button>
                            )}

                            {(isMember || isForeman) && (
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={tabButtonClass("members")}
                                >
                                    Members <span className="ml-1 opacity-50 text-[10px]">{memberList.length}</span>
                                </button>
                            )}

                            <button
                                onClick={() => setActiveTab('rules')}
                                className={tabButtonClass("rules")}
                            >
                                Rules & Info
                            </button>

                            {(isMember || isForeman) && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('slots')}
                                        className={tabButtonClass("slots")}
                                    >
                                        Slots
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={tabButtonClass("history")}
                                    >
                                        History
                                    </button>
                                </>
                            )}
                        </div>
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
                                    />
                                )}

                                {currentWinnerSlot && (
                                    <div className="glass-2 border-l-4 border-l-[var(--gold)] rounded-2xl p-5 flex items-center gap-4">
                                        <div className="bg-[var(--gold)]/20 p-3 rounded-full text-[var(--gold)]">
                                            <Gavel size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Cycle {pot.currentMonth} Winner</p>
                                            <p className="text-xl font-display font-black text-[var(--gold)]">#{currentWinnerSlot.slotNumber} • {currentWinnerSlot.user?.name}</p>
                                        </div>
                                    </div>
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
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                                <div className="glass-1 rounded-2xl p-6">
                                    <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-4">
                                        <Info className="text-[var(--accent-vivid)]" size={18} /> Description
                                    </h3>
                                    <p className="text-[var(--text-muted)] text-sm whitespace-pre-wrap leading-relaxed">
                                        {pot.description || "No specific description provided by the organizer."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="glass-1 p-5 rounded-2xl space-y-4">
                                        <h4 className="font-bold text-[var(--text-primary)] text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2"><Layers size={14} className="text-[var(--accent-vivid)]" /> Configuration</h4>
                                        <div className="space-y-2 text-sm font-medium">
                                            <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                                                <span className="text-[var(--text-muted)]">Frequency</span>
                                                <span className="capitalize">{pot.config.frequency}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                                                <span className="text-[var(--text-muted)]">Duration</span>
                                                <span>{pot.config.duration} Rounds</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                                                <span className="text-[var(--text-muted)]">Commission</span>
                                                <span>{pot.config.commission}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-1 p-5 rounded-2xl space-y-4">
                                        <h4 className="font-bold text-[var(--text-primary)] text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2"><Calendar size={14} className="text-[var(--accent-secondary)]" /> Timeline</h4>
                                        <div className="space-y-2 text-sm font-medium">
                                            <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                                                <span className="text-[var(--text-muted)]">Grace Period</span>
                                                <span>{gracePeriod} Days</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-[var(--surface-deep)]/40 p-2.5 rounded-lg border border-[var(--border-subtle)]/20">
                                                <span className="text-[var(--text-muted)]">Start Date</span>
                                                <span>{pot.startDate ? new Date(pot.startDate).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {pot.bankDetails && (
                                    <div className="glass-1 p-6 rounded-2xl space-y-4">
                                        <h4 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider flex items-center gap-2"><Coins size={14} className="text-[var(--accent-vivid)]" /> Payment Details</h4>
                                        <div className="p-4 bg-[var(--surface-deep)]/60 rounded-xl font-mono text-sm whitespace-pre-wrap border border-[var(--border-subtle)]/30">
                                            {pot.bankDetails}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: SLOTS */}
                        {activeTab === 'slots' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-display font-bold">Pot Slots</h3>
                                    {isForeman && isDraft && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowAddMember(true)} className="px-4 py-2 bg-[var(--surface-deep)] text-xs font-bold rounded-full hover:bg-[var(--surface-card)] transition-colors">+ Add Member</button>
                                            <button onClick={() => setShowSplitModal(true)} className="px-4 py-2 bg-[var(--surface-deep)] text-xs font-bold rounded-full hover:bg-[var(--surface-card)] transition-colors">Split Slot</button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allSlots.map((slot) => {
                                        const isMySlot = slot.userId === currentUser?._id ||
                                            (slot.isSplit && (slot as any).splitOwners?.some((o: any) => o.userId === currentUser?._id));
                                        return (
                                            <div key={slot._id} className={`glass-1 rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${isMySlot ? 'border-[var(--accent-vivid)]/40' : 'border-transparent'}`}>
                                                <div className="relative">
                                                    <div className="h-10 w-10 rounded-full bg-[var(--surface-deep)] flex items-center justify-center font-bold text-sm">
                                                        {slot.user?.name?.charAt(0) || slot.slotNumber}
                                                    </div>
                                                    {isMySlot && <div className="absolute -top-1 -right-1 h-3 w-3 bg-[var(--accent-vivid)] rounded-full border-2 border-[var(--surface-card)]" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{slot.user?.name || `Slot #${slot.slotNumber}`}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                                                        {slot.isGhost ? 'Ghost User' : slot.isSplit ? 'Split Slot' : 'Participant'}
                                                    </p>
                                                </div>
                                                {isForeman && isDraft && (
                                                    <button onClick={() => deleteSlot({ potId: pot._id, slotNumber: slot.slotNumber })} className="p-2 text-[var(--warning)] hover:bg-[var(--warning)]/10 rounded-full">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: HISTORY */}
                        {activeTab === 'history' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <PotHistory
                                    pot={pot}
                                    allSlots={allSlots}
                                    transactions={transactions || []}
                                    mySlots={mySlots}
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
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Quick Management Card */}
                                <section className="glass-3 rounded-3xl p-6 border border-[var(--accent-vivid)]/20 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-5">
                                        <ShieldCheck size={100} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                            <ShieldCheck className="text-[var(--accent-vivid)]" size={24} /> Organizer Controls
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                            <div className="glass-1 p-4 rounded-2xl">
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Pot Status</p>
                                                <p className="text-lg font-black text-[var(--accent-vivid)] uppercase">{pot.status}</p>
                                            </div>
                                            <div className="glass-1 p-4 rounded-2xl">
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Round Pool</p>
                                                <p className="text-lg font-black">{formatCurrency(pot.config.totalValue, pot.config.currency)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {isDraft && (
                                                <button
                                                    onClick={handleActivate}
                                                    className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] py-4 rounded-2xl font-black shadow-[0_10px_30px_rgba(var(--accent-vivid-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    ACTIVATE POT
                                                </button>
                                            )}

                                            {isActive && !currentWinnerSlot && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setShowWinnerSelection(true)}
                                                        className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] py-3 rounded-2xl text-xs font-bold hover:bg-[var(--surface-deep)] transition-colors"
                                                    >
                                                        Manual Winner
                                                    </button>
                                                    <button
                                                        onClick={handleDraw}
                                                        disabled={isDrawing}
                                                        className="flex-1 bg-[var(--accent-secondary)] text-[var(--text-primary)] py-3 rounded-2xl text-xs font-black shadow-[0_10px_30px_rgba(var(--accent-secondary-rgb),0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                                    >
                                                        RUN DRAW
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Pending Approvals Section */}
                                <section className="glass-2 rounded-3xl p-6">
                                    <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-6 text-[var(--warning)]">
                                        <Clock size={20} /> Pending Approvals
                                    </h3>
                                    {transactions?.filter(t => t.status === "PENDING").length === 0 ? (
                                        <div className="text-center py-12 text-[var(--text-muted)] glass-1 rounded-2xl border border-dashed border-[var(--border-subtle)]">
                                            No pending approvals for now.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {transactions?.filter(t => t.status === "PENDING").map(tx => {
                                                const slot = allSlots.find(s => s._id === tx.slotId);
                                                return (
                                                    <div key={tx._id} className="glass-1 p-4 rounded-xl flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-[var(--surface-deep)] rounded-full flex items-center justify-center font-bold">
                                                                {slot?.slotNumber || tx.monthIndex}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">Round {tx.monthIndex} Payment</p>
                                                                <p className="text-xs text-[var(--text-muted)]">{tx.user?.name || 'Member'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {tx.proofUrl && <a href={tx.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent-vivid)] hover:underline mr-2">View Proof</a>}
                                                            <button
                                                                onClick={() => setGlobalPaymentState({ slotId: tx.slotId, cycle: tx.monthIndex, amount: pot.config.contribution, isForemanAction: true, userId: tx.userId })}
                                                                className="bg-[var(--accent-vivid)] text-[var(--text-on-accent)] text-xs font-bold px-4 py-2 rounded-full hover:opacity-90"
                                                            >
                                                                Review
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>

                                {/* Round Details / Rules Summary */}
                                <div className="glass-1 rounded-3xl p-6">
                                    <h4 className="text-xs uppercase font-black tracking-widest text-[var(--text-muted)] mb-4">Pot Configuration</h4>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <dt className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Target Slots</dt>
                                            <dd className="font-bold">{pot.config.totalSlots}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Duration</dt>
                                            <dd className="font-bold">{pot.config.duration} Months</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[10px] uppercase font-bold text-[var(--text-muted)]">EMI</dt>
                                            <dd className="font-bold">{formatCurrency(pot.config.contribution, pot.config.currency)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Commission</dt>
                                            <dd className="font-bold">{commissionPct.toFixed(2)}%</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: SIDEBAR STATS & DESKTOP PRIMARY ACTION */}
                <aside className="space-y-6 lg:sticky lg:top-8 hidden lg:block">
                    {/* Primary Action Card (Desktop) */}
                    {primaryAction && (
                        <div className="glass-3 border border-[var(--accent-vivid)]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-5">
                                <Layers size={100} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] uppercase font-bold text-[var(--accent-vivid)] tracking-widest mb-2 px-2 py-0.5 bg-[var(--accent-vivid)]/10 rounded-full inline-block">Action Required</p>
                                <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-2">{primaryAction.label}</h3>
                                <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">{primaryAction.helper}</p>
                                <button
                                    onClick={primaryAction.onClick}
                                    disabled={primaryAction.disabled}
                                    className={`w-full relative z-10 rounded-full px-6 py-4 text-sm font-black transition-all ${primaryAction.tone === "secondary"
                                        ? "bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:scale-[1.02] active:scale-[0.98]"
                                        : "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(var(--accent-vivid-rgb),0.3)]"
                                        } disabled:opacity-50 disabled:scale-100`}
                                >
                                    {primaryAction.label.toUpperCase()}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Stats Sidebar */}
                    <div className="glass-2 rounded-3xl p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Winning Pot</p>
                                <p className="text-4xl font-display font-black text-[var(--accent-secondary)]">{formatCurrency(winningAmount, pot.config.currency)}</p>
                                <p className="text-[10px] text-[var(--text-muted)]">After {commissionPct.toFixed(2)}% commission ({formatCurrency(commissionAmount, pot.config.currency)})</p>
                            </div>

                            <div className="h-px bg-[var(--border-subtle)] opacity-20" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Round Pool</p>
                                    <p className="text-lg font-mono font-bold">{formatCurrency(pot.config.totalValue, pot.config.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">EMI</p>
                                    <p className="text-lg font-mono font-bold">{formatCurrency(pot.config.contribution, pot.config.currency)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-[var(--surface-deep)]/60 p-3 rounded-2xl border border-[var(--border-subtle)]/30">
                                <div className="bg-[var(--accent-vivid)]/20 p-2 rounded-xl text-[var(--accent-vivid)]">
                                    <Clock size={16} />
                                </div>
                                <div className="flex-1 flex justify-between items-center min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Next Payment</p>
                                    <p className="text-xs font-bold truncate ml-2">{nextDueDate}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-[var(--surface-deep)]/60 p-3 rounded-2xl border border-[var(--border-subtle)]/30">
                                <div className="bg-[var(--accent-secondary)]/20 p-2 rounded-xl text-[var(--accent-secondary)]">
                                    <Calendar size={16} />
                                </div>
                                <div className="flex-1 flex justify-between items-center min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Next Draw</p>
                                    <p className="text-xs font-bold truncate ml-2">{nextDrawDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Share Action */}
                        <button
                            onClick={handleShare}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-full hover:bg-[var(--surface-deep)] text-xs font-bold transition-colors text-[var(--text-muted)]"
                        >
                            <Share2 size={14} /> Share details
                        </button>
                    </div>
                </aside>
            </div>

            {/* MOBILE & TABLET STICKY BOTTOM ACTION BAR */}
            {primaryAction && !isAnyModalOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-[70] p-4 lg:hidden pointer-events-none">
                    <div className="glass-3 rounded-3xl p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border border-[var(--border-subtle)]/30 flex items-center justify-between gap-4 pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{primaryAction.label === "Join Pot" ? "Starts at" : "EMI Amount"}</p>
                            <p className="text-lg font-display font-black text-[var(--text-primary)] leading-tight">{formatCurrency(pot.config.contribution, pot.config.currency)}</p>
                        </div>
                        <button
                            onClick={primaryAction.onClick}
                            disabled={primaryAction.disabled}
                            className={`px-8 h-14 rounded-2xl text-sm font-black transition-all active:scale-95 whitespace-nowrap ${primaryAction.tone === "secondary"
                                ? "bg-[var(--accent-secondary)] text-[var(--text-primary)]"
                                : "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-[0_8px_20px_rgba(var(--accent-vivid-rgb),0.3)]"
                                } disabled:opacity-50`}
                        >
                            {primaryAction.label.toUpperCase()}
                        </button>
                    </div>
                </div>
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

            {showNextRoundModal && (
                <NextRoundModal
                    potId={pot._id}
                    currentMonth={pot.currentMonth}
                    totalMonths={pot.config.duration}
                    defaultNextDate={new Date().toISOString().split('T')[0]}
                    isOccasional={pot.config.frequency === 'occasional'}
                    onClose={() => setShowNextRoundModal(false)}
                />
            )}

            {showWinnerSelection && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4">
                    <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6">
                        <h3 className="text-xl font-display font-black mb-4">Select Winner Manually</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto mb-6 scrollbar-hide">
                            {activeSlots.filter(s => !s.drawOrder).map(s => (
                                <button
                                    key={s._id}
                                    onClick={() => setSelectedWinnerSlotNum(s.slotNumber)}
                                    className={`w-full p-4 rounded-xl text-left border-2 transition-all ${selectedWinnerSlotNum === s.slotNumber ? "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10" : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]"}`}
                                >
                                    <div className="font-bold text-sm">Slot #{s.slotNumber}</div>
                                    <div className="text-xs text-[var(--text-muted)]">{s.user?.name || "Shared Slot"}</div>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowWinnerSelection(false)} className="flex-1 bg-[var(--surface-deep)] py-4 rounded-2xl font-bold text-sm">Cancel</button>
                            <button onClick={handleDraw} disabled={!selectedWinnerSlotNum} className="flex-1 bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-4 rounded-2xl text-sm shadow-xl disabled:opacity-50">Confirm Winner</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function OrganizerDisplay({ foremanId }: { foremanId: Id<"users"> }) {
    const foreman = useQuery(api.users.get, { userId: foremanId });

    if (!foreman) return <div className="text-xs text-[var(--text-muted)] animate-pulse">Loading organizer...</div>;

    return (
        <div className="flex items-center gap-2 mt-2">
            {foreman.pictureUrl ? (
                <img src={foreman.pictureUrl} alt={foreman.name} className="w-6 h-6 rounded-full border border-[var(--border-subtle)]" />
            ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--surface-deep)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)]">
                    {foreman.name?.charAt(0)}
                </div>
            )}
            <span className="text-sm text-[var(--text-muted)]">Organized by <span className="text-[var(--text-primary)] font-bold">{foreman.name}</span></span>
        </div>
    );
}

function MemberDashboard({ pot, mySlots, transactions, nextDueDate, currentUserId }: { pot: Doc<"pots">, mySlots: any[], transactions: any[], nextDueDate: string, currentUserId: string }) {
    const recordCashPayment = useMutation(api.transactions.recordCashPayment);

    const [paymentModalState, setPaymentModalState] = useState<{ slotId: Id<"slots">, cycle: number, amount: number } | null>(null);

    // Calculate Overdue Payments
    const overduePayments: { slot: any, cycle: number, amount: number }[] = [];
    if (pot.status === "ACTIVE") {
        for (let cycle = 1; cycle < pot.currentMonth; cycle++) {
            mySlots.forEach(slot => {
                const tx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === cycle && (t.userId === currentUserId || !t.userId)); // Match user or legacy

                // Calculate Share Amount
                let sharePct = 100;
                if (slot.isSplit && slot.splitOwners) {
                    const myShare = slot.splitOwners.find((o: any) => o.userId === currentUserId);
                    sharePct = myShare ? myShare.sharePercentage : 0;
                }
                const dueAmount = (pot.config.contribution * sharePct) / 100;

                if ((!tx || tx.status === "UNPAID") && sharePct > 0) {
                    overduePayments.push({
                        slot,
                        cycle,
                        amount: dueAmount
                    });
                }
            });
        }
    }

    return (
        <section className="mb-8 p-6 bg-[var(--surface-elevated)] border border-[var(--accent-vivid)]/20 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Coins size={100} className="text-[var(--accent-vivid)]" />
            </div>

            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 z-10 relative">
                <Clock className="text-[var(--accent-vivid)]" /> Your dashboard
            </h3>

            {/* Overdue Payments Alert */}
            {overduePayments.length > 0 && (
                <div className="mb-6 relative z-10  bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl p-4 animate-pulse">
                    <h4 className="text-[var(--danger)] font-bold flex items-center gap-2 mb-3">
                        <ShieldAlert size={20} /> Action Required: Overdue Payments
                    </h4>
                    <div className="space-y-3">
                        {overduePayments.map((item) => (
                            <div key={`${item.slot._id}-${item.cycle}`} className="flex justify-between items-center  bg-[var(--danger)]/5 p-3 rounded-lg border border-[var(--danger)]/10">
                                <div>
                                    <div className="text-sm font-bold text-[var(--text-primary)]">Cycle {item.cycle} • Slot #{item.slot.slotNumber}</div>
                                    <div className="text-xs text-[var(--danger)]">Missed Payment of {formatCurrency(item.amount, pot.config.currency)}</div>
                                </div>
                                <button
                                    onClick={() => setPaymentModalState({ slotId: item.slot._id, cycle: item.cycle, amount: item.amount })}
                                    className="bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-[var(--text-primary)] text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                                >
                                    Pay Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {mySlots.map(slot => {
                    const myTx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === pot.currentMonth && (t.userId === currentUserId || !t.userId));
                    let status: "UNPAID" | "PENDING" | "PAID" = "UNPAID";
                    if (myTx) status = myTx.status as "PENDING" | "PAID";

                    const isWinner = slot.drawOrder;
                    const wonAmount = pot.config.totalValue - (pot.config.totalValue * (pot.config.commission || 0) / 100);

                    // Calculate Share
                    let sharePct = 100;
                    if (slot.isSplit && slot.splitOwners) {
                        const myShare = slot.splitOwners.find((o: any) => o.userId === currentUserId);
                        sharePct = myShare ? myShare.sharePercentage : 0;
                    }
                    const dueAmount = (pot.config.contribution * sharePct) / 100;

                    return (
                        <div key={slot._id} className="bg-[var(--surface-deep)]/60 p-4 rounded-xl border border-[var(--border-subtle)]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">
                                        Slot #{slot.slotNumber}
                                        {sharePct < 100 && <span className="ml-2 text-[var(--accent-vivid)] text-[10px] bg-[var(--accent-vivid)]/10 px-1.5 py-0.5 rounded-full">{sharePct}% Share</span>}
                                    </div>
                                    <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                                        {status === 'PAID' ? 'Paid' : formatCurrency(dueAmount, pot.config.currency)}
                                    </div>
                                    {status !== 'PAID' && <div className="text-xs text-[var(--accent-secondary)]">Due by {nextDueDate}</div>}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'PAID' ? 'bg-[var(--accent-vivid)]/20 text-[var(--accent-vivid)]' : ' bg-[var(--danger)]/20 text-[var(--danger)]'}`}>
                                    {status}
                                </div>
                            </div>

                            {status === 'UNPAID' && (
                                <button
                                    onClick={() => setPaymentModalState({ slotId: slot._id, cycle: pot.currentMonth, amount: dueAmount })}
                                    className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-2 rounded-lg hover:opacity-90 mb-4 text-sm"
                                >
                                    Pay Now
                                </button>
                            )}

                            {status === 'PENDING' && (
                                <div className="text-center text-xs text-[var(--warning)] bg-[var(--warning)]/10 py-2 rounded-lg mb-4">
                                    Payment Pending Approval
                                </div>
                            )}

                            <div className="pt-4 border-t border-[var(--border-subtle)]">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-muted)]">Win Status</span>
                                    {isWinner ? (
                                        <span className="text-[var(--gold)] font-bold text-xs flex items-center gap-1">
                                            Won Cycle {isWinner} ({formatCurrency(wonAmount, pot.config.currency)})
                                        </span>
                                    ) : (
                                        <span className="text-[var(--text-muted)] text-xs">Not yet won</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {paymentModalState && (
                <PaymentModal
                    potId={pot._id}
                    slotId={paymentModalState.slotId}
                    monthIndex={paymentModalState.cycle}
                    amount={paymentModalState.amount}
                    currency={pot.config.currency}
                    onClose={() => setPaymentModalState(null)}
                    isForeman={false}
                    onForemanRecord={async (date) => {
                        await recordCashPayment({
                            potId: pot._id,
                            slotId: paymentModalState.slotId,
                            monthIndex: paymentModalState.cycle,
                            userId: currentUserId as Id<"users">,
                            paidAt: date
                        });
                    }}
                />
            )}
        </section>
    );
}


function MembersList({ members, potId, currentMonth, isForeman, isActive, currentUserId, currency }: { members: any[], potId: Id<"pots">, currentMonth: number, isForeman: boolean, isActive: boolean, currentUserId?: string, currency?: string }) {
    const recordCashPayment = useMutation(api.transactions.recordCashPayment);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const [paymentModalState, setPaymentModalState] = useState<{
        slotId: Id<"slots">,
        cycle: number,
        amount: number,
        isForemanAction?: boolean,
        userId?: Id<"users">
    } | null>(null);

    const toggleExpand = (userId: string) => {
        setExpandedUser(expandedUser === userId ? null : userId);
    };



    // NEW Handle Mark Paid (Foreman w/ Backdate)
    const handleMarkPaid = (slotId: Id<"slots">, userId: Id<"users">, monthIndex?: number, dueAmount: number = 0) => {
        const targetMonth = monthIndex !== undefined ? monthIndex : currentMonth;
        // Open Modal in Foreman Mode
        setPaymentModalState({
            slotId,
            cycle: targetMonth,
            amount: dueAmount,
            isForemanAction: true,
            userId
        });
    };


    if (members.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--text-muted)]">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No active members yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
                <Users className="text-[var(--accent-vivid)]" /> Participants ({members.length})
            </h3>

            <div className="grid grid-cols-1 gap-4">
                {members.map((m) => {
                    const isFullyPaid = m.totalDue === 0;
                    return (
                        <div key={m.userId} className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-deep)]/60 transition-colors"
                                onClick={() => toggleExpand(m.userId)}
                            >
                                <div className="flex items-center gap-3">
                                    {m.user.pictureUrl ? (
                                        <img src={m.user.pictureUrl} alt={m.user.name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[var(--surface-deep)] flex items-center justify-center font-bold text-[var(--text-muted)]">
                                            {m.user.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {m.user.name}
                                            {m.totalShare < 100 && <span className="text-[10px] bg-[var(--surface-deep)]/80 px-1.5 rounded-full text-[var(--text-muted)]">{m.totalShare}% Stake</span>}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)]">
                                            {m.slots.length} Slot{m.slots.length !== 1 ? 's' : ''} • {m.user.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">

                                        <div className={`font-bold font-mono ${isFullyPaid ? "text-[var(--accent-vivid)]" : "text-[var(--accent-secondary)]"}`}>
                                            {isFullyPaid ? "PAID" : `Due: ${formatCurrency(m.totalDue, currency)}`}
                                        </div>
                                        {!isFullyPaid && (
                                            <div className="text-[10px] text-[var(--text-muted)]">{m.paidCount}/{m.slots.length} Paid</div>
                                        )}
                                    </div>
                                    {expandedUser === m.userId ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedUser === m.userId && (
                                <div className="bg-[var(--surface-deep)]/60 p-4 border-t border-[var(--border-subtle)] space-y-2">
                                    {/* Missed Payments Section */}
                                    {m.missedPayments?.length > 0 && (
                                        <div className="mb-4  bg-[var(--danger)]/10 rounded-lg p-3 border border-[var(--danger)]/20">
                                            <div className="text-xs font-bold text-[var(--danger)] mb-2 flex items-center gap-1">
                                                <ShieldAlert size={12} /> Missed Payments
                                            </div>
                                            <div className="space-y-2">
                                                {m.missedPayments.map((missed: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs">
                                                        <span className="text-[var(--text-muted)]">
                                                            Cycle {missed.monthIndex + 1} • Slot #{missed.slotNumber}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-[var(--danger)]">{formatCurrency(missed.amount, currency)}</span>

                                                            {/* User Self-Pay Action */}
                                                            {missed.isMyPayment && missed.status === 'UNPAID' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentModalState({ slotId: missed.slotId, cycle: missed.monthIndex, amount: missed.amount });
                                                                    }}
                                                                    className="bg-[var(--danger)] text-[var(--text-on-accent)] text-[10px] font-bold px-3 py-1 rounded hover:bg-[var(--danger)]/90 shadow-sm"
                                                                >
                                                                    Pay Now
                                                                </button>
                                                            )}
                                                            {missed.status === 'PENDING' && (
                                                                <span className="text-[var(--warning)] text-[10px] bg-[var(--warning)]/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                                    <Clock size={10} /> Pending
                                                                </span>
                                                            )}

                                                            {/* Foreman Action */}
                                                            {isForeman && isActive && missed.status !== 'PENDING' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkPaid(missed.slotId, m.userId, missed.monthIndex, missed.amount);
                                                                    }}
                                                                    className="bg-[var(--surface-elevated)] border border-[var(--danger)]/30 text-[var(--danger)] text-[10px] px-2 py-0.5 rounded hover:bg-[var(--danger)]/20"
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Current Slots List */}
                                    {m.slots.map((slot: any) => {
                                        // Determine status for CURRENT month for this slot
                                        // Note: We need to know if this specific slot is pending/paid for current month.
                                        // The 'slot' object here has 'isPaid' computed earlier (which is boolean), but distinct PENDING state 
                                        // might need to be re-derived or passed down. 
                                        // Let's assume 'isPaid' covers PAID. For PENDING, we need to check transactions again or 
                                        // update the aggregation logic to pass 'status' instead of 'isPaid'.
                                        // For now, let's rely on what we have, but ideally 'slot' should have 'status'.
                                        // Actually checking 'isPaid' is purely based on 'status === "PAID"'.
                                        // Let's do a quick lookup if needed or assume we can add 'status' to slot object in aggregation.

                                        // REVISIT: I'll use the MembersList props for now.
                                        // Ideally I should update aggregation to pass 'status' string.

                                        return (
                                            <div key={slot._id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-[var(--surface-deep)]/60">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[var(--text-muted)] font-mono">Slot #{slot.slotNumber}</span>
                                                    {slot.isSplit && <span className="text-[10px] bg-[var(--surface-deep)]/80 px-1.5 rounded text-[var(--text-muted)]">{slot.share}%</span>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold ${slot.isPaid ? 'text-[var(--accent-vivid)]' : 'text-[var(--text-muted)]'}`}>
                                                        {slot.isPaid ? 'PAID' : formatCurrency(slot.due, currency)}
                                                    </span>

                                                    {/* Actions */}
                                                    {!slot.isPaid && isActive && (
                                                        <>
                                                            {/* Self Pay */}
                                                            {m.userId === currentUserId && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentModalState({ slotId: slot._id, cycle: currentMonth, amount: slot.due });
                                                                    }}
                                                                    className="bg-[var(--accent-vivid)] text-[var(--text-on-accent)] text-[10px] font-bold px-3 py-1 rounded hover:opacity-90 shadow-sm"
                                                                >
                                                                    Pay Now
                                                                </button>
                                                            )}

                                                            {/* Foreman Mark Paid */}
                                                            {isForeman && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkPaid(slot._id, m.userId, currentMonth, slot.due);
                                                                    }}
                                                                    className="bg-[var(--surface-elevated)] border border-[var(--accent-vivid)]/30 text-[var(--accent-vivid)] text-[10px] font-bold px-2 py-1 rounded hover:bg-[var(--accent-vivid)]/10"
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {slot.isPaid && <CheckCircle size={14} className="text-[var(--accent-vivid)]" />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {paymentModalState && (
                <PaymentModal
                    potId={potId}
                    slotId={paymentModalState.slotId}
                    monthIndex={paymentModalState.cycle}
                    amount={paymentModalState.amount}
                    currency={currency}
                    onClose={() => setPaymentModalState(null)}
                    isForeman={paymentModalState.isForemanAction}
                    onForemanRecord={async (date) => {
                        await recordCashPayment({
                            potId,
                            slotId: paymentModalState.slotId,
                            monthIndex: paymentModalState.cycle,
                            userId: paymentModalState.userId,
                            paidAt: date
                        });
                    }}
                />
            )}
        </div>
    );
}
