import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Check, X, CreditCard, Loader2 } from "lucide-react";
import { useFeedback } from "../components/FeedbackProvider";

export function AdminDashboard() {
    const pendingRequests = useQuery(api.verification.getPending);
    const reviewVerification = useMutation(api.verification.review);
    const feedback = useFeedback();

    // Track loading state for each request
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionNote, setRejectionNote] = useState("");

    const handleReview = async (userId: any, status: "VERIFIED" | "REJECTED") => {
        if (status === "REJECTED" && rejectingId !== userId) {
            setRejectingId(userId);
            setRejectionNote("");
            return;
        }

        setActionLoading(userId);
        try {
            await reviewVerification({
                userId,
                status,
                notes: status === "REJECTED" ? rejectionNote : undefined
            });
            feedback.toast.success("Status updated");
            setRejectingId(null);
        } catch (err) {
            console.error(err);
            feedback.toast.error("Update failed", "Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    if (pendingRequests === undefined) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 flex justify-center">
                <Loader2 className="animate-spin text-[#C1FF72]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <header className="mb-8">
                <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
                <p className="text-gray-400">Review identity verification requests.</p>
            </header>

            {pendingRequests.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl bg-[#232931]/30">
                    <p className="text-gray-500">No pending verification requests.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {pendingRequests.map((req) => (
                        <div key={req._id} className="bg-[#232931] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                            {/* Document Preview */}
                            <div className="w-full md:w-1/3 bg-black/40 rounded-xl h-64 flex items-center justify-center overflow-hidden border border-white/5">
                                {req.docUrl ? (
                                    <img
                                        src={req.docUrl}
                                        alt="ID Document"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-gray-500 flex flex-col items-center">
                                        <CreditCard size={40} className="mb-2 opacity-50" />
                                        <span>No Document</span>
                                    </div>
                                )}
                            </div>

                            {/* User Details & Actions */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{req.name}</h3>
                                    <p className="text-gray-400 font-mono text-sm mb-4">{req.phone}</p>

                                    <div className="bg-black/20 p-4 rounded-lg space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                                            <p className="text-white">{req.email || "N/A"}</p>
                                        </div>
                                        {(req as any).idNumber && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase mb-1">
                                                    {(req as any).idType || "ID"} Number
                                                </p>
                                                <p className="text-white font-mono tracking-wider">{(req as any).idNumber}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    {rejectingId === req._id ? (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <textarea
                                                value={rejectionNote}
                                                onChange={(e) => setRejectionNote(e.target.value)}
                                                placeholder="Reason for rejection..."
                                                className="w-full bg-black/20 border border-red-500/30 rounded-lg p-3 text-sm focus:border-red-500 outline-none text-white h-24 resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setRejectingId(null)}
                                                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-bold text-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReview(req._id, "REJECTED")}
                                                    disabled={!rejectionNote.trim() || actionLoading === req._id}
                                                    className="flex-1 bg-red-500 text-white hover:bg-red-600 py-2 rounded-lg font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading === req._id && <Loader2 className="animate-spin" size={14} />}
                                                    Confirm Reject
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleReview(req._id, "REJECTED")}
                                                disabled={actionLoading === req._id}
                                                className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-xl font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <X size={18} /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleReview(req._id, "VERIFIED")}
                                                disabled={actionLoading === req._id}
                                                className="flex-1 bg-[#C1FF72] text-[#1B3022] py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {actionLoading === req._id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                                Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
