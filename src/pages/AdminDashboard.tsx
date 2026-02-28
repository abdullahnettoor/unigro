import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { Check, CreditCard, Loader2, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PageShell } from "@/components/layout/PageShell";
import { MediaPreviewDialog } from "@/components/shared/MediaPreviewDialog";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { Textarea } from "@/components/ui/Textarea";

import { api } from "../../convex/_generated/api";

export function AdminDashboard() {
    const { user } = useUser();
    const pendingRequests = useQuery(api.verification.getPending);
    const reviewVerification = useMutation(api.verification.review);
    const feedback = useFeedback();

    // Track loading state for each request
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionNote, setRejectionNote] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    const clerkUser = user;
    const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "there";

    if (pendingRequests === undefined) {
        return (
            <PageShell
                maxWidth="xl"
                sidebar={<AppSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} showAdmin />}
                title="Admin dashboard"
                subtitle="Review identity verification requests."
            >
                <div className="max-w-5xl w-full py-8 flex justify-center">
                    <Loader2 className="animate-spin text-[var(--accent-vivid)]" />
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell
            maxWidth="xl"
            sidebar={<AppSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} showAdmin />}
            title="Admin dashboard"
            subtitle="Review identity verification requests."
        >
            <div className="max-w-5xl w-full">
                {pendingRequests.length === 0 ? (
                    <Surface tier={1} className="text-center py-20 border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--surface-elevated)]/30">
                        <p className="text-[var(--text-muted)]">No pending verification requests.</p>
                    </Surface>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {pendingRequests.map((req) => (
                            <Surface key={req._id} tier={2} className="rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                                {/* Document Preview */}
                                <Surface
                                    tier={1}
                                    className="w-full md:w-1/3 rounded-xl h-64 flex items-center justify-center overflow-hidden border border-[var(--border-subtle)]"
                                >
                                    {req.docUrl ? (
                                        <button
                                            type="button"
                                            className="group relative h-full w-full"
                                            onClick={() => setPreviewUrl(req.docUrl)}
                                            aria-label="View document"
                                        >
                                            <img
                                                src={req.docUrl}
                                                alt="ID Document"
                                                className="h-full w-full object-contain"
                                            />
                                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                View full size
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="text-[var(--text-muted)] flex flex-col items-center">
                                            <CreditCard size={40} className="mb-2 opacity-50" />
                                            <span>No document</span>
                                        </div>
                                    )}
                                </Surface>

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
                                                <Textarea
                                                    value={rejectionNote}
                                                    onChange={(e) => setRejectionNote(e.target.value)}
                                                    placeholder="Reason for rejection..."
                                                    className="bg-[var(--surface-deep)]/60 border border-[var(--danger)]/30 h-24 resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        fullWidth
                                                        onClick={() => setRejectingId(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        fullWidth
                                                        onClick={() => handleReview(req._id, "REJECTED")}
                                                        disabled={!rejectionNote.trim() || actionLoading === req._id}
                                                        className="gap-2"
                                                    >
                                                        {actionLoading === req._id && <Loader2 className="animate-spin" size={14} />}
                                                        Confirm reject
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    fullWidth
                                                    onClick={() => handleReview(req._id, "REJECTED")}
                                                    disabled={actionLoading === req._id}
                                                    className="gap-2"
                                                >
                                                    <X size={18} /> Reject
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    fullWidth
                                                    onClick={() => handleReview(req._id, "VERIFIED")}
                                                    disabled={actionLoading === req._id}
                                                    className="gap-2"
                                                >
                                                    {actionLoading === req._id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                                    Approve
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Surface>
                        ))}
                    </div>
                )}
            </div>

            <MediaPreviewDialog
                url={previewUrl}
                onClose={() => setPreviewUrl(null)}
                alt="ID Document Preview"
            />
        </PageShell>
    );
}
