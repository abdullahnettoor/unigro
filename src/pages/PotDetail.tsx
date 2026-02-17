import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { SplitSlotModal } from "../components/SplitSlotModal"; // New
import { AddMemberModal } from "../components/AddMemberModal";
import { JoinPotModal } from "../components/JoinPotModal";
import { NextRoundModal } from "../components/NextRoundModal"; // New
import { PotVisualizer } from "../components/PotVisualizer";
import { PaymentModal } from "../components/PaymentComponents";
import { PotHistory } from "../components/PotHistory"; // New
import { Gavel, CheckCircle, Clock, Calendar, Coins, Share2, Layers, Play, ShieldCheck, Trash2, ArrowRight, Edit2, Info, EyeOff, ShieldAlert, PieChart, Users, ChevronDown, ChevronUp } from "lucide-react";

export function PotDetail() {
    const { potId } = useParams<{ potId: string }>();

    const pot = useQuery(api.pots.get, { potId: potId as Id<"pots"> });
    const currentUser = useQuery(api.users.current);
    const transactions = useQuery(api.transactions.list, { potId: potId as Id<"pots"> });

    const activatePot = useMutation(api.pots.activate);
    const runDraw = useMutation(api.pots.runDraw);
    const deleteSlot = useMutation(api.pots.deleteSlot);
    const recordPayout = useMutation(api.transactions.recordPayout);
    const recordCashPayment = useMutation(api.transactions.recordCashPayment); // Hoisted for Foreman Action

    // UI State
    const [showAddMember, setShowAddMember] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false); // New
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showNextRoundModal, setShowNextRoundModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState<Id<"slots"> | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const [showWinnerSelection, setShowWinnerSelection] = useState(false);
    const [selectedWinnerSlotNum, setSelectedWinnerSlotNum] = useState<number | null>(null);

    const [showPayoutModal, setShowPayoutModal] = useState<Id<"slots"> | null>(null);
    // Global Payment Modal State (for History & Foreman actions)
    const [globalPaymentState, setGlobalPaymentState] = useState<{
        slotId: Id<"slots">,
        cycle: number,
        amount: number,
        isForemanAction?: boolean, // New: Trigger Foreman Mode
        userId?: Id<"users"> // For Foreman to know who he is marking for
    } | null>(null);

    type Tab = 'dashboard' | 'rules' | 'slots' | 'members' | 'history' | 'approvals';
    const [activeTab, setActiveTab] = useState<Tab>('rules');
    const [hasConsolidatedTabs, setHasConsolidatedTabs] = useState(false);

    if (!pot || transactions === undefined) return <div className="p-8 text-center animate-pulse">Loading Pot Details...</div>;

    // Computed State
    const isDraft = pot.status === "DRAFT";
    const isActive = pot.status === "ACTIVE";

    const isForeman = currentUser?._id === pot.foremanId;
    const allSlots = pot.slots || [];
    const activeSlots = allSlots.filter(s => s.status === "FILLED" || s.status === "RESERVED");

    const mySlots = currentUser ? allSlots.filter(s =>
        s.userId === currentUser._id ||
        (s.isSplit && (s as any).splitOwners?.some((o: any) => o.userId === currentUser._id))
    ) : [];
    const isMember = mySlots.length > 0;

    // Tab Auto-Switch Logic
    if (!hasConsolidatedTabs && currentUser) {
        if (isMember || isForeman) {
            setActiveTab('dashboard');
        }
        setHasConsolidatedTabs(true);
    }

    // Constants
    const filledSlotNumbers = new Set(activeSlots.map(s => s.slotNumber));
    const virtualOpenSlots = Array.from({ length: pot.config.totalSlots }, (_, i) => i + 1)
        .filter(n => !filledSlotNumbers.has(n))
        .map(n => ({ slotNumber: n, _id: `virtual-${n}` }));

    // Split Slots Logic
    const reservedSlots = activeSlots.filter(s => s.status === "RESERVED");

    // DEBUG: Check if reserved slots are detected
    console.log("Active Slots:", activeSlots);
    console.log("Reserved Slots:", reservedSlots);

    const splitEligibleSlots = [
        ...reservedSlots.map(s => {
            const currentPct = (s as any).splitOwners?.reduce((sum: number, o: any) => sum + o.sharePercentage, 0) || 0;
            return {
                slotNumber: s.slotNumber,
                _id: s._id,
                isReserved: true,
                remainingPercentage: 100 - currentPct
            };
        }),
        ...virtualOpenSlots.map(s => ({ ...s, remainingPercentage: 100 }))
    ].sort((a, b) => a.slotNumber - b.slotNumber);

    console.log("Split Eligible Slots:", splitEligibleSlots);

    const filledCount = activeSlots.length;
    const availableCount = pot.config.totalSlots - filledCount;
    const hasOpenSlots = availableCount > 0;



    const commissionPct = pot.config.commission || 0;
    const commissionAmount = (pot.config.totalValue * commissionPct) / 100;
    const winningAmount = pot.config.totalValue - commissionAmount;
    const gracePeriod = pot.config.gracePeriodDays || 0;

    // Date Logic
    const getNextDate = (start: number | undefined, cycle: number, freq: string, grace: number = 0, nextDrawOverride?: number) => {
        if (nextDrawOverride) return {
            dateStr: new Date(nextDrawOverride).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            isEvent: false
        };
        if (freq === 'occasional' || !start) return { dateStr: "On Demand", isEvent: true };
        const date = new Date(start);
        if (freq === 'monthly') date.setMonth(date.getMonth() + cycle);
        else if (freq === 'quarterly') date.setMonth(date.getMonth() + (cycle * 3));
        else if (freq === 'weekly') date.setDate(date.getDate() + (cycle * 7));
        else if (freq === 'biweekly') date.setDate(date.getDate() + (cycle * 14));

        date.setDate(date.getDate() + grace);
        return {
            dateStr: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            isEvent: false
        };
    };

    const nextDueDate = getNextDate(pot.startDate, pot.currentMonth, pot.config.frequency).dateStr;
    const nextDrawDate = getNextDate(pot.startDate, pot.currentMonth, pot.config.frequency, gracePeriod, pot.nextDrawDate).dateStr;

    // Actions
    const handleActivate = async () => {
        if (availableCount > 0) return alert(`Cannot activate: ${availableCount} slots are still empty.`);
        if (confirm("Are you sure? Financial rules will be locked.")) {
            try {
                await activatePot({ potId: pot._id });
            } catch (error: any) {
                console.error(error);
                // Extract useful message from Convex error
                const msg = error.message.includes("Verified") ? "You must be a Verified User to activate a pot." : "Failed to activate pot.";
                alert(msg);
            }
        }
    };


    const handleDraw = async () => {
        if (confirm("Run the draw for this month?")) {
            setIsDrawing(true);
            try {
                // Determine Winner
                if (selectedWinnerSlotNum) {
                    await runDraw({ potId: pot._id, customWinnerSlotNumber: selectedWinnerSlotNum });
                } else {
                    await runDraw({ potId: pot._id });
                }
                setIsDrawing(false);
                setShowWinnerSelection(false);
                setSelectedWinnerSlotNum(null);
            } catch (err) {
                console.error(err);
                setIsDrawing(false);
                alert("Draw failed");
            }
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Join my Chit Fund: ${pot.title}`,
            text: `Pool Value: ₹${pot.config.totalValue.toLocaleString()}. Join now!`,
            url: window.location.href
        };
        if (navigator.share) await navigator.share(shareData);
        else {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
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
                else stats.paidCount++;
            });
        }
    });

    const memberList = Array.from(memberStats.values()).sort((a, b) => a.user.name.localeCompare(b.user.name));


    // --- RENDER ---
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <header className="mb-8 border-b border-white/5 pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-display font-bold">{pot.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase ${isDraft ? "bg-yellow-500/20 text-yellow-300" : "bg-[#C1FF72]/20 text-[#C1FF72]"}`}>
                                {pot.status}
                            </span>
                        </div>
                        <ForemanDisplay foremanId={pot.foremanId} />
                        {pot.foreman?.verificationStatus !== "VERIFIED" && (
                            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                                <ShieldAlert size={14} className="text-yellow-500" />
                                <span>
                                    <strong>Caution:</strong> Foreman is Unverified.
                                </span>
                            </div>
                        )}
                    </div>


                    <div className="flex flex-wrap items-center gap-2">
                        {/* Action Buttons */}
                        {(isActive || isDraft) && hasOpenSlots && (
                            <button onClick={() => setShowJoinModal(true)} className="bg-[#C1FF72] text-[#1B3022] font-bold px-6 py-2 rounded-full hover:opacity-90 shadow-lg animate-pulse">
                                Join Pot
                            </button>
                        )}

                        <button onClick={handleShare} className="bg-white/10 text-white font-bold px-4 py-2 rounded-full hover:bg-white/20 flex items-center gap-2 text-sm">
                            <Share2 size={16} /> Share
                        </button>

                        {isForeman && (
                            <>
                                {isDraft && (
                                    <>
                                        <button onClick={() => window.location.href = `/create?edit=${pot._id}`} className="bg-[#232931] text-white border border-white/10 font-bold px-4 py-2 rounded-full hover:bg-white/10 flex items-center gap-2 text-sm">
                                            <Edit2 size={16} /> Edit Pot
                                        </button>
                                        <button onClick={handleActivate} className="bg-[#C1FF72] text-[#1B3022] font-bold px-4 py-2 rounded-full hover:opacity-90 flex items-center gap-2 text-sm">
                                            <Play size={16} /> Activate Pot
                                        </button>
                                    </>
                                )}
                                {isActive && (
                                    <>
                                        {!currentWinnerSlot ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => setShowWinnerSelection(true)} className="bg-[#232931] text-white border border-white/10 font-bold px-4 py-2 rounded-full hover:bg-white/10 flex items-center gap-2 text-sm">
                                                    Manual Winner
                                                </button>
                                                <button onClick={handleDraw} disabled={isDrawing} className="bg-[#E07A5F] text-white font-bold px-4 py-2 rounded-full hover:opacity-90 flex items-center gap-2 text-sm">
                                                    <Gavel size={16} /> {isDrawing ? "Rolling..." : "Run Draw"}
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setShowNextRoundModal(true)} className="bg-[#C1FF72] text-[#1B3022] font-bold px-4 py-2 rounded-full hover:opacity-90 flex items-center gap-2 text-sm animate-pulse">
                                                <ArrowRight size={16} /> Next Round
                                            </button>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Pot Stats Grid - Keep as is, it uses pot.config */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase mb-1">Total Pool</div>
                        <div className="text-xl font-mono">₹{pot.config.totalValue.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase mb-1">Winner Gets</div>
                        <div className="text-xl font-mono text-[#E07A5F]">₹{winningAmount.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase mb-1">Next Payment</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1"><Clock size={12} className="text-[#C1FF72]" /> {nextDueDate}</div>
                    </div>
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase mb-1">Next Draw</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1"><Calendar size={12} className="text-[#E07A5F]" /> {nextDrawDate}</div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-white/5 mb-8 overflow-x-auto">
                {(isMember || isForeman) && (
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? "border-[#C1FF72] text-[#C1FF72]" : "border-transparent text-gray-400 hover:text-white"}`}
                    >
                        Dashboard
                    </button>
                )}

                {isForeman && isActive && (
                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'approvals' ? "border-[#C1FF72] text-[#C1FF72]" : "border-transparent text-gray-400 hover:text-white"}`}
                    >
                        Approvals {transactions && transactions.filter(t => t.status === "PENDING").length > 0 && <span className="ml-1 bg-[#C1FF72] text-[#1B3022] px-1.5 py-0.5 rounded-full text-[10px]">{transactions.filter(t => t.status === "PENDING").length}</span>}
                    </button>
                )}

                {(isMember || isForeman) && (
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'members' ? "border-[#C1FF72] text-[#C1FF72]" : "border-transparent text-gray-400 hover:text-white"}`}
                    >
                        Members <span className="ml-1 bg-white/10 px-1.5 py-0.5 rounded-full text-[10px] text-gray-300">{memberList.length}</span>
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('rules')}
                    className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rules' ? "border-[#C1FF72] text-[#C1FF72]" : "border-transparent text-gray-400 hover:text-white"}`}
                >
                    Rules & Info
                </button>

                {(isMember || isForeman) && (
                    <>
                        <button
                            onClick={() => setActiveTab('slots')}
                            className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'slots' ? "border-[#C1FF72] text-[#C1FF72]" : "border-transparent text-gray-400 hover:text-white"}`}
                        >
                            Slots ({activeSlots.length}/{pot.config.totalSlots})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? "border-[#C1FF72] text-[#C1FF72]" : "border-transparent text-gray-400 hover:text-white"}`}
                        >
                            History
                        </button>
                    </>
                )}
            </div>

            {/* TAB CONTENT: DASHBOARD */}
            {activeTab === 'dashboard' && (isMember || isForeman) && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Member Dashboard */}
                    {isMember && !isDraft && (
                        <MemberDashboard
                            pot={pot}
                            mySlots={mySlots}
                            transactions={transactions || []}
                            nextDueDate={nextDueDate}
                            currentUserId={currentUser?._id || ""}
                        />
                    )}

                    {/* Visualizer */}
                    {(isMember || isForeman) && (
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                                    <Clock className="text-[#C1FF72]" /> Current Cycle
                                </h3>
                                <button onClick={() => setActiveTab('slots')} className="text-xs text-[#C1FF72] hover:underline">View All Slots</button>
                            </div>
                            <PotVisualizer pot={pot} slots={allSlots} currentMonthIndex={pot.currentMonth} />
                            {currentWinnerSlot && (
                                <div className="text-center mt-4 animate-bounce">
                                    <p className="text-gray-400 text-sm">Winner of Cycle {pot.currentMonth}</p>
                                    <p className="text-2xl font-display font-bold text-[#FFD700]">Slot #{currentWinnerSlot.slotNumber}: {currentWinnerSlot.user?.name}</p>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            )}

            {/* TAB CONTENT: MEMBERS (NEW) */}
            {activeTab === 'members' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MembersList
                        members={memberList}
                        potId={pot._id}
                        currentMonth={pot.currentMonth}
                        isForeman={isForeman}
                        isActive={isActive}
                        currentUserId={currentUser?._id} // Pass current user ID
                    />
                </div>
            )}

            {/* TAB CONTENT: RULES & INFO */}
            {activeTab === 'rules' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#232931]/50 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
                            <Info className="text-[#C1FF72]" /> Rules & Description
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none mb-8">
                            <p className="whitespace-pre-wrap">{pot.description || "No specific description provided by the Foreman."}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Configuration */}
                            <div className="bg-white/5 p-6 rounded-xl space-y-4">
                                <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2"><Layers size={14} /> Pot Configuration</h4>
                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <div className="text-gray-400">Total Value</div><div className="text-white font-mono text-right">₹{pot.config.totalValue.toLocaleString()}</div>
                                    <div className="text-gray-400">Contribution</div><div className="text-white font-mono text-right">₹{pot.config.contribution.toLocaleString()}</div>
                                    <div className="text-gray-400">Frequency</div><div className="text-white capitalize text-right">{pot.config.frequency}</div>
                                    <div className="text-gray-400">Duration</div><div className="text-white text-right">{pot.config.duration} Cycles</div>
                                    <div className="text-gray-400">Commission</div><div className="text-white text-right">{pot.config.commission}%</div>
                                    <div className="text-gray-400">Total Slots</div><div className="text-white text-right">{pot.config.totalSlots}</div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            {pot.bankDetails && (
                                <div className="bg-white/5 p-6 rounded-xl space-y-4">
                                    <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2"><Coins size={14} /> Bank Details</h4>
                                    <div className="whitespace-pre-wrap text-sm text-gray-300 font-mono bg-black/20 p-4 rounded-lg">
                                        {pot.bankDetails}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        * Please make payments to the account above and upload proof for approval.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: APPROVALS (FOREMAN) */}
            {activeTab === 'approvals' && isForeman && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <section>
                        <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-[#C1FF72]" /> Pending Approvals
                        </h3>
                        {transactions && transactions.filter(t => t.status === "PENDING").length > 0 ? (
                            <div className="bg-[#232931]/50 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                                {transactions.filter(t => t.status === "PENDING").map(tx => (
                                    <div key={tx._id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                                                #{tx.slot?.slotNumber}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{tx.user?.name || "Unknown User"}</div>
                                                <div className="text-xs text-gray-500">Slot #{tx.slot?.slotNumber} • Cycle {tx.monthIndex}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {tx.proofUrl && (
                                                <a href={tx.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-[#C1FF72] hover:underline">View Proof</a>
                                            )}
                                            <ApproveButton transactionId={tx._id} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No pending approvals</p>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* TAB CONTENT: SLOTS */}
            {activeTab === 'slots' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                                <Layers className="text-[#C1FF72]" /> All Slots
                            </h2>
                            {isForeman && (
                                <>
                                    {availableCount > 0 && (
                                        <button onClick={() => setShowAddMember(true)} className="text-sm bg-[#232931] border border-white/10 px-4 py-2 rounded-lg hover:border-white/30 transition-all">
                                            + Assign Slot
                                        </button>
                                    )}
                                    {(availableCount > 0 || reservedSlots.length > 0) && (
                                        <button onClick={() => setShowSplitModal(true)} className="text-sm bg-[#232931] border border-white/10 px-4 py-2 rounded-lg hover:border-white/30 transition-all ml-2">
                                            <PieChart size={14} className="inline mr-1" /> Split Slot
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {(!isMember && !isForeman) ? (
                            <div className="bg-[#232931]/50 border border-white/5 rounded-2xl p-8 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <EyeOff size={32} className="text-gray-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Member List Hidden</h3>
                                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                    To protect the privacy of our members, the full participant list is only visible to joined members.
                                </p>
                                {(isActive || isDraft) && hasOpenSlots ? (
                                    <button onClick={() => setShowJoinModal(true)} className="bg-[#C1FF72] text-[#1B3022] font-bold px-8 py-3 rounded-full hover:opacity-90 shadow-lg">
                                        Join Pot to View
                                    </button>
                                ) : (
                                    <div className="text-[#E07A5F] font-bold">Pot Full</div>
                                )}
                            </div>
                        ) : (
                            <><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(() => {
                                    // Generate Grid including virtuals
                                    const gridSlots = [];
                                    const slotMap = new Map(allSlots.map(s => [s.slotNumber, s]));

                                    for (let i = 1; i <= pot.config.totalSlots; i++) {
                                        if (slotMap.has(i)) {
                                            gridSlots.push(slotMap.get(i)!);
                                        } else {
                                            gridSlots.push({
                                                _id: `virtual-${i}` as any,
                                                slotNumber: i,
                                                status: "OPEN" as const,
                                                user: null,
                                                drawOrder: undefined,
                                                isGhost: false
                                            });
                                        }
                                    }

                                    return gridSlots.map(slot => {
                                        if (slot.status === "OPEN") {
                                            return (
                                                <div key={slot._id} className="p-4 rounded-xl border border-dashed border-white/10 flex items-center justify-between opacity-50">
                                                    <span className="font-mono">Slot #{slot.slotNumber}</span>
                                                    <span className="text-xs text-gray-400">Available</span>
                                                </div>
                                            );
                                        }

                                        const user = slot.user;
                                        // Check Payment Status
                                        const slotTx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === pot.currentMonth);
                                        const isPaid = slotTx?.status === "PAID";
                                        const isPending = slotTx?.status === "PENDING";

                                        // Check Win Status
                                        const isWinner = slot.drawOrder;
                                        const payoutTx = isWinner ? transactions?.find(t => t.slotId === slot._id && t.type === 'payout' && t.monthIndex === slot.drawOrder) : null;

                                        // COMPACT VIEW FOR SPLIT SLOTS
                                        if (slot.isSplit) {
                                            return (
                                                <div
                                                    key={slot._id}
                                                    onClick={() => {
                                                        const el = document.getElementById(`split-detail-${slot._id}`);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    className="bg-[#232931] p-4 rounded-xl border border-white/5 hover:border-[#C1FF72] transition-colors cursor-pointer relative group flex flex-col gap-3"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-white flex items-center gap-2">
                                                            Slot #{slot.slotNumber}
                                                            {isWinner && <span className="text-[10px] text-[#FFD700] border border-[#FFD700] px-1 rounded">WINNER</span>}
                                                        </span>
                                                        <span className="text-[10px] bg-[#C1FF72]/10 text-[#C1FF72] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Split</span>
                                                    </div>
                                                    {/* Visual Bar */}
                                                    <div className="flex h-2 w-full rounded-full overflow-hidden bg-black/40">
                                                        {(slot as any).splitOwners?.map((owner: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                style={{ width: `${owner.sharePercentage}%` }}
                                                                className={`h-full ${idx % 2 === 0 ? 'bg-[#C1FF72]' : 'bg-[#a3d95d]'} border-r border-black/20`}
                                                            />
                                                        ))}
                                                        {/* Remaining space */}
                                                        {(slot as any).splitOwners?.reduce((acc: number, curr: any) => acc + curr.sharePercentage, 0) < 100 && (
                                                            <div className="h-full bg-white/5 flex-1" />
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 flex justify-between">
                                                        <span>{(slot as any).splitOwners?.length || 0} Owners</span>
                                                        <span className="group-hover:text-[#C1FF72] transition-colors">View Details ↓</span>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <div key={slot._id} className={`bg-[#232931] p-4 rounded-xl flex items-center gap-4 border ${isWinner ? "border-[#FFD700]" : "border-white/5"} relative group`}>
                                                {user?.pictureUrl ? <img src={user.pictureUrl} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400">#{slot.slotNumber}</div>}

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold flex items-center gap-2 truncate">
                                                        {user ? user.name : (slot.isSplit ? "Split Slot" : `Slot #${slot.slotNumber}`)}
                                                        {user && slot.isGhost && <span className="text-[10px] bg-gray-700 px-1.5 rounded text-gray-300">GHOST</span>}
                                                        {isWinner && <span className="text-xs text-[#FFD700] border border-[#FFD700] px-1 rounded">WINNER (C{slot.drawOrder})</span>}
                                                        {!slot.isSplit && isPaid && <span className="text-[10px] bg-[#C1FF72]/20 text-[#C1FF72] px-1.5 rounded font-bold">PAID</span>}
                                                    </div>

                                                    {/* Split Owners Display */}
                                                    {slot.isSplit && (slot as any).splitOwners && (
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            {(slot as any).splitOwners.map((owner: any) => {
                                                                // Check individual payment status
                                                                const ownerTx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === pot.currentMonth && t.userId === owner.userId);
                                                                const isOwnerPaid = ownerTx?.status === "PAID";
                                                                const isOwnerPending = ownerTx?.status === "PENDING";

                                                                return (
                                                                    <div key={owner.userId} className="text-xs text-gray-300 flex justify-between items-center w-full bg-black/20 px-2 py-1.5 rounded">
                                                                        <span>{owner.userName}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-[#C1FF72] text-[10px]">{owner.sharePercentage}%</span>
                                                                            {isActive && (
                                                                                <>
                                                                                    {isOwnerPaid ? (
                                                                                        <CheckCircle size={10} className="text-[#C1FF72]" />
                                                                                    ) : isOwnerPending ? (
                                                                                        <Clock size={10} className="text-yellow-400" />
                                                                                    ) : (
                                                                                        <div className="w-2.5 h-2.5 rounded-full border border-red-500/50 bg-red-500/20" title="Unpaid" />
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {(slot as any).splitOwners.reduce((acc: number, curr: any) => acc + curr.sharePercentage, 0) < 100 && (
                                                                <div className="text-[10px] text-gray-500 italic mt-1 px-1">
                                                                    {100 - (slot as any).splitOwners.reduce((acc: number, curr: any) => acc + curr.sharePercentage, 0)}% available
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!slot.isSplit && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                                            Slot #{slot.slotNumber} • {user?.phone}
                                                            {isPaid && <span className="text-[#C1FF72] flex items-center gap-1"><CheckCircle size={10} /> Paid</span>}
                                                            {isPending && <span className="text-yellow-400 flex items-center gap-1"><Clock size={10} /> Pending</span>}
                                                            {payoutTx && <span className="text-[#C1FF72] ml-2 font-bold">Payout Done</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Foreman Actions */}
                                                {isForeman && (
                                                    <div className="flex flex-col gap-1 items-end">
                                                        {/* Delete Slot (Draft only) */}
                                                        {isDraft && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm(`Remove Slot #${slot.slotNumber}?`)) {
                                                                        await deleteSlot({ potId: pot._id, slotNumber: slot.slotNumber });
                                                                    }
                                                                }}
                                                                className="text-red-400 hover:text-red-300 p-1"
                                                                title="Remove Slot"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}

                                                        {isActive && (
                                                            <>
                                                                {/* Removed MarkPaidButton - Use Members Tab */}
                                                                {isWinner && !payoutTx && (
                                                                    <button onClick={() => setShowPayoutModal(slot._id)} className="bg-[#E07A5F] text-white text-[10px] font-bold px-2 py-1 rounded">
                                                                        Record Payout
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                })()}
                            </div>

                                {/* SECTION: DETAILED SPLIT SLOTS */}
                                {allSlots.some(s => s.isSplit) && (
                                    <div className="mt-12 pt-8 border-t border-white/5">
                                        <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                                            <PieChart className="text-[#C1FF72]" /> Shared / Split Slots
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {allSlots.filter(s => s.isSplit).map(slot => {

                                                // Check Win Status
                                                const isWinner = slot.drawOrder;
                                                const payoutTx = isWinner ? transactions?.find(t => t.slotId === slot._id && t.type === 'payout' && t.monthIndex === slot.drawOrder) : null;

                                                return (
                                                    <div id={`split-detail-${slot._id}`} key={slot._id} className={`bg-[#232931] p-4 rounded-xl flex items-center gap-4 border ${isWinner ? "border-[#FFD700]" : "border-white/5"} relative group`}>
                                                        <div className="w-10 h-10 rounded-full bg-[#1a1f26] border border-white/10 flex items-center justify-center font-bold text-[#C1FF72]">
                                                            #{slot.slotNumber}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold flex items-center gap-2 truncate text-white mb-2">
                                                                Split Slot #{slot.slotNumber}
                                                                {isWinner && <span className="text-xs text-[#FFD700] border border-[#FFD700] px-1 rounded">WINNER (C{slot.drawOrder})</span>}
                                                            </div>

                                                            <div className="flex flex-col gap-1 mt-1">
                                                                {(slot as any).splitOwners?.map((owner: any) => {
                                                                    const ownerTx = transactions?.find(t => t.slotId === slot._id && t.monthIndex === pot.currentMonth && t.userId === owner.userId);
                                                                    const isOwnerPaid = ownerTx?.status === "PAID";
                                                                    const isOwnerPending = ownerTx?.status === "PENDING";

                                                                    return (
                                                                        <div key={owner.userId} className="text-xs text-gray-300 flex justify-between items-center w-full bg-black/20 px-2 py-1.5 rounded border border-white/5">
                                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                                {owner.userPictureUrl ? (
                                                                                    <img src={owner.userPictureUrl} alt={owner.userName} className="w-5 h-5 rounded-full object-cover border border-white/10" />
                                                                                ) : (
                                                                                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center font-bold text-[8px] text-gray-400">
                                                                                        {owner.userName?.charAt(0)}
                                                                                    </div>
                                                                                )}
                                                                                <span className="truncate">{owner.userName}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                <span className="font-mono text-[#C1FF72] text-[10px]">{owner.sharePercentage}%</span>
                                                                                {isActive && (
                                                                                    <>
                                                                                        {isOwnerPaid ? (
                                                                                            <CheckCircle size={10} className="text-[#C1FF72]" />
                                                                                        ) : isOwnerPending ? (
                                                                                            <Clock size={10} className="text-yellow-400" />
                                                                                        ) : (
                                                                                            <div className="w-2.5 h-2.5 rounded-full border border-red-500/50 bg-red-500/20" title="Unpaid" />
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );

                                                                })}
                                                                {(slot as any).splitOwners?.reduce((acc: number, curr: any) => acc + curr.sharePercentage, 0) < 100 && (
                                                                    <div className="text-[10px] text-gray-500 italic mt-1 px-1">
                                                                        {100 - (slot as any).splitOwners?.reduce((acc: number, curr: any) => acc + curr.sharePercentage, 0)}% available
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Foreman Actions for Split Slots */}
                                                        {isForeman && isActive && isWinner && !payoutTx && (
                                                            <div className="absolute top-2 right-2">
                                                                <button onClick={() => setShowPayoutModal(slot._id)} className="bg-[#E07A5F] text-white text-[10px] font-bold px-2 py-1 rounded">
                                                                    Record Payout
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div >
            )
            }

            {/* TAB CONTENT: HISTORY */}
            {
                activeTab === 'history' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                )
            }

            {/* Modals */}
            {
                showNextRoundModal && (
                    <NextRoundModal
                        potId={pot._id}
                        currentMonth={pot.currentMonth}
                        totalMonths={pot.config.duration}
                        defaultNextDate={new Date().toISOString().split('T')[0]}
                        isOccasional={pot.config.frequency === 'occasional'}
                        onClose={() => setShowNextRoundModal(false)}
                    />
                )
            }

            {
                showJoinModal && (
                    <JoinPotModal
                        potId={pot._id}
                        totalValue={pot.config.totalValue}
                        contribution={pot.config.contribution}
                        totalSlots={pot.config.totalSlots}
                        filledSlots={filledCount}
                        onClose={() => setShowJoinModal(false)}
                        onViewRules={() => {
                            setShowJoinModal(false);
                            setActiveTab('rules');
                        }}
                    />
                )
            }

            {showAddMember && <AddMemberModal potId={pot._id} openSlots={virtualOpenSlots} onClose={() => setShowAddMember(false)} />}
            {showSplitModal && <SplitSlotModal potId={pot._id} openSlots={splitEligibleSlots} onClose={() => setShowSplitModal(false)} />}

            {showUploadModal && (() => {
                const slot = allSlots.find(s => s._id === showUploadModal);
                let amount = pot.config.contribution;
                if (slot?.isSplit && currentUser) {
                    const share = (slot as any).splitOwners?.find((o: any) => o.userId === currentUser._id);
                    if (share) amount = (pot.config.contribution * share.sharePercentage) / 100;
                }
                return <PaymentModal potId={pot._id} slotId={showUploadModal} monthIndex={pot.currentMonth} amount={amount} onClose={() => setShowUploadModal(null)} />;
            })()}

            {
                showPayoutModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1f26] border border-white/10 rounded-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold mb-4">Record Payout</h3>
                            <p className="text-gray-400 text-sm mb-4">Confirm payout for Slot winner.</p>
                            <button onClick={async () => {
                                await recordPayout({ potId: pot._id, slotId: showPayoutModal, monthIndex: pot.currentMonth, amount: winningAmount });
                                setShowPayoutModal(null);
                            }} className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-3 rounded-xl mb-2">Confirm Paid</button>
                            <button onClick={() => setShowPayoutModal(null)} className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl">Cancel</button>
                        </div>
                    </div>
                )
            }

            {
                showWinnerSelection && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1f26] border border-white/10 rounded-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold mb-4">Select Winner Manually</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                {activeSlots.filter(s => !s.drawOrder).map(s => (
                                    <button
                                        key={s._id}
                                        onClick={() => setSelectedWinnerSlotNum(s.slotNumber)}
                                        className={`w-full p-3 rounded-lg text-left border ${selectedWinnerSlotNum === s.slotNumber ? "border-[#C1FF72] bg-[#C1FF72]/10" : "border-white/10 bg-[#232931]"}`}
                                    >
                                        Slot #{s.slotNumber} - {s.user?.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowWinnerSelection(false)} className="flex-1 bg-gray-800 py-2 rounded-lg">Cancel</button>
                                <button onClick={handleDraw} disabled={!selectedWinnerSlotNum} className="flex-1 bg-[#C1FF72] text-[#1B3022] font-bold py-2 rounded-lg">Confirm</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Generic Payment Modal (History / Foreman) */}
            {globalPaymentState && (
                <PaymentModal
                    potId={pot._id}
                    slotId={globalPaymentState.slotId}
                    monthIndex={globalPaymentState.cycle}
                    amount={globalPaymentState.amount}
                    onClose={() => setGlobalPaymentState(null)}
                    isForeman={globalPaymentState.isForemanAction}
                    onForemanRecord={async (date) => {
                        await recordCashPayment({
                            potId: pot._id,
                            slotId: globalPaymentState.slotId,
                            monthIndex: globalPaymentState.cycle,
                            userId: globalPaymentState.userId,
                            paidAt: date
                        });
                    }}
                />
            )}

            {/* Edit Pot / Next Round modals omitted for brevity, logic is same as before but using updatePot/advanceCycle from simple form */}
        </div >
    );
}

function ApproveButton({ transactionId }: { transactionId: Id<"transactions"> }) {
    const approvePayment = useMutation(api.transactions.approvePayment);
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        if (confirm("Confirm payment receipt?")) {
            setLoading(true);
            await approvePayment({ transactionId });
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleApprove}
            disabled={loading}
            className="bg-[#232931] border border-white/10 hover:bg-[#C1FF72] hover:text-[#1B3022] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
            {loading ? "..." : "Approve"}
        </button>
    );
}



function ForemanDisplay({ foremanId }: { foremanId: Id<"users"> }) {
    const foreman = useQuery(api.users.get, { userId: foremanId });

    if (!foreman) return <div className="text-xs text-gray-500 animate-pulse">Loading Foreman...</div>;

    return (
        <div className="flex items-center gap-2 mt-2">
            {foreman.pictureUrl ? (
                <img src={foreman.pictureUrl} alt={foreman.name} className="w-6 h-6 rounded-full border border-white/10" />
            ) : (
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400">
                    {foreman.name?.charAt(0)}
                </div>
            )}
            <span className="text-sm text-gray-400">Managed by <span className="text-white font-bold">{foreman.name}</span></span>
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
        <section className="mb-8 p-6 bg-[#232931] border border-[#C1FF72]/20 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Coins size={100} className="text-[#C1FF72]" />
            </div>

            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 z-10 relative">
                <Clock className="text-[#C1FF72]" /> Your Dashboard
            </h3>

            {/* Overdue Payments Alert */}
            {overduePayments.length > 0 && (
                <div className="mb-6 relative z-10 bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-pulse">
                    <h4 className="text-red-400 font-bold flex items-center gap-2 mb-3">
                        <ShieldAlert size={20} /> Action Required: Overdue Payments
                    </h4>
                    <div className="space-y-3">
                        {overduePayments.map((item) => (
                            <div key={`${item.slot._id}-${item.cycle}`} className="flex justify-between items-center bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                <div>
                                    <div className="text-sm font-bold text-white">Cycle {item.cycle} • Slot #{item.slot.slotNumber}</div>
                                    <div className="text-xs text-red-300">Missed Payment of ₹{item.amount.toLocaleString()}</div>
                                </div>
                                <button
                                    onClick={() => setPaymentModalState({ slotId: item.slot._id, cycle: item.cycle, amount: item.amount })}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
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
                        <div key={slot._id} className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                                        Slot #{slot.slotNumber}
                                        {sharePct < 100 && <span className="ml-2 text-[#C1FF72] text-[10px] bg-[#C1FF72]/10 px-1.5 py-0.5 rounded-full">{sharePct}% Share</span>}
                                    </div>
                                    <div className="text-2xl font-bold font-mono text-white">
                                        {status === 'PAID' ? 'Paid' : `₹${dueAmount.toLocaleString()}`}
                                    </div>
                                    {status !== 'PAID' && <div className="text-xs text-[#E07A5F]">Due by {nextDueDate}</div>}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'PAID' ? 'bg-[#C1FF72]/20 text-[#C1FF72]' : 'bg-red-500/20 text-red-300'}`}>
                                    {status}
                                </div>
                            </div>

                            {status === 'UNPAID' && (
                                <button
                                    onClick={() => setPaymentModalState({ slotId: slot._id, cycle: pot.currentMonth, amount: dueAmount })}
                                    className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-2 rounded-lg hover:opacity-90 mb-4 text-sm"
                                >
                                    Pay Now
                                </button>
                            )}

                            {status === 'PENDING' && (
                                <div className="text-center text-xs text-yellow-400 bg-yellow-400/10 py-2 rounded-lg mb-4">
                                    Payment Pending Approval
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Win Status</span>
                                    {isWinner ? (
                                        <span className="text-[#FFD700] font-bold text-xs flex items-center gap-1">
                                            Won Cycle {isWinner} (₹{wonAmount.toLocaleString()})
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 text-xs">Not yet won</span>
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


function MembersList({ members, potId, currentMonth, isForeman, isActive, currentUserId }: { members: any[], potId: Id<"pots">, currentMonth: number, isForeman: boolean, isActive: boolean, currentUserId?: string }) {
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
            <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No active members yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
                <Users className="text-[#C1FF72]" /> Participants ({members.length})
            </h3>

            <div className="grid grid-cols-1 gap-4">
                {members.map((m) => {
                    const isFullyPaid = m.totalDue === 0;
                    return (
                        <div key={m.userId} className="bg-[#232931] border border-white/5 rounded-xl overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => toggleExpand(m.userId)}
                            >
                                <div className="flex items-center gap-3">
                                    {m.user.pictureUrl ? (
                                        <img src={m.user.pictureUrl} alt={m.user.name} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400">
                                            {m.user.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {m.user.name}
                                            {m.totalShare < 100 && <span className="text-[10px] bg-white/10 px-1.5 rounded-full text-gray-400">{m.totalShare}% Stake</span>}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {m.slots.length} Slot{m.slots.length !== 1 ? 's' : ''} • {m.user.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">

                                        <div className={`font-bold font-mono ${isFullyPaid ? "text-[#C1FF72]" : "text-[#E07A5F]"}`}>
                                            {isFullyPaid ? "PAID" : `Due: ₹${m.totalDue.toLocaleString()}`}
                                        </div>
                                        {!isFullyPaid && (
                                            <div className="text-[10px] text-gray-500">{m.paidCount}/{m.slots.length} Paid</div>
                                        )}
                                    </div>
                                    {expandedUser === m.userId ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedUser === m.userId && (
                                <div className="bg-black/20 p-4 border-t border-white/5 space-y-2">
                                    {/* Missed Payments Section */}
                                    {m.missedPayments?.length > 0 && (
                                        <div className="mb-4 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                                            <div className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                                                <ShieldAlert size={12} /> Missed Payments
                                            </div>
                                            <div className="space-y-2">
                                                {m.missedPayments.map((missed: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-300">
                                                            Cycle {missed.monthIndex + 1} • Slot #{missed.slotNumber}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-red-400">₹{missed.amount.toLocaleString()}</span>

                                                            {/* User Self-Pay Action */}
                                                            {missed.isMyPayment && missed.status === 'UNPAID' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentModalState({ slotId: missed.slotId, cycle: missed.monthIndex, amount: missed.amount });
                                                                    }}
                                                                    className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded hover:bg-red-600 shadow-sm"
                                                                >
                                                                    Pay Now
                                                                </button>
                                                            )}
                                                            {missed.status === 'PENDING' && (
                                                                <span className="text-yellow-400 text-[10px] bg-yellow-400/10 px-2 py-0.5 rounded flex items-center gap-1">
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
                                                                    className="bg-[#232931] border border-red-500/30 text-red-300 text-[10px] px-2 py-0.5 rounded hover:bg-red-500/20"
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
                                            <div key={slot._id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 font-mono">Slot #{slot.slotNumber}</span>
                                                    {slot.isSplit && <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-400">{slot.share}%</span>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold ${slot.isPaid ? 'text-[#C1FF72]' : 'text-gray-300'}`}>
                                                        {slot.isPaid ? 'PAID' : `₹${slot.due.toLocaleString()}`}
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
                                                                    className="bg-[#C1FF72] text-[#1B3022] text-[10px] font-bold px-3 py-1 rounded hover:opacity-90 shadow-sm"
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
                                                                    className="bg-[#232931] border border-[#C1FF72]/30 text-[#C1FF72] text-[10px] font-bold px-2 py-1 rounded hover:bg-[#C1FF72]/10"
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {slot.isPaid && <CheckCircle size={14} className="text-[#C1FF72]" />}
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
