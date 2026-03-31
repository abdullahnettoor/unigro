import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
    ShieldCheck,
    Smartphone,
    Loader2,
    Eye,
    CheckCircle2,
    AlertCircle,
    Clock,
    FileText,
    Mail,
    CreditCard
} from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { OfflineFallback } from "@/components/shared/OfflineFallback";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { MediaPreviewDialog } from "@/components/shared/MediaPreviewDialog";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { Textarea } from "@/components/ui/textarea";
import { LogoLoader } from "@/components/ui/LogoLoader";
import * as Icons from "@/lib/icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

import { api } from "../../convex/_generated/api";

export function AdminDashboard() {
    const feedback = useFeedback();
    const pendingRequests = useQuery(api.verification.getPending);
    const verificationSummary = useQuery(api.verification.getSummary);
    const reviewVerification = useMutation(api.verification.review);
    const { isOnline } = useNetworkStatus();

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
            feedback.toast.success(
                status === "VERIFIED" ? "User Verified" : "Request Rejected",
                status === "VERIFIED" ? "The user now has a verification badge." : "The user has been notified."
            );
            setRejectingId(null);
            setRejectionNote("");
        } catch (err) {
            console.error(err);
            feedback.toast.error("Operation Failed", "Could not update verification status.");
        } finally {
            setActionLoading(null);
        }
    };

    if ((pendingRequests === undefined || verificationSummary === undefined) && !isOnline) {
        return (
            <OfflineFallback
                title="Admin dashboard unavailable offline"
                message="Verification review needs fresh admin data and cannot open from a cold offline start."
            />
        );
    }

    if (pendingRequests === undefined || verificationSummary === undefined) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LogoLoader size="lg" />
            </div>
        );
    }

    return (
        <PageShell maxWidth="xl" className="pb-24">
            {/* Header / Hero Section */}
            <header className="glass-3 relative mb-8 overflow-hidden rounded-[32px] p-8 lg:p-12 border border-white/20 shadow-2xl shadow-black/5">
                <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[var(--accent-vivid)]/10 blur-3xl" />
                <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-[var(--gold)]/5 blur-3xl" />

                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-lg shadow-[var(--accent-vivid)]/20 text-xl font-bold">
                            T
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Terminal Access</p>
                    </div>

                    <h1 className="font-display text-[var(--type-4xl)] font-bold text-[var(--text-primary)] leading-tight">
                        Admin <br />
                        Dashboard
                    </h1>
                    <p className="mt-4 text-sm text-[var(--text-muted)] font-medium max-w-md">
                        Review identity verification requests and manage core member security.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <div className="glass-2 flex items-center gap-3 rounded-[24px] border border-white/20 px-5 py-3 pr-8 shadow-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)] font-bold mb-0.5">
                                {pendingRequests.length}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Pending</p>
                                <p className="text-sm font-bold text-[var(--text-primary)]">Reviews</p>
                            </div>
                        </div>

                        <div className="glass-2 flex items-center gap-3 rounded-[24px] border border-white/20 px-5 py-3 pr-8 shadow-sm opacity-60">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Security</p>
                                <p className="text-sm font-bold text-[var(--text-primary)]">Enforced</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="space-y-10">
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "Pending", value: verificationSummary.pending, icon: Clock, accent: "text-[var(--warning)] bg-[var(--warning)]/10" },
                        { label: "Verified", value: verificationSummary.verified, icon: ShieldCheck, accent: "text-[var(--success)] bg-[var(--success)]/10" },
                        { label: "Flagged", value: verificationSummary.flagged, icon: AlertCircle, accent: "text-[var(--danger)] bg-[var(--danger)]/10" },
                        { label: "Unverified", value: verificationSummary.unverified, icon: FileText, accent: "text-[var(--text-muted)] bg-[var(--surface-2)]" },
                    ].map((item) => (
                        <Surface key={item.label} tier={1} className="rounded-[24px] border border-[var(--border-subtle)]/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">{item.label}</p>
                                    <p className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)]">{item.value}</p>
                                </div>
                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.accent}`}>
                                    <item.icon size={18} />
                                </div>
                            </div>
                        </Surface>
                    ))}
                </section>

                {/* Pending Requests Section */}
                <section>
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">
                            Pending Verifications {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                        </h2>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="glass-2 flex flex-col items-center justify-center gap-4 rounded-[40px] border-2 border-dashed border-[var(--border-subtle)]/50 p-12 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--surface-0)]/50 text-[var(--success)] shadow-inner">
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-[var(--text-primary)]">All Caught Up!</p>
                                <p className="text-sm text-[var(--text-muted)]">No pending verification requests to review.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {pendingRequests.map((req) => (
                                <Surface key={req._id} tier={2} className="group relative overflow-hidden rounded-[32px] border border-[var(--border-subtle)]/60 transition-all hover:shadow-xl hover:shadow-black/5 hover:border-[var(--accent-vivid)]/20">
                                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-subtle)]/30">

                                        {/* Doc Preview Column */}
                                        <div className="lg:w-[320px] shrink-0 p-6 bg-[var(--surface-0)]/30 group-hover:bg-[var(--surface-0)]/50 transition-colors">
                                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-black/5 shadow-inner">
                                                {req.docUrl ? (
                                                    <button
                                                        onClick={() => setPreviewUrl(req.docUrl)}
                                                        className="group/img relative h-full w-full"
                                                    >
                                                        <img
                                                            src={req.docUrl}
                                                            alt="ID Document"
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/img:opacity-100">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Eye className="text-white" size={24} />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Full Screen</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ) : (
                                                    <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
                                                        <CreditCard size={40} className="opacity-20" />
                                                        <p className="text-xs font-bold uppercase tracking-widest">No Document</p>
                                                    </div>
                                                )}

                                                {/* ID Type Badge */}
                                                {(req as any).idType && (
                                                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur shadow-sm border border-black/5">
                                                        <p className="text-[9px] font-bold text-black uppercase tracking-wider">{(req as any).idType}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* User Details Column */}
                                        <div className="flex-1 p-8 flex flex-col justify-between min-w-0">
                                            <div>
                                                <div className="flex items-start justify-between gap-4 mb-6">
                                                    <div className="min-w-0">
                                                        <h3 className="text-[20px] font-bold text-[var(--text-primary)] truncate tracking-tight">{req.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1 text-[var(--text-muted)]">
                                                            <Smartphone size={12} className="shrink-0" />
                                                            <p className="font-mono text-xs truncate">{req.phone}</p>
                                                        </div>
                                                    </div>
                                                    <div className="hidden sm:block shrink-0 px-3 py-1 rounded-full bg-[var(--surface-2)]/50 text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider h-fit">
                                                        Pending
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="glass-2 border border-[var(--border-subtle)]/40 rounded-[20px] p-4 flex items-center gap-4">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-vivid)]/5 text-[var(--accent-vivid)]">
                                                            <Mail size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email Address</p>
                                                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{req.email || "N/A"}</p>
                                                        </div>
                                                    </div>

                                                    {(req as any).idNumber && (
                                                        <div className="glass-2 border border-[var(--border-subtle)]/40 rounded-[20px] p-4 flex items-center gap-4">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/5 text-[var(--gold)]">
                                                                <FileText size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{(req as any).idType || "ID"} Number</p>
                                                                <p className="text-xs font-mono font-bold text-[var(--text-primary)] truncate tracking-[0.1em]">{(req as any).idNumber}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]/30">
                                                {rejectingId === req._id ? (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="relative">
                                                            <Textarea
                                                                value={rejectionNote}
                                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionNote(e.target.value)}
                                                                placeholder="Please provide a clear reason for rejecting this verification..."
                                                                className="glass-1 border-[var(--danger)]/30 min-h-[100px] rounded-[20px] p-4 text-xs font-medium resize-none focus:ring-[var(--danger)]/10"
                                                            />
                                                            <AlertCircle className="absolute top-4 right-4 text-[var(--danger)]/40" size={16} />
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Button
                                                                variant="outline"
                                                                size="lg"
                                                                className="flex-1 rounded-full border-[var(--border-subtle)] text-[var(--text-primary)]"
                                                                onClick={() => { setRejectingId(null); setRejectionNote(""); }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="lg"
                                                                className="flex-1 rounded-full shadow-lg shadow-[var(--danger)]/10"
                                                                onClick={() => handleReview(req._id, "REJECTED")}
                                                                disabled={!rejectionNote.trim() || actionLoading === req._id}
                                                            >
                                                                {actionLoading === req._id ? (
                                                                    <Loader2 className="animate-spin" size={16} />
                                                                ) : (
                                                                    "Confirm Rejection"
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-4 sm:flex-row">
                                                        <Button
                                                            variant="outline"
                                                            size="lg"
                                                            className="flex-1 rounded-full border-[var(--danger)]/20 text-[var(--danger)] hover:bg-[var(--danger)]/5"
                                                            onClick={() => handleReview(req._id, "REJECTED")}
                                                            disabled={actionLoading !== null}
                                                        >
                                                            <Icons.CloseIcon className="mr-2" size={16} />
                                                            Reject Request
                                                        </Button>
                                                        <Button
                                                            size="lg"
                                                            className="flex-1 rounded-full shadow-lg shadow-[var(--accent-vivid)]/20"
                                                            onClick={() => handleReview(req._id, "VERIFIED")}
                                                            disabled={actionLoading !== null}
                                                        >
                                                            {actionLoading === req._id ? (
                                                                <Loader2 className="animate-spin" size={20} />
                                                            ) : (
                                                                <>
                                                                    <Icons.CheckIcon className="mr-2" size={20} />
                                                                    Approve Identity
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Surface>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <MediaPreviewDialog
                url={previewUrl}
                onClose={() => setPreviewUrl(null)}
                alt="ID Document Verification"
            />
        </PageShell>
    );
}
