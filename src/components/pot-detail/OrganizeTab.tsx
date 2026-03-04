import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { Banknote, Check, Clock, ShieldCheck, Smartphone, Trash2, X } from "lucide-react";

import { MediaPreviewDialog } from "@/components/shared/MediaPreviewDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Surface } from "@/components/ui/Surface";
import { formatCurrency } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

interface OrganizeTabProps {
    pot: Doc<"pots">;
    isDraft: boolean;
    isActive: boolean;
    isForeman: boolean;
    currentWinnerSlot: any;
    isDrawing: boolean;
    transactions: any[];
    allSlots: any[];
    commissionPct: number;
    handleActivate: () => void;
    handleDraw: () => void;
    setShowWinnerSelection: (show: boolean) => void;
    setGlobalPaymentState: (state: any) => void;
    onDeletePot: () => void;
}

export function OrganizeTab({
    pot,
    isDraft,
    isActive,
    isForeman,
    currentWinnerSlot,
    isDrawing,
    transactions,
    allSlots,
    handleActivate,
    handleDraw,
    setShowWinnerSelection,
    onDeletePot,
}: OrganizeTabProps) {
    const pendingTransactions = transactions?.filter(t => t.status === "PENDING") || [];
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [reviewTxId, setReviewTxId] = useState<string | null>(null);
    const [rejectNote, setRejectNote] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewDate, setReviewDate] = useState(new Date().toISOString().split("T")[0]);
    const approvePayment = useMutation(api.transactions.approvePayment);
    const rejectPayment = useMutation(api.transactions.rejectPayment);
    const recordCashPayment = useMutation(api.transactions.recordCashPayment);

    const reviewTx = useMemo(
        () => pendingTransactions.find((tx) => tx._id === reviewTxId) || null,
        [pendingTransactions, reviewTxId]
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Quick Management Card */}
            <Surface tier={3} className="rounded-3xl p-6 border border-[var(--accent-vivid)]/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                    <ShieldCheck size={100} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-[var(--accent-vivid)]" size={24} /> Organizer Controls
                    </h3>

                    <div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-muted)]">
                        <span className="rounded-full bg-[var(--surface-deep)]/70 px-3 py-1">
                            Status: <span className="text-[var(--accent-vivid)]">{pot.status}</span>
                        </span>
                        <span className="rounded-full bg-[var(--surface-deep)]/70 px-3 py-1">
                            Round pool: <span className="text-[var(--text-primary)]">{formatCurrency(pot.config.totalValue, pot.config.currency)}</span>
                        </span>
                    </div>

                    <div className="space-y-3">
                        {isDraft && (
                            <Button onClick={handleActivate} size="lg" className="w-full">
                                ACTIVATE POT
                            </Button>
                        )}

                        {isActive && !currentWinnerSlot && (
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowWinnerSelection(true)}
                                    variant="secondary"
                                    fullWidth
                                >
                                    Manual Winner
                                </Button>
                                <Button
                                    onClick={handleDraw}
                                    disabled={isDrawing}
                                    variant="accent"
                                    fullWidth
                                >
                                    RUN DRAW
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Surface>

            {/* Pending Approvals Section */}
            <Surface tier={2} className="rounded-3xl p-6">
                <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-6 text-[var(--warning)]">
                    <Clock size={20} /> Pending Approvals
                </h3>
                {pendingTransactions.length === 0 ? (
                    <Surface tier={1} className="text-center py-12 text-[var(--text-muted)] rounded-2xl border border-dashed border-[var(--border-subtle)]">
                        No pending approvals for now.
                    </Surface>
                ) : (
                    <div className="space-y-4">
                        {pendingTransactions.map(tx => {
                            const slot = allSlots.find(s => s._id === tx.slotId);
                            return (
                                <Surface key={tx._id} tier={1} className="p-4 rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-[var(--surface-deep)] rounded-full flex items-center justify-center font-bold">
                                            {slot?.slotNumber || tx.monthIndex}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Round {tx.monthIndex} Payment</p>
                                            <p className="text-xs text-[var(--text-muted)]">{tx.user?.name || 'Member'}</p>
                                            <div className="mt-1 flex items-center">
                                                <Badge variant="default" size="sm" className="gap-1.5 flex items-center">
                                                    {tx.proofUrl ? <Smartphone size={11} /> : <Banknote size={11} />}
                                                    {tx.proofUrl ? "Online" : "Cash"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                        <Button
                                            onClick={() => {
                                                setReviewTxId(tx._id);
                                                setRejectNote("");
                                                setReviewDate(new Date().toISOString().split("T")[0]);
                                            }}
                                            className="text-xs w-full sm:w-auto"
                                        >
                                            Review
                                        </Button>
                                    </div>
                                </Surface>
                            );
                        })}
                    </div>
                )}
            </Surface>

            {/* Danger Zone — foreman only */}
            {isForeman && (
                <Surface tier={1} className="rounded-3xl p-6 border border-red-500/20">
                    <h4 className="text-xs uppercase font-black tracking-widest text-red-400 mb-3 flex items-center gap-2">
                        <Trash2 size={14} /> Danger Zone
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                        {isDraft
                            ? "Permanently delete this pot and all its slots. This cannot be undone."
                            : "Archive or permanently delete this pot. Archived pots preserve history."
                        }
                    </p>
                    <Button
                        variant="danger"
                        onClick={onDeletePot}
                        className="w-full text-sm font-bold bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                    >
                        <Trash2 size={14} />
                        {isDraft ? "Delete pot" : "Archive / Delete pot"}
                    </Button>
                </Surface>
            )}

            <MediaPreviewDialog
                url={previewUrl}
                onClose={() => setPreviewUrl(null)}
                alt="Payment proof"
            />

            <Dialog
                open={!!reviewTx}
                onOpenChange={(open) => {
                    if (!open) {
                        setReviewTxId(null);
                        setRejectNote("");
                    }
                }}
            >
                <DialogContent
                    className="max-w-lg p-6"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {reviewTx ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Payment review</p>
                                <DialogTitle className="text-lg font-semibold text-[var(--text-primary)]">
                                    Round {reviewTx.monthIndex} • {reviewTx.user?.name || "Member"}
                                </DialogTitle>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {formatCurrency(pot.config.contribution, pot.config.currency)} •{" "}
                                    {reviewTx.proofUrl ? "Online transfer" : "Cash"}
                                </p>
                            </div>

                            {reviewTx.proofUrl ? (
                                <Button
                                    variant="secondary"
                                    onClick={() => setPreviewUrl(reviewTx.proofUrl)}
                                    className="w-full"
                                >
                                    View proof
                                </Button>
                            ) : null}

                            {!reviewTx.proofUrl ? (
                                <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-3 text-xs text-[var(--text-muted)]">
                                    Cash payment reported by member.
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[var(--text-muted)] flex items-baseline gap-1.5 flex-wrap">
                                    Payment date
                                    <span className="font-normal text-[10px] opacity-70">
                                        (Record the date this payment was {reviewTx.proofUrl ? "received/verified" : "received"})
                                    </span>
                                </label>
                                <DatePicker value={reviewDate} onChange={setReviewDate} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[var(--text-muted)]">Rejection note (optional)</label>
                                <input
                                    value={rejectNote}
                                    onChange={(e) => setRejectNote(e.target.value)}
                                    placeholder="Reason for rejection..."
                                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-deep)]/40 p-3 text-sm text-[var(--text-primary)]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                <Button
                                    variant="danger"
                                    onClick={async () => {
                                        if (!reviewTx) return;
                                        setIsReviewing(true);
                                        try {
                                            await rejectPayment({ transactionId: reviewTx._id, notes: rejectNote.trim() || undefined });
                                            setReviewTxId(null);
                                            setRejectNote("");
                                        } finally {
                                            setIsReviewing(false);
                                        }
                                    }}
                                    disabled={isReviewing}
                                    className="bg-transparent text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)]/10"
                                >
                                    <X size={16} /> Reject
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!reviewTx) return;
                                        setIsReviewing(true);
                                        try {
                                            if (reviewTx.proofUrl) {
                                                await approvePayment({ transactionId: reviewTx._id });
                                            } else {
                                                await recordCashPayment({
                                                    potId: pot._id,
                                                    slotId: reviewTx.slotId,
                                                    monthIndex: reviewTx.monthIndex,
                                                    userId: reviewTx.userId,
                                                    paidAt: new Date(reviewDate).getTime(),
                                                });
                                            }
                                            setReviewTxId(null);
                                        } finally {
                                            setIsReviewing(false);
                                        }
                                    }}
                                    disabled={isReviewing}
                                    className="gap-2"
                                >
                                    <Check size={16} /> {reviewTx.type === "online" ? "Approve" : "Record received"}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}

