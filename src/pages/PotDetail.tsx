import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { AddMemberModal } from "../components/AddMemberModal";
import { PotVisualizer } from "../components/PotVisualizer";
import { PaymentStatusCard, PaymentModal } from "../components/PaymentComponents";
import { Users, ShieldCheck, Play, User, Gavel, CheckCircle, Clock } from "lucide-react";

export function PotDetail() {
    const { potId } = useParams<{ potId: string }>();
    const pot = useQuery(api.pots.get, { potId: potId as Id<"pots"> });
    const currentUser = useQuery(api.users.current);
    const activatePot = useMutation(api.pots.activate);
    const runDraw = useMutation(api.pots.runDraw);
    const transactions = useQuery(api.transactions.list, { potId: potId as Id<"pots"> });

    // Move these hooks UP, before any conditional return
    const requestJoin = useMutation(api.pots.requestJoin);
    const approveJoin = useMutation(api.pots.approveJoin);
    const rejectJoin = useMutation(api.pots.rejectJoin);

    const [showAddMember, setShowAddMember] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    if (!pot) return <div className="p-8 text-center animate-pulse">Loading Pot Details...</div>;

    const isDraft = pot.status === "DRAFT";
    const isActive = pot.status === "ACTIVE";
    const isForeman = currentUser?._id === pot.foremanId;

    // Member Check: only count ACTIVE members
    const myMembership = pot.members.find(m => m.userId === currentUser?._id);
    const isMember = myMembership?.status === "ACTIVE" || (!myMembership?.status && myMembership); // Handle legacy
    const isRequested = myMembership?.status === "REQUESTED";


    // Filter Active Members for Display
    const activeMembers = pot.members.filter(m => m.status === "ACTIVE" || !m.status);
    const pendingRequests = pot.members.filter(m => m.status === "REQUESTED");

    // SECURITY CHECK: Access Denied / Request to Join
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
            <div className="max-w-md mx-auto py-20 px-4 text-center">
                <div className="bg-[#232931]/50 border border-white/10 p-8 rounded-2xl">
                    <ShieldCheck className="text-[#C1FF72] w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{pot.title}</h2>
                    <p className="text-gray-400 mb-6">
                        This is a private pot. You need to be a member to view details.
                    </p>

                    {isRequested ? (
                        <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg font-bold">
                            Request Pending Approval
                        </div>
                    ) : (
                        <button
                            onClick={handleJoin}
                            disabled={requestLoading}
                            className="bg-[#C1FF72] text-[#1B3022] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity w-full"
                        >
                            {requestLoading ? "Sending..." : "Request to Join"}
                        </button>
                    )}

                    <a href="/dashboard" className="text-gray-500 text-sm mt-4 block hover:underline">
                        Return to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Check if we have a winner for the current month
    const currentWinner = activeMembers.find(m => m.drawOrder === pot.currentMonth);

    // ... (rest of the component)

    // Foreman Approval Section (New Requests)
    // Place this before Members Section


    const handleActivate = async () => {
        if (confirm("Are you sure? Financial rules will be locked.")) {
            await activatePot({ potId: pot._id });
        }
    };

    const handleDraw = async () => {
        if (confirm("Run the draw for this month? This cannot be undone.")) {
            setIsDrawing(true);
            try {
                // Mock delay for suspense
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
                            <span className={`px-3 py-1 rounded-full text-xs font-mono ${isDraft ? "bg-yellow-500/20 text-yellow-300" : "bg-[#C1FF72]/20 text-[#C1FF72]"
                                }`}>
                                {pot.status}
                            </span>
                        </div>
                        <p className="text-gray-400">Managed by Foreman</p>
                    </div>

                    {isDraft && isForeman && (
                        <button
                            onClick={handleActivate}
                            className="bg-[#C1FF72] text-[#1B3022] font-bold px-6 py-2 rounded-full hover:opacity-90 flex items-center gap-2"
                        >
                            <Play size={18} fill="currentColor" /> Start Pot
                        </button>
                    )}

                    {isActive && isForeman && !currentWinner && (
                        <button
                            onClick={handleDraw}
                            disabled={isDrawing}
                            className="bg-[#E07A5F] text-white font-bold px-6 py-2 rounded-full hover:opacity-90 flex items-center gap-2 disabled:opacity-50 transition-all"
                        >
                            <Gavel size={18} /> {isDrawing ? "Rolling..." : "Run Draw"}
                        </button>
                    )}
                </div>

                {/* Pot Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-sm text-gray-500 mb-1">Total Pool</div>
                        <div className="text-2xl font-mono">₹{pot.config.totalValue.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-sm text-gray-500 mb-1">Contribution</div>
                        <div className="text-2xl font-mono text-[#E07A5F]">₹{pot.config.contribution.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#232931]/50 p-4 rounded-xl border border-white/5">
                        <div className="text-sm text-gray-500 mb-1">Timeline</div>
                        <div className="text-2xl font-mono">{pot.config.duration} <span className="text-sm text-gray-500">Months</span></div>
                    </div>
                </div>
            </header>

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
                        <p className="text-gray-400 text-sm">Winner of Month {pot.currentMonth}</p>
                        <p className="text-2xl font-display font-bold text-[#FFD700]">{currentWinner.user?.name}</p>
                    </div>
                )}
            </section>

            {/* Payment Section (For Members) */}
            {isActive && currentUser && (
                <section className="mb-12 max-w-md mx-auto">
                    {(() => {
                        // Find my transaction for this month
                        const myTx = transactions?.find(t =>
                            t.userId === currentUser._id &&
                            t.monthIndex === pot.currentMonth
                        );

                        // Determine status
                        let status: "UNPAID" | "PENDING" | "PAID" = "UNPAID";
                        if (myTx) status = myTx.status as "PENDING" | "PAID"; // Force cast if needed or matched

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
                        // Check payment status for this member
                        const memberTx = transactions?.find(t =>
                            t.userId === member.userId &&
                            t.monthIndex === pot.currentMonth
                        );

                        const isPaid = memberTx?.status === "PAID";
                        const isPending = memberTx?.status === "PENDING";
                        const showMarkPaid = isActive && isForeman && !isPaid && !isPending;

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
                                        {member.drawOrder && <span className="text-xs text-[#FFD700] border border-[#FFD700] px-1 rounded">WINNER (Mo. {member.drawOrder})</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                        {member.user?.phone}
                                        {isPaid && <span className="text-[#C1FF72] flex items-center gap-1"><CheckCircle size={10} /> Paid</span>}
                                        {isPending && <span className="text-yellow-400 flex items-center gap-1"><Clock size={10} /> Pending</span>}
                                    </div>
                                </div>

                                {showMarkPaid && (
                                    <MarkPaidButton potId={pot._id} userId={member.userId} monthIndex={pot.currentMonth} />
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
