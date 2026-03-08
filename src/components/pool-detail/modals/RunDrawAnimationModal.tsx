import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Icons from "@/lib/icons";
import type { Id } from "@convex/dataModel";

interface Slot {
  seatId: Id<"seats">;
  seatNumber: number;
  userName?: string;
}

interface RunDrawAnimationModalProps {
  eligibleSlots: Slot[];
  onRunDraw: () => Promise<number>;
  onClose: (winnerSeatNumber?: number) => void;
  currency: string;
  winningAmount: number;
  currentRound: number;
}

type Phase = "ready" | "shuffling" | "settled" | "winner";

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
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
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: -24,
            width: p.size,
            height: p.isRect ? p.size * 1.6 : p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}40`
          }}
          initial={{ y: -30, rotate: 0, opacity: 1, scaleX: 1 }}
          animate={{ y: "110vh", rotate: p.swing, opacity: [1, 1, 1, 0], scaleX: [1, -1, 1, -1] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MIN_SHUFFLES = 25;
const SHUFFLE_INTERVAL_MS = 120;

export function RunDrawAnimationModal({
  eligibleSlots: eligibleSlotsProp,
  onRunDraw,
  onClose,
  currency,
  winningAmount,
  currentRound,
}: RunDrawAnimationModalProps) {
  const [slots] = useState<Slot[]>(eligibleSlotsProp);
  const [phase, setPhase] = useState<Phase>("ready");
  const [cardOrder, setCardOrder] = useState<Id<"seats">[]>(() => slots.map(s => s.seatId));
  const [showNumbers, setShowNumbers] = useState(true);

  const [settledWinnerId, setSettledWinnerId] = useState<Id<"seats"> | null>(null);
  const [winnerSlotId, setWinnerSlotId] = useState<Id<"seats"> | null>(null);
  const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawResultRef = useRef<{ seatNumber: number; seatId: Id<"seats"> } | null>(null);
  const shuffleCountRef = useRef(0);

  const clearShuffle = () => {
    if (shuffleRef.current) {
      clearInterval(shuffleRef.current);
      shuffleRef.current = null;
    }
  };

  const settleWithWinner = (seatId: Id<"seats">) => {
    clearShuffle();
    setCardOrder(slots.map(s => s.seatId));
    setSettledWinnerId(seatId);
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
      settleWithWinner(drawResultRef.current.seatId);
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
      const winSlot = slots.find(s => s.seatNumber === winNum);
      if (!winSlot) throw new Error("Winner seat not found.");
      drawResultRef.current = { seatNumber: winNum, seatId: winSlot.seatId };
      if (shuffleCountRef.current >= MIN_SHUFFLES) settleWithWinner(winSlot.seatId);
    } catch (err: unknown) {
      clearShuffle();
      setError(err instanceof Error ? err.message : "Draw failed. Please try again.");
      setPhase("ready");
      setShowNumbers(true);
    }
  };

  const revealWinner = () => {
    if (!settledWinnerId) return;

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

  const winnerSlot = slots.find(s => s.seatId === winnerSlotId);
  const count = slots.length;
  const cols = count <= 4 ? count : count <= 9 ? 3 : count <= 16 ? 4 : count <= 25 ? 5 : 6;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-between bg-[var(--surface-0)]/98 backdrop-blur-2xl py-8 px-4 sm:px-8 overflow-y-auto min-h-0 scrollbar-hide overscroll-contain">
      {phase === "winner" && <ConfettiBlizzard />}

      <AnimatePresence>
        {phase === "ready" && (
          <motion.button
            key="close"
            onClick={() => onClose()}
            className="absolute top-6 right-6 p-3 rounded-full bg-[var(--surface-2)]/60 text-[var(--text-primary)] z-10 border border-[var(--border-subtle)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Icons.CloseIcon size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="text-center select-none w-full mt-4">
        <AnimatePresence mode="wait">
          {phase === "ready" && (
            <motion.div key="h-ready" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--accent-vivid)] mb-2">Round {currentRound} Draw</p>
              <h2 className="text-4xl font-display font-black text-[var(--text-primary)]">Ready to Draw?</h2>
              <p className="text-sm text-[var(--text-muted)] mt-2 font-medium">
                {count} eligible members • {new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(winningAmount)} Pool
              </p>
            </motion.div>
          )}
          {phase === "shuffling" && (
            <motion.div key="h-shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--accent-vivid)] mb-2 animate-pulse">Shuffling entries...</p>
              <h2 className="text-4xl font-display font-black text-[var(--text-primary)]">Finding a Winner</h2>
            </motion.div>
          )}
          {phase === "settled" && (
            <motion.div key="h-settled" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.4 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--accent-vivid)] mb-2">Algorithm Settled</p>
              <h2 className="text-4xl font-display font-black text-[var(--text-primary)]">Winner Locked!</h2>
              <p className="text-sm text-[var(--text-muted)] mt-2 font-medium">Tap below to reveal the lucky member</p>
            </motion.div>
          )}
          {phase === "winner" && (
            <motion.div key="h-winner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--accent-vivid)] mb-2">🏆 Congratulations</p>
              <h2 className="text-4xl font-display font-black text-[var(--text-primary)]">Seat #{winnerSlot?.seatNumber}</h2>
              <p className="text-xl font-bold text-[var(--text-muted)] mt-1">{winnerSlot?.userName || "Member"}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Card Grid ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center w-full my-4">
        <motion.div layout className="grid gap-3 sm:gap-4 p-4"
          style={{ gridTemplateColumns: `repeat(${Math.min(cols, 6)}, minmax(0, 1fr))` }}>
          {cardOrder.map(seatId => {
            const slot = slots.find(s => s.seatId === seatId)!;
            const isNonWinner = phase === "winner" && seatId !== winnerSlotId;
            const isWinCard = phase === "winner" && seatId === winnerSlotId;

            return (
              <motion.div
                key={seatId}
                layoutId={seatId as string}
                layout="position"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                animate={
                  isWinCard ? { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
                    : isNonWinner ? { opacity: 0.05, scale: 0.9 }
                      : { opacity: 1, scale: 1 }
                }
                className="relative flex flex-col items-center justify-center w-14 h-20 sm:w-20 sm:h-28 rounded-2xl select-none border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20" />

                <AnimatePresence>
                  {showNumbers && phase === "ready" && (
                    <motion.div className="relative flex flex-col items-center gap-0.5"
                      initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                      <span className="font-display font-black text-xl text-[var(--text-primary)] leading-none">#{slot.seatNumber}</span>
                      <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-tighter line-clamp-1 max-w-[50px] text-center">{slot.userName}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {(phase === "shuffling" || phase === "settled") && (
                    <motion.div className="relative text-[var(--accent-vivid)]/20 text-2xl"
                      initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <Icons.ZapIcon size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Winner Card — Flip reveal ── */}
      <AnimatePresence>
        {phase === "winner" && winnerSlot && cardSize && (
          <motion.div
            className="fixed z-[350]"
            style={{
              left: "50%",
              top: "50%",
              width: cardSize.w,
              height: cardSize.h,
              marginLeft: -cardSize.w / 2,
              marginTop: -cardSize.h / 2,
              perspective: "1200px",
            }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <motion.div
              className="absolute inset-0 rounded-[40px]"
              style={{
                transformStyle: "preserve-3d",
                boxShadow: "0 0 100px rgba(var(--accent-vivid-rgb),0.3)",
              }}
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* ── FRONT FACE (winner details) ── */}
              <div
                className="absolute inset-0 rounded-[40px] flex flex-col items-center justify-center gap-4 overflow-hidden border-2 border-[var(--accent-vivid)]/30 bg-[var(--surface-0)] glass-2"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-vivid)]/10 to-transparent pointer-events-none" />

                <div className="relative flex flex-col items-center gap-4 text-center px-8">
                  <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5, delay: 1.2 }}>
                    <div className="h-20 w-20 rounded-3xl bg-[var(--accent-vivid)]/10 flex items-center justify-center text-[var(--accent-vivid)] border border-[var(--accent-vivid)]/20 shadow-xl">
                      <Icons.WinnerIcon size={40} />
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
                    <p className="text-[10px] uppercase tracking-[0.4em] font-black text-[var(--accent-vivid)] mb-1">Official Winner</p>
                    <p className="font-display font-black text-[var(--text-primary)] leading-none text-6xl mb-2">#{winnerSlot.seatNumber}</p>
                    <p className="text-xl font-bold text-[var(--text-primary)] px-4 py-1.5 rounded-full bg-[var(--surface-2)]/50 border border-[var(--border-subtle)]">
                      {winnerSlot.userName || "Member"}
                    </p>
                  </motion.div>

                  <div className="flex gap-1.5 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div key={i} className="text-[var(--accent-vivid)]"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.6 + i * 0.1, type: "spring" }}>
                        <Icons.ZapIcon size={14} fill="currentColor" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── BACK FACE ── */}
              <div
                className="absolute inset-0 rounded-[40px] flex items-center justify-center overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-1)]"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <Icons.ZapIcon size={64} className="text-[var(--text-muted)] opacity-10" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="text-xs font-bold uppercase tracking-widest text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-full px-6 py-3 mb-4">{error}</div>
      )}

      {/* ── CTA Buttons ────────────────────────────────────────── */}
      <div className="w-full max-w-xs z-[400] mb-8 relative">
        <AnimatePresence mode="wait">
          {phase === "ready" && (
            <motion.button
              key="start"
              onClick={startDraw}
              className="w-full h-16 flex items-center justify-center gap-3 bg-[var(--accent-vivid)] text-white font-black text-sm uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-[var(--accent-vivid)]/40 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <Icons.ZapIcon size={20} /> Run Random Draw
            </motion.button>
          )}
          {phase === "shuffling" && (
            <motion.div key="running" className="flex flex-col items-center gap-3 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-[var(--accent-vivid)]"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-vivid)]">Fair Selection in Progress</p>
            </motion.div>
          )}
          {phase === "settled" && (
            <motion.button
              key="reveal"
              onClick={revealWinner}
              className="w-full h-16 flex items-center justify-center gap-3 bg-[var(--surface-3)] text-[var(--text-primary)] font-black text-sm uppercase tracking-[0.2em] rounded-full shadow-2xl border border-[var(--border-subtle)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            >
              <Icons.WinnerIcon size={20} /> Reveal the Winner
            </motion.button>
          )}
          {phase === "winner" && (
            <motion.button
              key="done"
              onClick={() => onClose()}
              className="w-full h-16 flex items-center justify-center gap-3 bg-[var(--text-primary)] text-[var(--surface-0)] font-black text-sm uppercase tracking-[0.2em] rounded-full hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.8 }}
            >
              Done — Back to Pool
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
