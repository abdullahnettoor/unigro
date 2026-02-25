import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Check, X, CreditCard, Loader2 } from "lucide-react";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { useUser } from "@clerk/clerk-react";
import { DashboardSidebar } from "@/pages/Dashboard";

export function AdminDashboard() {
    const { user } = useUser();
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
                <Loader2 className="animate-spin text-[var(--accent-vivid)]" />
            </div>
        );
    }

    const clerkUser = user;
    const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "there";

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-5 md:py-3 lg:gap-6">
            <DashboardSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} />
            <div className="md:py-4">
                <header className="mb-8">
                    <h1 className="text-3xl font-display font-bold">Admin dashboard</h1>
                    <p className="text-[var(--text-muted)]">Review identity verification requests.</p>
                </header>

                {pendingRequests.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--surface-elevated)]/30">
                        <p className="text-[var(--text-muted)]">No pending verification requests.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {pendingRequests.map((req) => (
                            <div key={req._id} className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                                {/* Document Preview */}
                                <div className="w-full md:w-1/3 bg-[var(--surface-deep)]/70 rounded-xl h-64 flex items-center justify-center overflow-hidden border border-[var(--border-subtle)]">
                                    {req.docUrl ? (
                                        <img
                                            src={req.docUrl}
                                            alt="ID Document"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-[var(--text-muted)] flex flex-col items-center">
                                            <CreditCard size={40} className="mb-2 opacity-50" />
                                            <span>No document</span>
                                        </div>
                                    )}
                                </div>

                                {/* User Details & Actions */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">{req.name}</h3>
                                        <p className="text-[var(--text-muted)] font-mono text-sm mb-4">{req.phone}</p>

                                        <div className="bg-[var(--surface-deep)]/60 p-4 rounded-lg space-y-3">
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Email</p>
                                                <p className="text-[var(--text-primary)]">{req.email || "N/A"}</p>
                                            </div>
                                            {(req as any).idNumber && (
                                                <div>
                                                    <p className="text-xs text-[var(--text-muted)] uppercase mb-1">
                                                        {(req as any).idType || "ID"} Number
                                                    </p>
                                                    <p className="text-[var(--text-primary)] font-mono tracking-wider">{(req as any).idNumber}</p>
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
                                                    className="w-full bg-[var(--surface-deep)]/60 border border-[var(--danger)]/30 rounded-lg p-3 text-sm focus:border-[var(--danger)] outline-none text-[var(--text-primary)] h-24 resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setRejectingId(null)}
                                                        className="flex-1 bg-[var(--surface-deep)] hover:bg-[var(--surface-deep)]/80 py-2 rounded-lg font-bold text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(req._id, "REJECTED")}
                                                        disabled={!rejectionNote.trim() || actionLoading === req._id}
                                                        className="flex-1  bg-[var(--danger)] text-[var(--text-on-accent)] hover:bg-[var(--danger)]/90 py-2 rounded-lg font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {actionLoading === req._id && <Loader2 className="animate-spin" size={14} />}
                                                        Confirm reject
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => handleReview(req._id, "REJECTED")}
                                                    disabled={actionLoading === req._id}
                                                    className="flex-1 bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 py-3 rounded-xl font-bold hover:bg-[var(--danger)]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <X size={18} /> Reject
                                                </button>
                                                <button
                                                    onClick={() => handleReview(req._id, "VERIFIED")}
                                                    disabled={actionLoading === req._id}
                                                    className="flex-1 bg-[var(--accent-vivid)] text-[var(--text-on-accent)] py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
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
        </div>
    );
}
