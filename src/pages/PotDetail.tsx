import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { AddMemberModal } from "../components/AddMemberModal";
import { PotVisualizer } from "../components/PotVisualizer";
import { PaymentStatusCard, PaymentModal } from "../components/PaymentComponents";
import { Users, ShieldCheck, Play, User, Gavel, CheckCircle, Clock, Calendar, Landmark, Info, Coins, Share2, Archive } from "lucide-react";

export function PotDetail() {
    const { potId } = useParams<{ potId: string }>();
    const navigate = useNavigate();
    const pot = useQuery(api.pots.get, { potId: potId as Id<"pots"> });
    const currentUser = useQuery(api.users.current);
    const activatePot = useMutation(api.pots.activate);
    const runDraw = useMutation(api.pots.runDraw);
    const overrideWinner = useMutation(api.pots.overrideWinner);
    const updatePot = useMutation(api.pots.updatePot);
    const advanceCycle = useMutation(api.pots.advanceCycle);
    const archivePot = useMutation(api.pots.archive);
    const recordPayout = useMutation(api.transactions.recordPayout);
    const transactions = useQuery(api.transactions.list, { potId: potId as Id<"pots"> });

    const requestJoin = useMutation(api.pots.requestJoin);
    const approveJoin = useMutation(api.pots.approveJoin);
    const rejectJoin = useMutation(api.pots.rejectJoin);

    const [showAddMember, setShowAddMember] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showWinnerSelection, setShowWinnerSelection] = useState(false);
    const [selectedWinnerId, setSelectedWinnerId] = useState<Id<"members"> | null>(null);
    const [requestLoading, setRequestLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false); // New state for editing
    const [showNextRoundModal, setShowNextRoundModal] = useState(false); // Occasional Cycle
    const [showPayoutModal, setShowPayoutModal] = useState<Id<"users"> | null>(null);

    if (!pot) return <div className="p-8 text-center animate-pulse">Loading Pot Details...</div>;

    const isDraft = pot.status === "DRAFT";
    const isActive = pot.status === "ACTIVE";
    const isForeman = currentUser?._id === pot.foremanId;

    const myMembership = pot.members.find(m => m.userId === currentUser?._id);
    const isMember = myMembership?.status === "ACTIVE" || (!myMembership?.status && myMembership);
    const isRequested = myMembership?.status === "REQUESTED";

    // Pot Calculations
    const commissionPct = pot.config.commission || 0;
    const commissionAmount = (pot.config.totalValue * commissionPct) / 100;
    const winningAmount = pot.config.totalValue - commissionAmount;

    const gracePeriod = pot.config.gracePeriodDays || 0;

    // Date Calculations
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

    const nextDueDateObj = getNextDate(pot.startDate, pot.currentMonth, pot.config.frequency);
    const nextDrawDateObj = getNextDate(pot.startDate, pot.currentMonth, pot.config.frequency, gracePeriod, pot.nextDrawDate);

    const nextDueDate = nextDueDateObj.dateStr;
    const nextDrawDate = nextDrawDateObj.dateStr;


    const activeMembers = pot.members.filter(m => m.status === "ACTIVE" || !m.status);
    const pendingRequests = pot.members.filter(m => m.status === "REQUESTED");

    const freqMap: Record<string, string> = {
        monthly: "Month",
        weekly: "Week",
        biweekly: "Fortnight",
        quarterly: "Quarter",
        occasional: "Round"
    };

    const handleShare = async () => {
        const shareData = {
            title: `Join my Chit Fund: ${pot.title}`,
            text: `I'm inviting you to join my pot on GrowPot. Pool Value: ₹${pot.config.totalValue.toLocaleString()}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert("Invite link copied to clipboard!");
        }
    };

    // --- INVITE / PUBLIC VIEW ---
    if (!isMember && !isForeman) {
        const handleJoin = async () => {
            if (confirm("Send a request to join this pot?")) {
                setRequestLoading(true);
                try {
                    await requestJoin({ potId: pot._id });
                } catch (err) {
                    alert("Failed to send request.");
                }
                setRequestLoading(false);
            }
        };

        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="bg-[#232931]/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-[#C1FF72]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C1FF72]/20">
                            <ShieldCheck size={40} className="text-[#C1FF72]" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-white mb-2">{pot.title}</h1>
                        <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider">
                            {pot.config.frequency} Pot
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-black/20 p-4 rounded-2xl text-center">
                            <p className="text-gray-400 text-xs uppercase mb-1">Pool Value</p>
                            <p className="text-2xl font-mono font-bold text-white">₹{pot.config.totalValue.toLocaleString()}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl text-center">
                            <p className="text-gray-400 text-xs uppercase mb-1">You Pay / {freqMap[pot.config.frequency] || pot.config.frequency}</p>
                            <p className="text-2xl font-mono font-bold text-[#C1FF72]">₹{pot.config.contribution.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 bg-white/5 p-4 rounded-xl">
                            <User className="text-gray-400 shrink-0 mt-1" size={20} />
                            <div>
                                <h3 className="font-bold text-white">Managed by {(pot as any).foreman?.name || "Foreman"}</h3>
                                <p className="text-sm text-gray-400">Verified Manager • {(pot as any).foreman?.phone}</p>
                            </div>
                        </div>

                        {pot.description && (
                            <div className="flex items-start gap-4 bg-white/5 p-4 rounded-xl">
                                <Info className="text-gray-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <h3 className="font-bold text-white mb-1">About this Pot</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{pot.description}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-4 bg-white/5 p-4 rounded-xl">
                            <Coins className="text-gray-400 shrink-0 mt-1" size={20} />
                            <div>
                                <h3 className="font-bold text-white mb-1">Winner Receives</h3>
                                <p className="text-lg font-mono text-[#E07A5F]">₹{winningAmount.toLocaleString()}</p>
                                {commissionPct > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        (After {commissionPct}% foreman commission)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {isRequested ? (
                        <div className="w-full bg-yellow-500/20 border border-yellow-500/20 text-yellow-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                            <Clock size={20} /> Request Pending Approval
                        </div>
                    ) : (
                        <button
                            onClick={handleJoin}
                            disabled={requestLoading}
                            className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-4 rounded-xl hover:opacity-90 transition-all text-lg shadow-[0_0_20px_rgba(193,255,114,0.3)] hover:shadow-[0_0_30px_rgba(193,255,114,0.5)]"
                        >
                            {requestLoading ? "Sending..." : "Request to Join Pot"}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // --- MEMBER / FOREMAN VIEW ---

    const currentWinner = activeMembers.find(m => m.drawOrder === pot.currentMonth);

    const handleActivate = async () => {
        if (confirm("Are you sure? Financial rules will be locked.")) {
            await activatePot({ potId: pot._id });
        }
    };

    const handleDraw = async () => {
        if (confirm("Run the draw for this month?")) {
            setIsDrawing(true);
            try {
                setTimeout(async () => {
                    await runDraw({ potId: pot._id });
                    setIsDrawing(false);
                }, 2000);
            } catch (err) {
                console.error(err);
                setIsDrawing(false);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <header className="mb-8 border-b border-white/5 pb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-display font-bold">{pot.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase ${isDraft ? "bg-yellow-500/20 text-yellow-300" : "bg-[#C1FF72]/20 text-[#C1FF72]"
                                }`}>
                                {pot.status}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-mono uppercase bg-white/10 text-gray-400">
                                {pot.config.frequency}
                            </span>
                        </div>
                        <p className="text-gray-400 max-w-xl">{pot.description || "Managed by Foreman"}</p>
                    </div>

                    {isForeman && (
                        <div className="flex items-center gap-2">
                            {isDraft && (
                                <>
                                    <button
                                        onClick={handleActivate}
                                        className="bg-[#C1FF72] text-[#1B3022] font-bold px-4 py-2 rounded-full hover:opacity-90 flex items-center gap-2 text-sm"
                                    >
                                        <Play size={16} fill="currentColor" /> Start
                                    </button>
                                    <button
                                        onClick={() => navigate(`/create?edit=${pot._id}`)}
                                        className="bg-white/10 text-white font-bold px-4 py-2 rounded-full hover:bg-white/20 flex items-center gap-2 transition-all text-sm"
                                    >
                                        <Info size={16} /> Edit
                                    </button>
                                </>
                            )}

                            <button
                                onClick={handleShare}
                                className="bg-white/10 text-white font-bold px-4 py-2 rounded-full hover:bg-white/20 flex items-center gap-2 transition-all text-sm"
                                title="Share Invite Link"
                            >
                                <Share2 size={16} /> Invite
                            </button>

                            {isActive && (
                                <>
                                    {isForeman && pot.config.frequency === 'occasional' && currentWinner && (
                                        <button
                                            onClick={() => setShowNextRoundModal(true)}
                                            className="bg-[#C1FF72] text-[#1B3022] font-bold px-4 py-2 rounded-full hover:opacity-90 flex items-center gap-2 text-sm"
                                        >
                                            <Calendar size={16} /> Start Next Round
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setShowWinnerSelection(true)}
                                        disabled={isDrawing}
                                        className="bg-[#232931] text-white border border-white/10 font-bold px-4 py-2 rounded-full hover:bg-white/10 flex items-center gap-2 disabled:opacity-50 transition-all text-sm"
                                    >
                                        <Gavel size={16} /> {currentWinner ? "Edit Winner" : (pot.drawStrategy === "MANUAL" ? "Select Winner" : "Override")}
                                    </button>

                                    {!currentWinner && pot.drawStrategy !== "MANUAL" && (
                                        <button
                                            onClick={handleDraw}
                                            disabled={isDrawing}
                                            className="bg-[#E07A5F] text-white font-bold px-4 py-2 rounded-full hover:opacity-90 flex items-center gap-2 disabled:opacity-50 transition-all text-sm"
                                        >
                                            <Gavel size={16} /> {isDrawing ? "Rolling..." : "Run Draw"}
                                        </button>
                                    )}
                                </>
                            )}

                            {pot.status === "COMPLETED" && isForeman && (
                                <button
                                    onClick={async () => {
                                        if (confirm("Archive this pot? Ensure all payouts are done.")) {
                                            await archivePot({ potId: pot._id });
                                        }
                                    }}
                                    className="bg-gray-700 text-white font-bold px-4 py-2 rounded-full hover:bg-gray-600 flex items-center gap-2 text-sm"
                                >
                                    <Archive size={16} /> Archive Pot
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Edit Pot Modal (Active Only - Restricted) */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1f26] border border-white/10 rounded-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-display font-bold mb-4">Edit Pot Details</h3>
                            <p className="text-xs text-gray-500 mb-4">You can only edit description and bank details because the pot is active.</p>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                await updatePot({
                                    potId: pot._id,
                                    title: formData.get('title') as string,
                                    description: formData.get('description') as string,
                                    bankDetails: formData.get('bankDetails') as string,
                                });
                                setShowEditModal(false);
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Title</label>
                                    <input name="title" defaultValue={pot.title} className="w-full bg-black/20 p-2 rounded text-white border border-white/10" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                                    <textarea name="description" defaultValue={pot.description || ""} className="w-full bg-black/20 p-2 rounded text-white border border-white/10" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Bank Details</label>
                                    <textarea name="bankDetails" defaultValue={pot.bankDetails || ""} className="w-full bg-black/20 p-2 rounded text-white border border-white/10" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-800 py-2 rounded font-bold">Cancel</button>
                                    <button type="submit" className="flex-1 bg-[#C1FF72] text-[#1B3022] py-2 rounded font-bold">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Next Round Trigger Modal (Occasional only) */}
                {showNextRoundModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1f26] border border-white/10 rounded-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-display font-bold mb-4">Start Next Round</h3>
                            {/* ... existing modal content ... */}
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const dateStr = formData.get('nextDrawDate') as string;
                                if (!dateStr) return;

                                try {
                                    await advanceCycle({
                                        potId: pot._id,
                                        nextDrawDate: new Date(dateStr).getTime()
                                    });
                                    setShowNextRoundModal(false);
                                } catch (e) {
                                    console.error(e);
                                    alert("Failed to advance cycle");
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Next Draw Date</label>
                                    <input
                                        type="date"
                                        name="nextDrawDate"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-black/20 p-3 rounded-lg text-white border border-white/10 focus:border-[#C1FF72] outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowNextRoundModal(false)} className="flex-1 bg-gray-800 py-2 rounded font-bold">Cancel</button>
                                    <button type="submit" className="flex-1 bg-[#C1FF72] text-[#1B3022] py-2 rounded font-bold">Start Round {pot.currentMonth + 1}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Payout Modal */}
                {showPayoutModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1f26] border border-white/10 rounded-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-display font-bold mb-4">Record Payout</h3>
                            <p className="text-sm text-gray-400 mb-6">
                                Confirm that you have transferred the winning amount to this member.
                            </p>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                await recordPayout({
                                    potId: pot._id,
                                    userId: showPayoutModal,
                                    monthIndex: pot.currentMonth,
                                    amount: winningAmount,
                                    notes: formData.get('notes') as string
                                });
                                setShowPayoutModal(null);
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
                                    <input name="notes" placeholder="Transaction ID, Cheque No, etc." className="w-full bg-black/20 p-2 rounded text-white border border-white/10" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowPayoutModal(null)} className="flex-1 bg-gray-800 py-2 rounded font-bold">Cancel</button>
                                    <button type="submit" className="flex-1 bg-[#C1FF72] text-[#1B3022] py-2 rounded font-bold">Confirm Paid</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Winner Selection Modal */}
                {showWinnerSelection && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1f26] border border-white/10 rounded-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-display font-bold mb-4">
                                {currentWinner ? "Override Winner" : "Select Winner manually"}
                            </h3>
                            <p className="text-sm text-gray-400 mb-6">
                                {currentWinner
                                    ? `Current winner is ${currentWinner.user?.name}. Select a member to swap the win.`
                                    : "Choose a member to win this cycle. This action cannot be undone."}
                            </p>

                            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
                                {activeMembers.filter(m => !m.drawOrder || m.drawOrder === pot.currentMonth).map(member => (
                                    <button
                                        key={member._id}
                                        onClick={() => setSelectedWinnerId(member._id)}
                                        className={`w-full p-3 rounded-xl flex items-center gap-3 border transition-all ${selectedWinnerId === member._id
                                            ? "bg-[#C1FF72]/20 border-[#C1FF72] text-white"
                                            : "bg-[#232931] border-white/5 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                            {member.user?.pictureUrl ? <img src={member.user.pictureUrl} className="w-8 h-8 rounded-full" /> : <User size={14} />}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">{member.user?.name}</div>
                                            {member.sequence && <div className="text-xs text-gray-500">Seq: #{member.sequence}</div>}
                                            {member.drawOrder === pot.currentMonth && <span className="text-xs text-[#E07A5F] font-bold"> (Current Winner)</span>}
                                        </div>
                                        {selectedWinnerId === member._id && <CheckCircle size={16} className="ml-auto text-[#C1FF72]" />}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowWinnerSelection(false)}
                                    className="flex-1 bg-gray-800 py-3 rounded-xl font-bold hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!selectedWinnerId || isDrawing}
                                    onClick={async () => {
                                        if (!selectedWinnerId) return;
                                        if (confirm("Confirm winner selection?")) {
                                            setIsDrawing(true);
                                            try {
                                                if (currentWinner && currentWinner._id !== selectedWinnerId) {
                                                    await overrideWinner({ potId: pot._id, newWinnerId: selectedWinnerId });
                                                } else if (!currentWinner) {
                                                    await runDraw({ potId: pot._id, customWinnerId: selectedWinnerId });
                                                }
                                                setShowWinnerSelection(false);
                                            } catch (e) {
                                                alert("Error selecting winner");
                                                console.error(e);
                                            }
                                            setIsDrawing(false);
                                        }
                                    }}
                                    className="flex-1 bg-[#C1FF72] text-[#1B3022] py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDrawing ? "Processing..." : "Confirm Winner"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pot Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase mb-1">Total Pool</div>
                        <div className="text-xl font-mono">₹{pot.config.totalValue.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase mb-1">Winner Gets</div>
                        <div className="text-xl font-mono text-[#E07A5F]">₹{winningAmount.toLocaleString()}</div>
                        {commissionPct > 0 && <span className="text-[10px] text-gray-500">(-{commissionPct}% comm)</span>}
                    </div>
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase mb-1">Next Payment</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1">
                            <Clock size={12} className="text-[#C1FF72]" /> {nextDueDate}
                        </div>
                    </div>
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-gray-500 uppercase mb-1">Next Draw</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1">
                            <Calendar size={12} className="text-[#E07A5F]" /> {nextDrawDate}
                        </div>
                    </div>
                </div>
            </header>

            {/* Bank Details (Active Members Only) */}
            {isActive && pot.bankDetails && (
                <div className="mb-8 bg-[#232931]/30 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                    <Landmark className="text-gray-400 mt-1" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Payment Details</h4>
                        <p className="text-sm font-mono text-gray-400 whitespace-pre-wrap">{pot.bankDetails}</p>
                    </div>
                </div>
            )}

            {/* Visualizer */}
            <section className="mb-12">
                <PotVisualizer
                    pot={pot}
                    members={activeMembers}
                    currentMonthIndex={pot.currentMonth}
                    winnerId={currentWinner?.userId}
                />
                {currentWinner && (
                    <div className="text-center mt-4 animate-bounce">
                        <p className="text-gray-400 text-sm">Winner of Cycle {pot.currentMonth}</p>
                        <p className="text-2xl font-display font-bold text-[#FFD700]">{currentWinner.user?.name}</p>
                    </div>
                )}
            </section>

            {/* Payment Section (For Members) */}
            {isActive && currentUser && (
                <section className="mb-12 max-w-md mx-auto">
                    {(() => {
                        const myTx = transactions?.find(t =>
                            t.userId === currentUser._id &&
                            t.monthIndex === pot.currentMonth
                        );
                        let status: "UNPAID" | "PENDING" | "PAID" = "UNPAID";
                        if (myTx) status = myTx.status as "PENDING" | "PAID";

                        return (
                            <PaymentStatusCard
                                status={status}
                                amount={pot.config.contribution}
                                monthIndex={pot.currentMonth}
                                onPay={() => setShowUploadModal(true)}
                            />
                        );
                    })()}
                </section>
            )}

            {/* Foreman Approval Section */}
            {isActive && isForeman && transactions && (
                <section className="mb-12">
                    <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-[#C1FF72]" /> Pending Approvals
                    </h3>
                    <div className="bg-[#232931]/50 border border-white/5 rounded-xl overflow-hidden">
                        {transactions.filter(t => t.status === "PENDING").length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">No pending payments to approve.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {transactions.filter(t => t.status === "PENDING").map(tx => (
                                    <div key={tx._id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {tx.user?.pictureUrl ? (
                                                <img src={tx.user.pictureUrl} alt="" className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                                    <User size={14} className="text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-sm">{tx.user?.name}</div>
                                                <div className="text-xs text-gray-500">Month {tx.monthIndex + 1}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {tx.proofUrl && (
                                                <a href={tx.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-[#C1FF72] hover:underline">
                                                    View Proof
                                                </a>
                                            )}
                                            <ApproveButton transactionId={tx._id} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Join Requests (Foreman Only) */}
            {isForeman && pendingRequests.length > 0 && (
                <section className="mb-12">
                    <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <Users className="text-yellow-400" /> Join Requests
                    </h3>
                    <div className="bg-[#232931]/50 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                        {pendingRequests.map((req) => (
                            <div key={req._id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {req.user?.pictureUrl ? (
                                        <img src={req.user.pictureUrl} alt="" className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                            <User size={18} className="text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold">{req.user?.name}</div>
                                        <div className="text-xs text-gray-500">{req.user?.phone || "No phone"}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => approveJoin({ memberId: req._id })}
                                        className="bg-[#C1FF72] text-[#1B3022] text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => rejectJoin({ memberId: req._id })}
                                        className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/30"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Members Section */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                        <Users className="text-[#C1FF72]" /> Members <span className="text-gray-500 text-lg">({activeMembers.length})</span>
                    </h2>
                    {isDraft && (
                        <button
                            onClick={() => setShowAddMember(true)}
                            className="text-sm bg-[#232931] border border-white/10 px-4 py-2 rounded-lg hover:border-white/30 transition-all"
                        >
                            + Add Member
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeMembers.map((member) => {
                        const memberTx = transactions?.find(t =>
                            t.userId === member.userId &&
                            t.monthIndex === pot.currentMonth
                        );

                        const isPaid = memberTx?.status === "PAID";
                        const isPending = memberTx?.status === "PENDING";
                        const showMarkPaid = isActive && isForeman && !isPaid && !isPending;

                        // Check if this member is a winner of ANY cycle and if they have been paid
                        const isWinner = member.drawOrder;
                        const payoutTx = isWinner ? transactions?.find(t =>
                            t.userId === member.userId &&
                            t.type === 'payout' &&
                            t.monthIndex === member.drawOrder
                        ) : null;

                        return (
                            <div key={member._id} className={`bg-[#232931] p-4 rounded-xl flex items-center gap-4 border ${member.drawOrder ? "border-[#FFD700]/50" : "border-white/5"} relative group`}>
                                {member.user?.pictureUrl ? (
                                    <img src={member.user.pictureUrl} alt={member.user.name} className="w-10 h-10 rounded-full" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                        <User size={20} className="text-gray-400" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="font-bold flex items-center gap-2 truncate">
                                        {member.user?.name}
                                        {member.isGhost && <span className="text-[10px] bg-gray-700 px-1.5 rounded text-gray-300">GHOST</span>}
                                        {pot.foremanId === member.userId && <ShieldCheck size={14} className="text-[#C1FF72]" />}
                                        {pot.drawStrategy === "FIXED" && member.sequence && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 rounded border border-blue-500/30">#{member.sequence}</span>}
                                        {member.drawOrder && <span className="text-xs text-[#FFD700] border border-[#FFD700] px-1 rounded">WINNER (Cycle {member.drawOrder})</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                        {member.user?.phone}
                                        {isPaid && <span className="text-[#C1FF72] flex items-center gap-1"><CheckCircle size={10} /> Paid</span>}
                                        {isPending && <span className="text-yellow-400 flex items-center gap-1"><Clock size={10} /> Pending</span>}
                                        {payoutTx && <span className="text-[#C1FF72] flex items-center gap-1 font-bold ml-2 border border-[#C1FF72]/20 px-1 rounded bg-[#C1FF72]/10"><CheckCircle size={10} /> Payout Done</span>}
                                    </div>
                                </div>

                                {showMarkPaid && (
                                    <MarkPaidButton potId={pot._id} userId={member.userId} monthIndex={pot.currentMonth} />
                                )}

                                {isActive && isForeman && isWinner && !payoutTx && (
                                    <button
                                        onClick={() => setShowPayoutModal(member.userId)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded hover:opacity-90 shadow-lg hidden group-hover:block"
                                    >
                                        Record Payout
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {showUploadModal && (
                <PaymentModal
                    potId={pot._id}
                    monthIndex={pot.currentMonth}
                    onClose={() => setShowUploadModal(false)}
                />
            )}

            {showAddMember && (
                <AddMemberModal
                    potId={pot._id}
                    onClose={() => setShowAddMember(false)}
                />
            )}
        </div>
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

function MarkPaidButton({ potId, userId, monthIndex }: { potId: Id<"pots">, userId: Id<"users">, monthIndex: number }) {
    const recordCashPayment = useMutation(api.transactions.recordCashPayment);
    const [loading, setLoading] = useState(false);

    const handleMarkPaid = async () => {
        if (confirm("Mark this member as PAID for the current month?")) {
            setLoading(true);
            await recordCashPayment({ potId, userId, monthIndex });
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleMarkPaid}
            disabled={loading}
            className="bg-[#232931] border border-white/10 hover:bg-[#C1FF72] hover:text-[#1B3022] text-[10px] font-bold px-2 py-1 rounded transition-colors whitespace-nowrap"
        >
            {loading ? "..." : "Mark Paid"}
        </button>
    );
}
