import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Sparkles, Trophy, X, Zap } from "lucide-react";

interface Slot {
    _id: string;
    slotNumber: number;
    drawOrder?: number | null;
    user?: { name: string; pictureUrl?: string } | null;
    isSplit?: boolean;
    splitOwners?: { userName?: string }[];
}

interface RunDrawAnimationModalProps {
    eligibleSlots: Slot[];
    onRunDraw: () => Promise<number>;
    onClose: () => void;
    currency: string;
    winningAmount: number;
    currentMonth: number;
}

type Phase = "ready" | "shuffling" | "settled" | "winner";

function getSlotLabel(slot: Slot): string {
    if (slot.isSplit && slot.splitOwners?.length) {
        return slot.splitOwners.map(o => o.userName || "?").join(", ");
    }
    return slot.user?.name || "Member";
}

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
    "#fbbf24", "#f59e0b", "#a3e635", "#34d399",
    "#60a5fa", "#818cf8", "#f472b6", "#fb923c",
];

function ConfettiBlizzard() {
    const particles = useRef(
        Array.from({ length: 80 }, (_, i) => ({
            id: i,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            x: Math.random() * 100,
            size: 7 + Math.random() * 8,
            duration: 2.2 + Math.random() * 2,
            delay: Math.random() * 1.6,
            swing: (Math.random() - 0.5) * 360,
            isRect: Math.random() > 0.5,
        }))
    ).current;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 310 }} aria-hidden>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className={p.isRect ? "rounded-sm" : "rounded-full"}
                    style={{ position: "absolute", left: `${p.x}%`, top: -24, width: p.size, height: p.isRect ? p.size * 1.6 : p.size, backgroundColor: p.color }}
                    initial={{ y: -30, rotate: 0, opacity: 1, scaleX: 1 }}
                    animate={{ y: "110vh", rotate: p.swing, opacity: [1, 1, 1, 0], scaleX: [1, -1, 1, -1] }}
                    transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
                />
            ))}
        </div>
    );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MIN_SHUFFLES = 28;
const SHUFFLE_INTERVAL_MS = 110;

// ── Main Modal ────────────────────────────────────────────────────────────────
export function RunDrawAnimationModal({
    eligibleSlots: eligibleSlotsProp,
    onRunDraw,
    onClose,
    currency,
    winningAmount,
    currentMonth,
}: RunDrawAnimationModalProps) {
    // Snapshot at mount — immune to Convex live-data after draw
    const [slots] = useState<Slot[]>(eligibleSlotsProp);

    const [phase, setPhase] = useState<Phase>("ready");
    const [cardOrder, setCardOrder] = useState<string[]>(() => slots.map(s => s._id));
    const [showNumbers, setShowNumbers] = useState(true);

    const [settledWinnerId, setSettledWinnerId] = useState<string | null>(null);
    const [winnerSlotId, setWinnerSlotId] = useState<string | null>(null);
    // Target card size — computed once at reveal time
    const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(null);

    const [error, setError] = useState<string | null>(null);

    const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const drawResultRef = useRef<{ slotNum: number; slotId: string } | null>(null);
    const shuffleCountRef = useRef(0);

    const clearShuffle = () => {
        if (shuffleRef.current) { clearInterval(shuffleRef.current); shuffleRef.current = null; }
    };

    const settleWithWinner = (slotId: string) => {
        clearShuffle();
        setCardOrder(slots.map(s => s._id));
        setSettledWinnerId(slotId);
        setPhase("settled");
    };

    const doShuffle = () => {
        setCardOrder(prev => {
            const next = [...prev];
            const swaps = 2 + Math.floor(Math.random() * 2);
            for (let s = 0; s < swaps; s++) {
                const i = Math.floor(Math.random() * next.length);
                const j = Math.floor(Math.random() * next.length);
                if (i !== j) [next[i], next[j]] = [next[j], next[i]];
            }
            return next;
        });
        shuffleCountRef.current++;
        if (shuffleCountRef.current >= MIN_SHUFFLES && drawResultRef.current !== null) {
            settleWithWinner(drawResultRef.current.slotId);
        }
    };

    const startDraw = async () => {
        setError(null);
        setShowNumbers(false);
        setPhase("shuffling");
        shuffleCountRef.current = 0;
        drawResultRef.current = null;
        shuffleRef.current = setInterval(doShuffle, SHUFFLE_INTERVAL_MS);
        try {
            const winNum = await onRunDraw();
            const winSlot = slots.find(s => s.slotNumber === winNum);
            if (!winSlot) throw new Error("Winner slot not found.");
            drawResultRef.current = { slotNum: winNum, slotId: winSlot._id };
            if (shuffleCountRef.current >= MIN_SHUFFLES) settleWithWinner(winSlot._id);
        } catch (err: any) {
            clearShuffle();
            setError(err?.message || "Draw failed. Please try again.");
            setPhase("ready");
            setShowNumbers(true);
        }
    };

    const revealWinner = () => {
        if (!settledWinnerId) return;

        // Compute centered card size with portrait 2:3 ratio
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const PAD = 40;
        const RATIO = 3 / 2;
        const maxW = Math.min(vw - PAD * 2, 360);
        const maxH = Math.min(vh - PAD * 2, maxW * RATIO);
        const w = Math.min(maxW, maxH / RATIO);
        setCardSize({ w, h: w * RATIO });

        setWinnerSlotId(settledWinnerId);
        setPhase("winner");
    };

    useEffect(() => () => clearShuffle(), []);

    const winnerSlot = slots.find(s => s._id === winnerSlotId);
    const count = slots.length;
    const cols = count <= 4 ? count : count <= 9 ? 3 : count <= 16 ? 4 : count <= 25 ? 5 : 6;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-black/92 backdrop-blur-xl py-8 px-4 sm:px-8 overflow-hidden">

            {phase === "winner" && <ConfettiBlizzard />}

            <AnimatePresence>
                {phase === "ready" && (
                    <motion.button key="close" onClick={onClose}
                        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <X size={20} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="text-center select-none w-full">
                <AnimatePresence mode="wait">
                    {phase === "ready" && (
                        <motion.div key="h-ready" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-secondary)] mb-1">Monthly Draw</p>
                            <h2 className="text-3xl sm:text-4xl font-display font-black text-white">Ready to draw?</h2>
                            <p className="text-sm text-white/40 mt-1">{count} eligible slots · {new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(winningAmount)} pool</p>
                        </motion.div>
                    )}
                    {phase === "shuffling" && (
                        <motion.div key="h-shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-vivid)] mb-1 animate-pulse">Shuffling…</p>
                            <h2 className="text-3xl sm:text-4xl font-display font-black text-white">Who will win? 🎲</h2>
                        </motion.div>
                    )}
                    {phase === "settled" && (
                        <motion.div key="h-settled" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.4 }} exit={{ opacity: 0 }}>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-secondary)] mb-1">Draw Complete</p>
                            <h2 className="text-3xl sm:text-4xl font-display font-black text-white">Winner selected!</h2>
                            <p className="text-sm text-white/40 mt-1">Tap below to reveal</p>
                        </motion.div>
                    )}
                    {phase === "winner" && (
                        <motion.div key="h-winner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} exit={{ opacity: 0 }}>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--gold)] mb-1">🏆 Congratulations!</p>
                            <h2 className="text-3xl sm:text-4xl font-display font-black text-[var(--gold)]">Slot #{winnerSlot?.slotNumber}</h2>
                            <p className="text-lg font-bold text-white/80 mt-1">{winnerSlot ? getSlotLabel(winnerSlot) : ""}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Card Grid ─────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center w-full my-4">
                <motion.div layout className="grid gap-3 sm:gap-4"
                    style={{ gridTemplateColumns: `repeat(${Math.min(cols, 8)}, minmax(0, 1fr))` }}>
                    {cardOrder.map(slotId => {
                        const slot = slots.find(s => s._id === slotId)!;
                        const isNonWinner = phase === "winner" && slotId !== winnerSlotId;
                        const isWinCard = phase === "winner" && slotId === winnerSlotId;

                        return (
                            <motion.div
                                key={slotId}
                                layoutId={slotId}
                                layout="position"
                                id={`draw-card-${slotId}`}
                                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                animate={
                                    isWinCard ? { opacity: 0, scale: 0.85, transition: { duration: 0.15 } }
                                        : isNonWinner ? { opacity: 0.1, scale: 0.88 }
                                            : { opacity: 1, scale: 1 }
                                }
                                className="relative flex flex-col items-center justify-center w-14 h-20 sm:w-16 sm:h-24 rounded-xl select-none border-2 overflow-hidden border-white/10 bg-gradient-to-br from-[#1a2744] to-[#0c1526]"
                            >
                                <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 56 80" preserveAspectRatio="none">
                                    <defs><pattern id={`dp-${slotId}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.5" height="3.5" fill="rgba(148,163,184,0.6)" /></pattern></defs>
                                    <rect width="100%" height="100%" fill={`url(#dp-${slotId})`} />
                                </svg>

                                <AnimatePresence>
                                    {showNumbers && phase === "ready" && (
                                        <motion.div className="relative flex flex-col items-center gap-0.5"
                                            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                                            <span className="font-display font-black text-xl text-white/80 leading-none">#{slot.slotNumber}</span>
                                            <span className="text-[9px] text-white/40 font-medium leading-tight line-clamp-1 text-center px-1">{getSlotLabel(slot)}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {(phase === "shuffling" || phase === "settled") && (
                                        <motion.div className="relative text-white/20 text-lg"
                                            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                            ✦
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* ── Winner Card — true 3D flip, always centered, no size animation ── */}
            <AnimatePresence>
                {phase === "winner" && winnerSlot && cardSize && (
                    /*
                     * Outer wrapper: pops into view at center (scale 0→1).
                     * No width/height animation — no "golden window" effect.
                     */
                    <motion.div
                        className="fixed z-[270]"
                        style={{
                            left: "50%",
                            top: "50%",
                            width: cardSize.w,
                            height: cardSize.h,
                            marginLeft: -cardSize.w / 2,
                            marginTop: -cardSize.h / 2,
                            // perspective must be on a PARENT of the rotating element
                            perspective: "1000px",
                        }}
                        initial={{ scale: 0.15, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] /* spring-like overshoot */ }}
                    >
                        {/*
                         * Inner card: rotates from 180° → 0°.
                         * Standard CSS two-face trick:
                         *   - front face: backfaceVisibility hidden, no extra rotation
                         *     → visible when card rotateY is near 0°
                         *   - back face: backfaceVisibility hidden, rotateY(180deg)
                         *     → visible when card rotateY is near 180°
                         * Starting at rotateY 180°: back is showing.
                         * Ends at rotateY 0°: front is showing.
                         */}
                        <motion.div
                            className="absolute inset-0 rounded-3xl"
                            style={{
                                transformStyle: "preserve-3d",
                                boxShadow: "0 0 80px rgba(255,200,50,0.5), 0 0 160px rgba(255,200,50,0.2)",
                            }}
                            initial={{ rotateY: 180 }}
                            animate={{ rotateY: 0 }}
                            transition={{ duration: 1.1, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {/* ── FRONT FACE (winner details) ── */}
                            <div
                                className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center gap-4 overflow-hidden border-2 border-[var(--gold)] bg-gradient-to-br from-[#1a0f00] via-[#2a1800] to-[#0f0800]"
                                style={{ backfaceVisibility: "hidden" }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,200,50,0.13)_0%,transparent_70%)] pointer-events-none" />

                                <div className="relative flex flex-col items-center gap-3 text-center px-6">
                                    <motion.div className="flex flex-col items-center" initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", bounce: 0.55, delay: 1.1 }}>
                                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--gold)]/50 mb-3">Round {currentMonth}</p>
                                        <Trophy size={56} className="text-[var(--gold)] drop-shadow-[0_0_20px_rgba(255,200,50,0.8)]" />
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.2, type: "spring", bounce: 0.3 }}>
                                        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--gold)]/50 mb-1">Winner</p>
                                        <p className="font-display font-black text-[var(--gold)] leading-none drop-shadow-[0_0_12px_rgba(255,200,50,0.6)]"
                                            style={{ fontSize: "clamp(3rem, 10vw, 5rem)" }}>
                                            #{winnerSlot.slotNumber}
                                        </p>
                                        <p className="font-bold text-white mt-2 leading-tight"
                                            style={{ fontSize: "clamp(1rem, 3.5vw, 1.5rem)" }}>
                                            {getSlotLabel(winnerSlot)}
                                        </p>
                                    </motion.div>
                                    <div className="flex gap-2 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <motion.span key={i} className="text-xl text-[var(--gold)]"
                                                initial={{ opacity: 0, y: 10, scale: 0.5 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ delay: 1.4 + i * 0.07, type: "spring", bounce: 0.5 }}>
                                                ★
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── BACK FACE (matching grid card) ── */}
                            <div
                                className="absolute inset-0 rounded-3xl flex items-center justify-center overflow-hidden border-2 border-white/10 bg-gradient-to-br from-[#1a2744] to-[#0c1526]"
                                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                            >
                                <svg className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="none" viewBox="0 0 56 80">
                                    <defs><pattern id="dp-win-back" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.5" height="3.5" fill="rgba(148,163,184,0.6)" /></pattern></defs>
                                    <rect width="100%" height="100%" fill="url(#dp-win-back)" />
                                </svg>
                                <span className="text-6xl text-white/10 select-none">✦</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error ─────────────────────────────────────────────── */}
            {error && (
                <div className="text-sm text-red-400 bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-3 max-w-sm text-center mb-2">{error}</div>
            )}

            {/* ── CTA Buttons ────────────────────────────────────────── */}
            <div className="w-full max-w-xs z-[280] relative">
                <AnimatePresence mode="wait">
                    {phase === "ready" && (
                        <motion.button key="start" onClick={startDraw}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-black text-sm py-4 rounded-2xl shadow-[0_10px_40px_rgba(var(--accent-vivid-rgb),0.45)] hover:scale-[1.03] active:scale-[0.97] transition-transform"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                            <Zap size={18} /> Start Draw
                        </motion.button>
                    )}
                    {phase === "shuffling" && (
                        <motion.div key="running" className="flex items-center justify-center gap-3 text-white/40 text-sm py-4"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <span className="inline-flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <motion.span key={i} className="w-2 h-2 rounded-full bg-[var(--accent-vivid)]"
                                        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                                ))}
                            </span>
                            Shuffling in progress…
                        </motion.div>
                    )}
                    {phase === "settled" && (
                        <motion.button key="reveal" onClick={revealWinner}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--accent-secondary)] text-[var(--text-primary)] font-black text-sm py-4 rounded-2xl shadow-[0_10px_40px_rgba(var(--accent-secondary-rgb),0.35)] hover:scale-[1.03] active:scale-[0.97] transition-transform"
                            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }} exit={{ opacity: 0 }}>
                            <Eye size={18} /> Reveal Winner
                        </motion.button>
                    )}
                    {phase === "winner" && (
                        <motion.button key="done" onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--gold)] text-black font-black text-sm py-4 rounded-2xl hover:scale-[1.03] active:scale-[0.97] transition-transform shadow-[0_10px_40px_rgba(255,200,50,0.4)]"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.8, type: "spring", bounce: 0.4 }} exit={{ opacity: 0 }}>
                            <Sparkles size={18} /> Done — Celebrate! 🎉
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
