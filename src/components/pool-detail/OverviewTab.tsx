import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { formatCurrency } from "@/lib/utils";
import type { PoolDetail, PoolSeat, PoolTransaction } from "./types";
import { SeatCard } from "./SeatCard";

interface OverviewTabProps {
  pool: PoolDetail;
  mySeats: PoolSeat[];
  transactions: PoolTransaction[];
  currentUserId?: string;
  nextDueDate: string;
  onPay: (seatId: string, roundIndex: number, amount: number) => void;
  onViewHistory: () => void;
}

export function OverviewTab({
  pool,
  mySeats,
  transactions,
  currentUserId,
  nextDueDate,
  onPay,
  onViewHistory,
}: OverviewTabProps) {
  const winningAmount = pool.config.totalValue - (pool.config.totalValue * (pool.config.commission || 0)) / 100;

  const personalStats = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let currentRoundDue = 0;
    let unpaidSeatsCount = 0;

    mySeats.forEach((seat) => {
      const sharePct = seat.isCoSeat
        ? seat.coOwners?.find((owner) => owner.userId === currentUserId)?.sharePercentage ?? 0
        : 100;
      const perSeatContribution = (pool.config.contribution * sharePct) / 100;

      // Calculate total contributed so far (for all rounds)
      const seatTxs = transactions.filter(t => t.seatId === seat._id && (t.userId === currentUserId || !t.userId));
      seatTxs.forEach(tx => {
        if (tx.status === "PAID") totalPaid += perSeatContribution;
        if (tx.status === "PENDING") totalPending += perSeatContribution;
      });

      // Calculate current round due
      const currentTx = transactions.find(t =>
        t.seatId === seat._id &&
        t.roundIndex === pool.currentRound &&
        (t.userId === currentUserId || !t.userId)
      );

      if (!currentTx || currentTx.status === "UNPAID") {
        currentRoundDue += perSeatContribution;
        unpaidSeatsCount++;
      }
    });

    return { totalPaid, totalPending, currentRoundDue, unpaidSeatsCount };
  }, [pool, mySeats, transactions, currentUserId]);

  const overdueItems = useMemo(() => {
    const items: Array<{ seat: PoolSeat; roundIndex: number; amount: number }> = [];
    if (pool.status !== "ACTIVE") return items;

    for (let round = 1; round < pool.currentRound; round += 1) {
      mySeats.forEach((seat) => {
        const sharePct = seat.isCoSeat
          ? seat.coOwners?.find((owner) => owner.userId === currentUserId)?.sharePercentage ?? 0
          : 100;

        const dueAmount = (pool.config.contribution * sharePct) / 100;

        const tx = transactions.find(
          (t) =>
            t.seatId === seat._id &&
            t.roundIndex === round &&
            (t.userId === currentUserId || !t.userId)
        );

        if ((!tx || tx.status === "UNPAID") && sharePct > 0) {
          items.push({ seat, roundIndex: round, amount: dueAmount });
        }
      });
    }

    return items;
  }, [pool, mySeats, transactions, currentUserId]);

  return (
    <section className="space-y-6">
      <Surface tier={1} className="rounded-3xl p-5 sm:p-6 grain border border-[var(--border-subtle)]/40">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-[var(--accent-vivid)] mb-2">Personal Status</p>
              <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">
                {personalStats.currentRoundDue > 0
                  ? `Due: ${formatCurrency(personalStats.currentRoundDue, pool.config.currency)}`
                  : "All caught up"
                }
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={onViewHistory} className="rounded-full btn-chip h-8">
              View History
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--surface-2)]/40 p-3.5 border border-[var(--border-subtle)]/30">
              <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mb-1">Total Paid</p>
              <p className="text-base font-display font-bold text-[var(--text-primary)]">
                {formatCurrency(personalStats.totalPaid, pool.config.currency)}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-2)]/40 p-3.5 border border-[var(--border-subtle)]/30">
              <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mb-1">Seats Taken</p>
              <p className="text-base font-display font-bold text-[var(--text-primary)]">
                {mySeats.length} {mySeats.length === 1 ? "Seat" : "Seats"}
              </p>
            </div>
          </div>

          {personalStats.currentRoundDue > 0 && (
            <div className="flex items-center justify-between rounded-2xl bg-[var(--accent-vivid)]/10 p-4 border border-[var(--accent-vivid)]/20">
              <div className="flex flex-col">
                <p className="text-xs font-semibold text-[var(--accent-vivid)]">Next payment due</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{nextDueDate}</p>
              </div>
              <Button size="sm" onClick={() => {
                const firstUnpaid = mySeats.find(seat => {
                  const tx = transactions.find(t => t.seatId === seat._id && t.roundIndex === pool.currentRound);
                  return !tx || tx.status === "UNPAID";
                });
                if (firstUnpaid) {
                  const sharePct = firstUnpaid.isCoSeat
                    ? firstUnpaid.coOwners?.find((owner) => owner.userId === currentUserId)?.sharePercentage ?? 0
                    : 100;
                  onPay(firstUnpaid._id as string, pool.currentRound, (pool.config.contribution * sharePct) / 100);
                }
              }} className="rounded-full px-5">
                Pay Current
              </Button>
            </div>
          )}
        </div>
      </Surface>

      {overdueItems.length > 0 && (
        <div className="flex items-start gap-4 rounded-3xl border border-[var(--danger)]/30 bg-[var(--danger)]/7 p-5">
          <div className="shrink-0 rounded-2xl bg-[var(--danger)]/15 p-3 text-[var(--danger)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Overdue Payments</h3>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">Multiple rounds are pending attention.</p>
            <div className="mt-4 space-y-3">
              {overdueItems.map((item) => (
                <div key={`${item.seat._id}-${item.roundIndex}`} className="flex items-center justify-between rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Round {item.roundIndex} • Seat #{item.seat.seatNumber}
                    </p>
                    <p className="text-xs text-[var(--danger)] font-bold">{formatCurrency(item.amount, pool.config.currency)}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => onPay(item.seat._id as string, item.roundIndex, item.amount)} className="rounded-full h-8 px-4">
                    Pay Now
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-[var(--text-muted)] px-1">My Managed Seats</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {mySeats.map((seat) => {
            const sharePct = seat.isCoSeat
              ? seat.coOwners?.find((owner) => owner.userId === currentUserId)?.sharePercentage ?? 0
              : 100;
            const dueAmount = (pool.config.contribution * sharePct) / 100;

            const tx = transactions.find(
              (t) =>
                t.seatId === seat._id &&
                t.roundIndex === pool.currentRound &&
                (t.userId === currentUserId || !t.userId)
            );

            const status = (tx?.status as "PAID" | "PENDING" | "UNPAID") || "UNPAID";
            const wonRound = seat.roundWon || null;

            return (
              <SeatCard
                key={seat._id}
                seatNumber={seat.seatNumber}
                sharePct={sharePct}
                dueAmount={dueAmount}
                dueDate={nextDueDate}
                status={status}
                currency={pool.config.currency}
                onPay={() => onPay(seat._id as string, pool.currentRound, dueAmount)}
                wonRound={wonRound}
                wonAmount={wonRound ? winningAmount : undefined}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
