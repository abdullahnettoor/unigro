/**
 * Shared utility functions for pot-related calculations.
 * Import from this module instead of duplicating logic in components/pages.
 */

// --- Types (minimal, so this file stays framework-agnostic) ---

export interface PotConfig {
    totalSlots: number;
    duration: number;
    contribution: number;
    totalValue: number;
    frequency: string;
    currency?: string;
    commission?: number;
    gracePeriodDays?: number;
}

export interface SlimSlot {
    _id: string;
    slotNumber: number;
    status: string;
    userId?: string | null;
    isSplit?: boolean;
    remainingPercentage?: number;
    drawOrder?: number;
    [key: string]: unknown;
}

export interface SlimTransaction {
    slotId: string;
    monthIndex: number;
    status: string;
    userId?: string | null;
    [key: string]: unknown;
}

export interface SlimPot {
    status: string;
    currentMonth: number;
    config: PotConfig;
    startDate?: number;
    nextDrawDate?: number;
    slots?: SlimSlot[];
}

// ─────────────────────────────────────────────────────────────
// 1. SLOT STATS
// ─────────────────────────────────────────────────────────────

export interface SlotStats {
    /** Total configured slots */
    totalSlots: number;
    /** Slots with FILLED or RESERVED status */
    filledSlots: number;
    /** Slots that are neither FILLED nor RESERVED (available to join) */
    availableSlots: number;
    /** Whether any slots are still open */
    hasOpenSlots: boolean;
    /** Percentage of slots filled (0-100) */
    fillPercent: number;
}

export function getSlotStats(pot: SlimPot, slots: SlimSlot[] = []): SlotStats {
    const totalSlots = Math.max(pot.config.totalSlots, 1);
    const filledSlots = slots.filter(
        (s) => s.status === "FILLED" || s.status === "RESERVED"
    ).length;
    const availableSlots = Math.max(totalSlots - filledSlots, 0);
    return {
        totalSlots,
        filledSlots,
        availableSlots,
        hasOpenSlots: availableSlots > 0,
        fillPercent: Math.min(100, Math.round((filledSlots / totalSlots) * 100)),
    };
}

// ─────────────────────────────────────────────────────────────
// 2. CYCLE STATS
// ─────────────────────────────────────────────────────────────

export interface CycleStats {
    /** Total number of cycles in the pot */
    totalCycles: number;
    /** Current cycle index (clamped to [0, totalCycles]) */
    cycleIndex: number;
    /** Percentage of cycles completed (0-100) */
    cyclePercent: number;
    /** Human-readable label for the progress bar */
    cycleLabel: string;
}

export function getCycleStats(pot: SlimPot): CycleStats {
    const totalCycles = Math.max(pot.config.duration, 1);
    const cycleIndex = Math.min(Math.max(pot.currentMonth, 0), totalCycles);
    const cycleLabel =
        pot.config.frequency === "occasional" ? "Round progress" : "Cycle progress";
    return {
        totalCycles,
        cycleIndex,
        cyclePercent: Math.min(100, Math.round((cycleIndex / totalCycles) * 100)),
        cycleLabel,
    };
}

// ─────────────────────────────────────────────────────────────
// 3. UNIFIED PROGRESS (used for sort & display)
// ─────────────────────────────────────────────────────────────

/**
 * Returns a normalised progress score (0–1) suitable for sorting or progress bars.
 * - DRAFT pots: slot fill progress
 * - ACTIVE/COMPLETED pots: cycle progress
 */
export function getProgressScore(pot: SlimPot): number {
    if (pot.status === "DRAFT") {
        const slots = pot.slots || [];
        const filled = slots.filter(
            (s) => s.status === "FILLED" || s.status === "RESERVED"
        ).length;
        return filled / Math.max(pot.config.totalSlots, 1);
    }
    return (
        Math.min(Math.max(pot.currentMonth, 0), pot.config.duration) /
        Math.max(pot.config.duration, 1)
    );
}

/**
 * Returns display progress percentage (0-100) to show in UI.
 * - ACTIVE: payment progress for current cycle (paidCount / activeSlots)
 * - DRAFT: joining progress (filledSlots / totalSlots)
 */
export function getPotDisplayProgress(
    pot: SlimPot,
    slots: SlimSlot[] = [],
    transactions: SlimTransaction[] = []
): { percent: number; label: string; count: number; total: number } {
    const isActive = pot.status === "ACTIVE";
    if (isActive) {
        const activeSlots = slots.filter(
            (s) => s.status === "FILLED" || s.status === "RESERVED"
        );
        const roundTxs = transactions.filter(
            (t) => t.monthIndex === pot.currentMonth
        );
        const paidCount = roundTxs.filter((t) => t.status === "PAID").length;
        const total = activeSlots.length;
        const percent = total > 0 ? (paidCount / total) * 100 : 0;
        return { percent, label: "Payment progress", count: paidCount, total };
    }
    const { filledSlots, totalSlots, fillPercent } = getSlotStats(pot, slots);
    return { percent: fillPercent, label: "Joining progress", count: filledSlots, total: totalSlots };
}

// ─────────────────────────────────────────────────────────────
// 4. FINANCIAL CALCULATIONS
// ─────────────────────────────────────────────────────────────

export interface PotFinancials {
    totalValue: number;
    commissionPct: number;
    commissionAmount: number;
    winningAmount: number;
    contribution: number;
    currency: string | undefined;
}

export function getPotFinancials(pot: SlimPot): PotFinancials {
    const commissionPct = pot.config.commission || 0;
    const commissionAmount = (pot.config.totalValue * commissionPct) / 100;
    return {
        totalValue: pot.config.totalValue,
        commissionPct,
        commissionAmount,
        winningAmount: pot.config.totalValue - commissionAmount,
        contribution: pot.config.contribution,
        currency: pot.config.currency ?? "",
    };
}

// ─────────────────────────────────────────────────────────────
// 5. DATE CALCULATION
// ─────────────────────────────────────────────────────────────

export interface CycleDateResult {
    dateStr: string;
    isEvent: boolean;
}

/**
 * Calculates the date for a given cycle based on the pot's frequency.
 *
 * @param startDate - epoch ms of pot start date
 * @param cycleIndex - which cycle number (currentMonth from DB)
 * @param frequency - pot frequency string ("monthly", "weekly", etc.)
 * @param graceDays - optional grace period in days to add
 * @param nextDrawOverride - epoch ms override (for nextDrawDate field)
 */
export function getNextCycleDate(
    startDate: number | undefined,
    cycleIndex: number,
    frequency: string,
    graceDays: number = 0,
    nextDrawOverride?: number
): CycleDateResult {
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
    if (frequency === "monthly") date.setMonth(date.getMonth() + cycleIndex);
    else if (frequency === "quarterly") date.setMonth(date.getMonth() + cycleIndex * 3);
    else if (frequency === "weekly") date.setDate(date.getDate() + cycleIndex * 7);
    else if (frequency === "biweekly") date.setDate(date.getDate() + cycleIndex * 14);
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
// 6. VIRTUAL OPEN SLOTS
// ─────────────────────────────────────────────────────────────

export interface VirtualSlot {
    _id: string;
    slotNumber: number;
}

/**
 * Generates "virtual" open slot descriptors for slots that have not yet been
 * claimed (i.e., no DB record exists for that slot number).
 */
export function getVirtualOpenSlots(pot: SlimPot, slots: SlimSlot[]): VirtualSlot[] {
    const filledNumbers = new Set(
        slots.filter((s) => s.userId).map((s) => s.slotNumber)
    );
    return Array.from({ length: pot.config.totalSlots }, (_, i) => i + 1)
        .filter((n) => !filledNumbers.has(n))
        .map((n) => ({ slotNumber: n, _id: `virtual-${n}` }));
}

// ─────────────────────────────────────────────────────────────
// 7. COLLECTION PROGRESS (for PotVisualizer)
// ─────────────────────────────────────────────────────────────

/**
 * Calculates the monetary collection progress for the current cycle.
 * Handles split slot ownership percentages.
 */
export function getCollectionProgress(
    pot: SlimPot,
    slots: SlimSlot[],
    transactions: SlimTransaction[],
    currentMonthIndex: number
): number {
    const totalExpected = pot.config.contribution * pot.config.totalSlots;
    if (totalExpected === 0) return 0;

    const currentCycleTxs = transactions.filter(
        (t) => t.monthIndex === currentMonthIndex && t.status === "PAID"
    );

    let collected = 0;
    currentCycleTxs.forEach((tx) => {
        const slot = slots.find((s) => s._id === tx.slotId);
        if (!slot) return;
        if (slot.isSplit && (slot as any).splitOwners) {
            const owner = (slot as any).splitOwners.find(
                (o: any) => o.userId === tx.userId
            );
            if (owner) {
                collected += (pot.config.contribution * owner.sharePercentage) / 100;
            } else if (!tx.userId) {
                collected += pot.config.contribution;
            }
        } else {
            collected += pot.config.contribution;
        }
    });

    return Math.min(100, (collected / totalExpected) * 100);
}
