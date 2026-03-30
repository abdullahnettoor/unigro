import { useMemo, useState } from "react";
import * as Icons from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { formatCurrency, cn } from "@/lib/utils";
import type { PoolDetail, PoolSeat, PoolTransaction } from "./types";

interface HistoryTabProps {
  pool: PoolDetail;
  seats: PoolSeat[];
  transactions: PoolTransaction[];
  mySeats: PoolSeat[];
  currentUserId?: string;
  onPay: (seatId: string, roundIndex: number, amount: number) => void;
}

type FilterType = "all" | "paid" | "pending" | "unpaid" | "payout";

export function HistoryTab({ pool, seats, transactions, mySeats, currentUserId, onPay }: HistoryTabProps) {
  const isActivePool = pool.status === "ACTIVE";
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedRounds, setExpandedRounds] = useState<Record<number, boolean>>(() => {
    return { [pool.currentRound]: true };
  });

  const rounds = useMemo(() => Array.from({ length: pool.config.duration }, (_, i) => i + 1), [pool.config.duration]);

  const roundCards = useMemo(() => {
    return rounds.map((roundIndex) => {
      const roundTxs = transactions.filter((tx) => tx.roundIndex === roundIndex);
      const paidCount = roundTxs.filter((tx) => tx.status === "PAID" && tx.type !== "payout").length;

      const totalEligibleShares = seats.reduce((acc, seat) => {
        if (seat.status !== "FILLED" && seat.status !== "RESERVED") return acc;
        return acc + 1;
      }, 0);

      const winnerSeat = seats.find((seat) => seat.roundWon === roundIndex);

      const myStatuses = mySeats.map((seat) => {
        const tx = transactions.find(
          (t) =>
            t.seatId === seat._id &&
            t.roundIndex === roundIndex &&
            (t.userId === currentUserId || !t.userId)
        );

        const sharePct = seat.isCoSeat
          ? seat.coOwners?.find((owner) => owner.userId === currentUserId)?.sharePercentage ?? 0
          : 100;

        const amount = (pool.config.contribution * sharePct) / 100;
        const status = (tx?.status as "PAID" | "PENDING" | "UNPAID") || "UNPAID";

        return { seat, status, amount };
      });

      const isPayoutReleased = transactions.some(
        (tx) => tx.roundIndex === roundIndex && tx.type === "payout" && tx.status === "PAID"
      );

      return {
        roundIndex,
        winnerSeat,
        paidCount,
        activeSeatCount: totalEligibleShares,
        myStatuses,
        isPayoutReleased,
      };
    });
  }, [rounds, transactions, seats, mySeats, pool.config.contribution, currentUserId]);

  const filteredCards = roundCards.filter((card) => {
    if (filter === "all") return true;
    if (filter === "paid") return card.myStatuses.some((s) => s.status === "PAID");
    if (filter === "pending") return card.myStatuses.some((s) => s.status === "PENDING");
    if (filter === "unpaid") return card.myStatuses.some((s) => s.status === "UNPAID");
    if (filter === "payout") return card.isPayoutReleased;
    return true;
  });

  const toggleRound = (index: number) => {
    setExpandedRounds(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-1">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Timeline</p>
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Round History</h2>
        </div>

        <div className="grid grid-cols-4 sm:flex w-full sm:w-fit p-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl shadow-sm overflow-hidden min-h-[44px]">
          {[
            { id: "all", label: "All" },
            { id: "paid", label: "Paid" },
            { id: "unpaid", label: "Due" },
            { id: "payout", label: "Payouts" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id as any)}
                className={cn(
                "flex items-center justify-center sm:px-6 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-300",
                filter === opt.id
                  ? "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] shadow-md shadow-[var(--accent-vivid)]/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredCards.length === 0 ? (
          <Surface tier={1} className="grain flex flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed border-[var(--border-subtle)] p-12 text-center bg-[var(--surface-1)]/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-muted)] opacity-50">
              <Icons.HistoryIcon size={28} />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">No records found for this filter.</p>
          </Surface>
        ) : (
          filteredCards.map((card) => {
            const isFuture = card.roundIndex > pool.currentRound;
            const isCurrent = card.roundIndex === pool.currentRound;
            const isExpanded = expandedRounds[card.roundIndex];
            const progress = (card.paidCount / Math.max(card.activeSeatCount, 1)) * 100;

            return (
              <Surface
                key={card.roundIndex}
                tier={2}
                className={cn(
                  "grain group relative flex flex-col rounded-[28px] border transition-all duration-300 overflow-hidden",
                  isFuture ? "opacity-60 border-[var(--border-subtle)]/50 bg-[var(--surface-2)]/40" :
                    isCurrent ? "border-[var(--accent-vivid)] bg-[var(--surface-2)]" :
                      "border-[var(--border-subtle)] bg-[var(--surface-2)]"
                )}
              >
                {/* Clickable Header */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-3)]/40 transition-colors"
                  onClick={() => toggleRound(card.roundIndex)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex flex-col items-center justify-center font-display border transition-colors",
                      isCurrent ? "bg-[var(--accent-vivid)] text-[var(--text-on-accent)] border-transparent" :
                        "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                    )}>
                      <span className="text-[14px] font-black leading-none">#{card.roundIndex}</span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {isFuture ? `Round ${card.roundIndex}` : isCurrent ? "Active Round" : `Round ${card.roundIndex} Summary`}
                      </h3>
                      {isCurrent ? (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-vivid)] mt-0.5">
                          {isActivePool ? "Live Collection" : "Awaiting activation"}
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
                          {isFuture ? "Awaiting start" : card.isPayoutReleased ? "Payout Released" : "Completed"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {card.winnerSeat && (
                      <div className="flex items-center gap-1.5 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-0.5 text-[9px] font-black uppercase text-[var(--warning)] h-6">
                        <Icons.WinnerIcon size={12} />
                        <span>Seat #{card.winnerSeat.seatNumber}</span>
                      </div>
                    )}
                    <Icons.ExpandIcon
                      size={16}
                      className={cn(
                        "text-[var(--text-muted)] transition-transform duration-300",
                        isExpanded ? "rotate-180" : ""
                      )}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="pt-2 space-y-5">
                      {!isFuture && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tight text-[var(--text-muted)] px-1">
                            <span className="flex items-center gap-1.5">
                              <Icons.TransactionIcon size={10} className="text-[var(--accent-vivid)]" />
                              Round Progress
                            </span>
                            <span>{card.paidCount} / {card.activeSeatCount} Paid</span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--surface-deep)]/40 rounded-full border border-[var(--border-subtle)]/30 overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent-vivid)] transition-all duration-700 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {card.myStatuses.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">My Contribution</p>
                          <div className="grid gap-2">
                            {card.myStatuses.map((item) => {
                              const isUnpaid = item.status === "UNPAID";
                              const tx = transactions.find(
                                (t) =>
                                  t.seatId === item.seat._id &&
                                  t.roundIndex === card.roundIndex &&
                                  (t.userId === currentUserId || !t.userId)
                              );
                              const methodLabel =
                                tx?.type === "upi"
                                  ? "UPI initiated"
                                  : tx?.type === "cash"
                                    ? "Cash request"
                                    : tx?.type === "online"
                                      ? "Online proof"
                                      : null;
                              const needsProofUpload = tx?.type === "upi" && !tx?.proofUrl;
                              return (
                                <div
                                  key={`${item.seat._id}-${card.roundIndex}`}
                                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-3)]/40 border border-[var(--border-subtle)]/30 shadow-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-[var(--surface-deep)]/60 flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border-subtle)]/40">
                                      #{item.seat.seatNumber}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-[var(--text-primary)]">
                                        {formatCurrency(item.amount, pool.config.currency)}
                                      </p>
                                      {methodLabel ? (
                                        <p className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">
                                          {methodLabel}
                                        </p>
                                      ) : isActivePool && isUnpaid && isCurrent ? (
                                        <p className="text-[9px] text-[var(--danger)] font-medium flex items-center gap-1 mt-0.5">
                                          <Icons.InfoIcon size={8} /> Due now
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <PaymentStatusBadge status={item.status} />
                                    {needsProofUpload && (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 px-3 rounded-full text-[10px] font-bold"
                                        onClick={() => onPay(item.seat._id as string, card.roundIndex, item.amount)}
                                      >
                                        Upload Proof
                                      </Button>
                                    )}
                                    {isActivePool && isUnpaid && !isFuture && (
                                      <Button
                                        size="sm"
                                        className="h-8 px-3 rounded-full bg-[var(--accent-vivid)] text-[10px] font-bold text-[var(--text-on-accent)] shadow-lg shadow-[var(--accent-vivid)]/20"
                                        onClick={() => onPay(item.seat._id as string, card.roundIndex, item.amount)}
                                      >
                                        Pay
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Surface>
            );
          })
        )}
      </div>
    </section>
  );
}
