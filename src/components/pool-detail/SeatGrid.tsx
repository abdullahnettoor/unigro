import { cn } from "@/lib/utils";
import { getVirtualOpenSeats } from "@/lib/pool";
import type { PoolDetail, PoolSeat, PoolTransaction } from "./types";

interface SeatGridProps {
  pool: PoolDetail;
  seats: PoolSeat[];
  transactions: PoolTransaction[];
  onSeatClick?: (seat: PoolSeat, isOpen: boolean) => void;
}

function buildSeatMatrix(pool: PoolDetail, seats: PoolSeat[]) {
  const virtualSeats = getVirtualOpenSeats(
    { status: pool.status, currentRound: pool.currentRound, config: pool.config, seats },
    seats
  ).map((seat) => ({
    _id: seat._id,
    seatNumber: seat.seatNumber,
    status: "OPEN" as const,
  } as PoolSeat));

  const fullSeats = [...seats, ...virtualSeats]
    .filter((seat) => seat.seatNumber >= 1)
    .sort((a, b) => a.seatNumber - b.seatNumber);

  return fullSeats;
}

export function SeatGrid({ pool, seats, transactions, onSeatClick }: SeatGridProps) {
  const fullSeats = buildSeatMatrix(pool, seats);

  return (
    <div className="flex flex-wrap gap-1.5 w-full whitespace-normal">
      {fullSeats.map((seat) => {
        const isOpen = seat.status === "OPEN" || (!seat.userId && !seat.isCoSeat);
        const roundTxs = transactions.filter(
          (tx) => tx.seatId === seat._id && tx.roundIndex === pool.currentRound
        );
        const isPaid = roundTxs.some((tx) => tx.status === "PAID");
        const isPending = roundTxs.some((tx) => tx.status === "PENDING");
        const isWinner = seat.roundWon && seat.roundWon <= pool.currentRound;

        return (
          <button
            key={`${seat._id}-${seat.seatNumber}`}
            type="button"
            onClick={() => onSeatClick?.(seat, isOpen)}
            className={cn(
              "relative h-9 w-9 shrink-0 rounded-xl border text-[10px] font-semibold transition-all",
              "flex items-center justify-center",
              isOpen
                ? "border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--surface-2)]/30"
                : "border-[var(--border-subtle)] text-[var(--text-primary)] bg-[var(--surface-2)]/50",
              isPaid && "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10",
              isPending && "border-[var(--warning)]/50 bg-[var(--warning)]/10",
              isWinner && "border-[var(--gold)] bg-[var(--gold)]/10"
            )}
          >
            {seat.seatNumber}
            {!isOpen && (
              <span
                className={cn(
                  "absolute right-1.5 top-1.5 h-2 w-2 rounded-full",
                  isWinner
                    ? "bg-[var(--gold)]"
                    : isPaid
                      ? "bg-[var(--accent-vivid)]"
                      : isPending
                        ? "bg-[var(--warning)]"
                        : "bg-[var(--text-muted)]"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
