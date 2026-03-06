/**
 * Shared utility functions for pool-related calculations.
 * Import from this module instead of duplicating logic in components/pages.
 */

// --- Types (minimal, so this file stays framework-agnostic) ---

export interface PoolConfig {
    totalSeats: number;
    duration: number;
    contribution: number;
    totalValue: number;
    frequency: string;
    currency?: string;
    commission?: number;
    gracePeriodDays?: number;
}

export interface SlimSeat {
    _id: string;
    seatNumber: number;
    status: string;
    userId?: string | null;
    isCoSeat?: boolean;
    remainingPercentage?: number;
    roundWon?: number;
    [key: string]: unknown;
}

export interface SlimTransaction {
    seatId: string;
    roundIndex: number;
    status: string;
    userId?: string | null;
    [key: string]: unknown;
}

export interface SlimPool {
    status: string;
    currentRound: number;
    config: PoolConfig;
    startDate?: number;
    nextDrawDate?: number;
    seats?: SlimSeat[];
}

// ─────────────────────────────────────────────────────────────
// 1. SEAT STATS
// ─────────────────────────────────────────────────────────────

export interface SeatStats {
    /** Total configured seats */
    totalSeats: number;
    /** Seats with FILLED or RESERVED status */
    filledSeats: number;
    /** Seats that are neither FILLED nor RESERVED (available to join) */
    availableSeats: number;
    /** Whether any seats are still open */
    hasOpenSeats: boolean;
    /** Percentage of seats filled (0-100) */
    fillPercent: number;
}

export function getSeatStats(pool: SlimPool, seats: SlimSeat[] = []): SeatStats {
    const totalSeats = Math.max(pool.config.totalSeats, 1);
    const filledSeats = seats.filter(
        (s) => s.status === "FILLED" || s.status === "RESERVED"
    ).length;
    const availableSeats = Math.max(totalSeats - filledSeats, 0);
    return {
        totalSeats,
        filledSeats,
        availableSeats,
        hasOpenSeats: availableSeats > 0,
        fillPercent: Math.min(100, Math.round((filledSeats / totalSeats) * 100)),
    };
}

// ─────────────────────────────────────────────────────────────
// 2. ROUND STATS
// ─────────────────────────────────────────────────────────────

export interface RoundStats {
    /** Total number of rounds in the pool */
    totalRounds: number;
    /** Current round index (clamped to [0, totalRounds]) */
    roundIndex: number;
    /** Percentage of rounds completed (0-100) */
    roundPercent: number;
    /** Human-readable label for the progress bar */
    roundLabel: string;
}

export function getRoundStats(pool: SlimPool): RoundStats {
    const totalRounds = Math.max(pool.config.duration, 1);
    const roundIndex = Math.min(Math.max(pool.currentRound, 0), totalRounds);
    const roundLabel =
        pool.config.frequency === "occasional" ? "Round progress" : "Round progress";
    return {
        totalRounds,
        roundIndex,
        roundPercent: Math.min(100, Math.round((roundIndex / totalRounds) * 100)),
        roundLabel,
    };
}

// ─────────────────────────────────────────────────────────────
// 3. UNIFIED PROGRESS (used for sort & display)
// ─────────────────────────────────────────────────────────────

/**
 * Returns a normalised progress score (0–1) suitable for sorting or progress bars.
 * - DRAFT pools: seat fill progress
 * - ACTIVE/COMPLETED pools: round progress
 */
export function getProgressScore(pool: SlimPool): number {
    if (pool.status === "DRAFT") {
        const seats = pool.seats || [];
        const filled = seats.filter(
            (s) => s.status === "FILLED" || s.status === "RESERVED"
        ).length;
        return filled / Math.max(pool.config.totalSeats, 1);
    }
    return (
        Math.min(Math.max(pool.currentRound, 0), pool.config.duration) /
        Math.max(pool.config.duration, 1)
    );
}

/**
 * Returns display progress percentage (0-100) to show in UI.
 * - ACTIVE: payment progress for current round (paidCount / activeSeats)
 * - DRAFT: joining progress (filledSeats / totalSeats)
 */
export function getPoolDisplayProgress(
    pool: SlimPool,
    seats: SlimSeat[] = [],
    transactions: SlimTransaction[] = []
): { percent: number; label: string; count: number; total: number } {
    const isActive = pool.status === "ACTIVE";
    if (isActive) {
        const activeSeats = seats.filter(
            (s) => s.status === "FILLED" || s.status === "RESERVED"
        );
        const roundTxs = transactions.filter(
            (t) => t.roundIndex === pool.currentRound
        );
        const paidCount = roundTxs.filter((t) => t.status === "PAID").length;
        const total = activeSeats.length;
        const percent = total > 0 ? (paidCount / total) * 100 : 0;
        return { percent, label: "Payment progress", count: paidCount, total };
    }
    const { filledSeats, totalSeats, fillPercent } = getSeatStats(pool, seats);
    return { percent: fillPercent, label: "Joining progress", count: filledSeats, total: totalSeats };
}

// ─────────────────────────────────────────────────────────────
// 4. FINANCIAL CALCULATIONS
// ─────────────────────────────────────────────────────────────

export interface PoolFinancials {
    totalValue: number;
    commissionPct: number;
    commissionAmount: number;
    winningAmount: number;
    contribution: number;
    currency: string | undefined;
}

export function getPoolFinancials(pool: SlimPool): PoolFinancials {
    const commissionPct = pool.config.commission || 0;
    const commissionAmount = (pool.config.totalValue * commissionPct) / 100;
    return {
        totalValue: pool.config.totalValue,
        commissionPct,
        commissionAmount,
        winningAmount: pool.config.totalValue - commissionAmount,
        contribution: pool.config.contribution,
        currency: pool.config.currency ?? "",
    };
}

// ─────────────────────────────────────────────────────────────
// 5. DATE CALCULATION
// ─────────────────────────────────────────────────────────────

export interface RoundDateResult {
    dateStr: string;
    isEvent: boolean;
}

/**
 * Calculates the date for a given round based on the pool's frequency.
 *
 * @param startDate - epoch ms of pool start date
 * @param roundIndex - which round number (currentRound from DB)
 * @param frequency - pool frequency string ("monthly", "weekly", etc.)
 * @param graceDays - optional grace period in days to add
 * @param nextDrawOverride - epoch ms override (for nextDrawDate field)
 */
export function getNextRoundDate(
    startDate: number | undefined,
    roundIndex: number,
    frequency: string,
    graceDays: number = 0,
    nextDrawOverride?: number
): RoundDateResult {
    if (nextDrawOverride) {
        return {
            dateStr: new Date(nextDrawOverride).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
            }),
            isEvent: false,
        };
    }
    if (frequency === "occasional" || !startDate) {
        return { dateStr: "On Demand", isEvent: true };
    }
    const date = new Date(startDate);
    if (frequency === "monthly") date.setMonth(date.getMonth() + roundIndex);
    else if (frequency === "quarterly") date.setMonth(date.getMonth() + roundIndex * 3);
    else if (frequency === "weekly") date.setDate(date.getDate() + roundIndex * 7);
    else if (frequency === "biweekly") date.setDate(date.getDate() + roundIndex * 14);
    date.setDate(date.getDate() + graceDays);
    return {
        dateStr: date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }),
        isEvent: false,
    };
}

// ─────────────────────────────────────────────────────────────
// 6. VIRTUAL OPEN SEATS
// ─────────────────────────────────────────────────────────────

export interface VirtualSeat {
    _id: string;
    seatNumber: number;
}

/**
 * Generates "virtual" open seat descriptors for seats that have not yet been
 * claimed (i.e., no DB record exists for that seat number).
 */
export function getVirtualOpenSeats(pool: SlimPool, seats: SlimSeat[]): VirtualSeat[] {
    const filledNumbers = new Set(
        seats.filter((s) => s.userId || s.isCoSeat).map((s) => s.seatNumber)
    );
    return Array.from({ length: pool.config.totalSeats }, (_, i) => i + 1)
        .filter((n) => !filledNumbers.has(n))
        .map((n) => ({ seatNumber: n, _id: `virtual-${n}` }));
}

// ─────────────────────────────────────────────────────────────
// 7. COLLECTION PROGRESS (for PoolVisualizer)
// ─────────────────────────────────────────────────────────────

/**
 * Calculates the monetary collection progress for the current round.
 * Handles co-seat ownership percentages.
 */
export function getCollectionProgress(
    pool: SlimPool,
    seats: SlimSeat[],
    transactions: SlimTransaction[],
    currentRoundIndex: number
): number {
    const totalExpected = pool.config.contribution * pool.config.totalSeats;
    if (totalExpected === 0) return 0;

    const currentRoundTxs = transactions.filter(
        (t) => t.roundIndex === currentRoundIndex && t.status === "PAID"
    );

    let collected = 0;
    currentRoundTxs.forEach((tx) => {
        const seat = seats.find((s) => s._id === tx.seatId);
        if (!seat) return;
        if (seat.isCoSeat && (seat as any).coOwners) {
            const owner = (seat as any).coOwners.find(
                (o: any) => o.userId === tx.userId
            );
            if (owner) {
                collected += (pool.config.contribution * owner.sharePercentage) / 100;
            } else if (!tx.userId) {
                collected += pool.config.contribution;
            }
        } else {
            collected += pool.config.contribution;
        }
    });

    return Math.min(100, (collected / totalExpected) * 100);
}
