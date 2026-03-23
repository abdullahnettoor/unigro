import { useMemo, useState } from "react";
import * as Icons from "@/lib/icons";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { MediaPreviewDialog } from "@/components/shared/MediaPreviewDialog";
import { formatCurrency, cn } from "@/lib/utils";
import type { PoolDetail, PoolTransaction } from "./types";

interface OrganizerTabProps {
  pool: PoolDetail;
  pendingTransactions: PoolTransaction[];
  onApprove: (txId: string, paidAt?: number) => void;
  onReject: (txId: string, notes?: string) => void;
  onOpenCashPayment: () => void;
  onOpenWinnerSelection: () => void;
  onOpenNextRound: () => void;
  onOpenPayout: () => void;
  onActivatePool: () => void;
  onArchivePool: () => void;
  onUnarchivePool: () => void;
  onDeletePool: () => void;
}

export function OrganizerTab({
  pool,
  pendingTransactions,
  onApprove,
  onReject,
  onOpenCashPayment,
  onOpenWinnerSelection,
  onOpenNextRound,
  onOpenPayout,
  onActivatePool,
  onArchivePool,
  onUnarchivePool,
  onDeletePool,
}: OrganizerTabProps) {
  const [reviewTxId, setReviewTxId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [reviewDate, setReviewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const isArchived = pool.status === "ARCHIVED";
  const isDraft = pool.status === "DRAFT";

  const reviewTx = useMemo(
    () => pendingTransactions.find((tx) => tx._id === reviewTxId) || null,
    [pendingTransactions, reviewTxId]
  );

  const handleReviewApprove = async () => {
    if (!reviewTx) return;
    setIsProcessing(true);
    try {
      await onApprove(reviewTx._id, new Date(reviewDate).getTime());
      setReviewTxId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewReject = async () => {
    if (!reviewTx) return;
    setIsProcessing(true);
    try {
      await onReject(reviewTx._id, rejectNote.trim() || undefined);
      setReviewTxId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 pb-20">
      <SectionHeader eyebrow="Admin" title="Organizer Board" />

      {/* Organizer Controls Header Card */}
      <Surface tier={3} className="grain rounded-[32px] p-6 border border-[var(--accent-vivid)]/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Icons.OrganizerIcon size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)] flex items-center justify-center border border-[var(--accent-vivid)]/20 shadow-inner">
              <Icons.NavAdminIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">Control Center</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Active Management</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--surface-deep)]/40 p-3 border border-white/5">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Pool Status</p>
              <p className="text-sm font-bold text-[var(--accent-vivid)] capitalize">{pool.status.toLowerCase()}</p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-deep)]/40 p-3 border border-white/5">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Round Pool</p>
              <p className="text-sm font-bold text-[var(--text-primary)] font-mono">{formatCurrency(pool.config.totalValue, pool.config.currency)}</p>
            </div>
          </div>

          <div className="mt-5">
            {isDraft ? (
              <Button onClick={onActivatePool} size="lg" className="w-full rounded-2xl bg-[var(--accent-vivid)] font-bold shadow-lg shadow-[var(--accent-vivid)]/20">
                ACTIVATE POOL
              </Button>
            ) : isArchived ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-[10px] font-bold uppercase tracking-widest leading-none w-fit">
                  <Icons.HistoryIcon size={12} /> Archived Pool Status
                </div>
                <div className="p-3 rounded-2xl bg-[var(--warning)]/[0.05] border border-[var(--warning)]/10 flex gap-3 items-start backdrop-blur-sm shadow-sm ring-1 ring-[var(--warning)]/5">
                  <div className="h-7 w-7 shrink-0 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center border border-[var(--warning)]/20 shadow-inner mt-0.5">
                    <Icons.InfoIcon size={12} />
                  </div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)] leading-relaxed">
                    This pool is archived. <span className="text-[var(--text-primary)] font-bold">Round Management</span> and <span className="text-[var(--text-primary)] font-bold">Payments</span> are currently locked. Scroll to the bottom to unarchive.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent-vivid)]/5 border border-[var(--accent-vivid)]/10 text-[var(--accent-vivid)] text-[10px] font-bold uppercase tracking-widest">
                <Icons.ActivePoolIcon size={12} /> Live & Running
              </div>
            )}
          </div>
        </div>
      </Surface>

      {isDraft ? (
        <Surface tier={2} className="rounded-[32px] p-6 border border-[var(--border-subtle)] flex flex-col">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-[var(--surface-3)]/70 text-[var(--text-muted)] flex items-center justify-center border border-[var(--border-subtle)]/40">
              <Icons.InfoIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Activation required</h3>
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                Payments, approvals, draw and payout controls unlock after activation.
              </p>
            </div>
          </div>
        </Surface>
      ) : (
        <>
          {/* Pending Approvals Section */}
          <Surface tier={2} className="rounded-[32px] p-6 border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Icons.ClockIcon size={16} className="text-[var(--warning)]" /> Pending Approvals
              </h3>
              {pendingTransactions.length > 0 && (
                <span className="h-5 px-2 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] text-[10px] font-black border border-[var(--warning)]/20">
                  {pendingTransactions.length}
                </span>
              )}
            </div>

            {pendingTransactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl">
                <div className="h-12 w-12 rounded-full bg-[var(--surface-3)]/60 flex items-center justify-center text-[var(--text-muted)] mb-3">
                  <Icons.CheckIcon size={24} />
                </div>
                <p className="text-xs font-bold text-[var(--text-muted)]">Clear for now! No pending requests.</p>
              </div>
            ) : (
              <div className={cn("space-y-3", isArchived && "opacity-60 pointer-events-none")}>
                {pendingTransactions.map((tx) => (
                  <div key={tx._id} className="group relative flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 p-4 transition-all duration-300 hover:border-[var(--accent-vivid)]/30">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-[var(--surface-deep)]/60 flex items-center justify-center text-sm font-bold text-[var(--text-primary)] shadow-inner">
                        #{tx.seat?.seatNumber ?? "•"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[var(--text-primary)]">Round {tx.roundIndex}</p>
                          <span className={cn(
                            "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-[0.1em] border",
                            tx.type === "cash"
                              ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20"
                              : "bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)] border-[var(--accent-vivid)]/20"
                          )}>
                            {tx.type || "online"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium">{tx.user?.name || "Member"}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-xl h-9 px-4 font-bold text-xs"
                      disabled={isArchived}
                      onClick={() => {
                        setReviewTxId(tx._id);
                        setRejectNote("");
                        setReviewDate(new Date().toISOString().split("T")[0]);
                      }}
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Surface>

          {/* Tool Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Surface tier={2} className="rounded-[32px] p-6 border border-[var(--border-subtle)] flex flex-col">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)] flex items-center justify-center border border-[var(--accent-vivid)]/20 mb-4">
                <Icons.DrawIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Round management</h3>
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed flex-grow">
                Run the lottery draw to pick a winner and advance the pool through its cycles.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" onClick={onOpenWinnerSelection} disabled={isArchived} className="rounded-xl h-10 font-bold text-xs gap-2">
                  <Icons.DrawIcon size={14} /> Run draw
                </Button>
                <Button size="sm" variant="secondary" onClick={onOpenNextRound} disabled={isArchived} className="rounded-xl h-10 font-bold text-xs gap-2">
                  <Icons.RoundIcon size={14} /> Next
                </Button>
              </div>
            </Surface>

            <Surface tier={2} className="rounded-[32px] p-6 border border-[var(--border-subtle)] flex flex-col">
              <div className="h-10 w-10 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center border border-[var(--warning)]/20 mb-4">
                <Icons.ContributionIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Payments & payouts</h3>
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed flex-grow">
                Manually record cash contributions or mark when the winner pool has been paid out.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" onClick={onOpenCashPayment} disabled={isArchived} className="rounded-xl h-10 font-bold text-xs gap-2">
                  <Icons.BankIcon size={14} /> Record cash
                </Button>
                <Button size="sm" variant="secondary" onClick={onOpenPayout} disabled={isArchived} className="rounded-xl h-10 font-bold text-xs gap-2">
                  <Icons.WinnerIcon size={14} /> Payout
                </Button>
              </div>
            </Surface>
          </div>
        </>
      )}

      {/* Danger Zone */}
      <Surface tier={1} className="rounded-[32px] p-6 border border-[var(--danger)]/20 bg-[var(--danger)]/[0.02]">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center border border-[var(--danger)]/20">
            <Icons.DeleteIcon size={16} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--danger)]">Danger Zone</h3>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-5">
          {pool.status === "DRAFT"
            ? "Permanently delete this pool draft. All data and seats will be wiped."
            : "Archive this pool to remove it from active view while preserving history, or delete it permanently."
          }
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {pool.status === "ARCHIVED" ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onUnarchivePool}
              className="rounded-xl h-10 font-bold text-xs gap-2 bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white transition-colors"
            >
              <Icons.ActivePoolIcon size={14} /> Unarchive
            </Button>
          ) : !isDraft && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onArchivePool}
              className="rounded-xl h-10 font-bold text-xs gap-2 border-[var(--danger)]/20 hover:bg-[var(--danger)]/5 transition-colors"
            >
              <Icons.HistoryIcon size={14} /> Archive
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={onDeletePool}
            className={cn(
              "rounded-xl h-10 font-bold text-xs gap-2 bg-transparent border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white",
              isDraft && "col-span-2"
            )}
          >
            <Icons.DeleteIcon size={14} /> Delete
          </Button>
        </div>
      </Surface>

      {/* Review Dialog */}
      <Dialog open={!!reviewTx} onOpenChange={(open) => !open && setReviewTxId(null)}>
        <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[32px] max-w-[420px] p-0 overflow-hidden outline-none">
          {reviewTx && (
            <>
              <DialogHeader className="p-6 pb-2">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Pending Review</p>
                  <DialogTitle className="font-display text-xl font-bold">
                    Round {reviewTx.roundIndex} • {reviewTx.user?.name || "Member"}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="px-6 pb-6 space-y-6">
                <Surface tier={2} className="grain p-4 rounded-2xl border border-[var(--border-subtle)]/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Amount Review</p>
                    <p className="text-lg font-black text-[var(--text-primary)] font-mono">{formatCurrency(pool.config.contribution, pool.config.currency)}</p>
                  </div>
                  <div className={cn(
                    "h-9 px-4 rounded-full flex items-center gap-2 font-black text-[9px] uppercase tracking-widest border",
                    reviewTx.type === "cash"
                      ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20"
                      : "bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)] border-[var(--accent-vivid)]/20"
                  )}>
                    {reviewTx.type === "cash" ? <Icons.ContributionIcon size={14} /> : <Icons.TransactionIcon size={14} />}
                    <span className="capitalize">{reviewTx.type || "online"}</span>
                  </div>
                </Surface>

                {reviewTx.proofUrl && (
                  <Button
                    variant="secondary"
                    onClick={() => setPreviewUrl(reviewTx.proofUrl || null)}
                    className="w-full h-12 rounded-2xl gap-2 font-bold text-xs"
                  >
                    <Icons.UploadImageIcon size={16} /> View Payment Proof
                  </Button>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1 flex items-center justify-between">
                      Verification Date
                      <span className="text-[9px] font-normal opacity-70 normal-case italic">When was this received?</span>
                    </label>
                    <DatePicker value={reviewDate} onChange={setReviewDate} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3">Rejection Note (Optional)</label>
                    <input
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="e.g. Incomplete amount, wrong reference..."
                      className="w-full h-12 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 px-6 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 outline-none focus:ring-4 focus:ring-[var(--accent-vivid)]/10 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={handleReviewReject}
                    disabled={isProcessing}
                    className="h-12 rounded-full font-bold text-[var(--danger)] hover:bg-[var(--danger)]/10"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={handleReviewApprove}
                    disabled={isProcessing}
                    className="h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-white shadow-lg shadow-[var(--accent-vivid)]/20"
                  >
                    {isProcessing ? <Icons.LoadingIcon className="animate-spin" size={16} /> : "Approve"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <MediaPreviewDialog
        url={previewUrl}
        onClose={() => setPreviewUrl(null)}
        alt="Payment proof"
      />
    </section>
  );
}
