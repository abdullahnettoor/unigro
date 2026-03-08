import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TrophyIcon } from "lucide-react";
import { getCollectionProgress } from "@/lib/pool";
import type { PoolDetail, PoolSeat, PoolTransaction } from "../types";

export function seatIsUnallocated(seat: PoolSeat) {
    return seat.status === "OPEN" || (!seat.userId && !seat.isCoSeat);
}

// ─────────────────────────────────────────────────────────────────────────
// GEOMETRY HELPERS
// ─────────────────────────────────────────────────────────────────────────
const toRad = (d: number) => (d * Math.PI) / 180;

function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number) {
    const a = toRad(angleDeg - 90); // start at top
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// SVG arc path from angle A to angle B (degrees, clockwise from top)
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const clamp = Math.min(endDeg, startDeg + 359.9);
    const s = pointOnCircle(cx, cy, r, startDeg);
    const e = pointOnCircle(cx, cy, r, clamp);
    const large = clamp - startDeg > 180 ? 1 : 0;
    return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r} 0 ${large},1 ${e.x.toFixed(2)},${e.y.toFixed(2)}`;
}

// ─────────────────────────────────────────────────────────────────────────
// STATUS VISUAL TOKENS
// ─────────────────────────────────────────────────────────────────────────
type PaymentStatus = "paid" | "pending" | "unpaid" | "open";
type WinStatus = "current" | "previous" | "none";

function getVisualTokens(payment: PaymentStatus, win: WinStatus) {
    let color = "var(--text-muted)";
    let strokeOpacity = 1;
    let fillOpacity = 0.15;
    let isPulse = false;

    if (win === "current") {
        color = "var(--gold)";
        fillOpacity = 0.15;
    } else if (payment === "paid") {
        color = "var(--accent-vivid)";
        fillOpacity = 0.15;
    } else if (payment === "pending") {
        color = "var(--warning)";
        fillOpacity = 0.15;
        isPulse = true;
    } else if (payment === "unpaid") {
        color = "var(--accent-vivid)";
        strokeOpacity = 0.4;
        fillOpacity = 0.02;
    } else { // open
        color = "var(--text-muted)";
        strokeOpacity = 0.3;
        fillOpacity = 0;
    }

    const dasharray = payment === "paid" ? "none" : "4 3";

    const showTrophy = win !== "none";
    const trophyColor = win === "current" ? "var(--gold)" : color;
    const trophyOpacity = win === "current" ? 1 : strokeOpacity;

    return { color, strokeOpacity, fillOpacity, dasharray, isPulse, showTrophy, trophyColor, trophyOpacity };
}

function CentralOrb({ pct, round }: { pct: number, round: number }) {
    const R = 65;   // orb radius
    const CX = 200;
    const CY = 200;

    // liquid fill: clip from bottom
    const fillY = CY + R - (pct / 100) * (R * 2);
    const fillHeight = (pct / 100) * (R * 2);

    // Energy ring: 0-100% arc around the orb
    const RING_R = R + 12;
    const ringEnd = pct * 3.599; // degrees (0->360)

    return (
        <g>
            {/* Outer ambient glow */}
            <circle cx={CX} cy={CY} r={R + 25} fill="var(--accent-vivid)" opacity={0.1} />

            {/* Energy ring track */}
            <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="var(--border-subtle)" strokeWidth={2} opacity={0.3} strokeDasharray="4 6" />

            {/* Energy ring fill (progress) */}
            {pct > 0 && (
                <path
                    d={arcPath(CX, CY, RING_R, 0, ringEnd)}
                    fill="none"
                    stroke="var(--accent-vivid)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 5px var(--accent-vivid))` }}
                />
            )}

            {/* Energy ring tip dot */}
            {pct > 1 && (() => {
                const tip = pointOnCircle(CX, CY, RING_R, ringEnd);
                return (
                    <circle cx={tip.x} cy={tip.y} r={4}
                        fill="var(--accent-vivid)"
                        style={{ filter: `drop-shadow(0 0 6px var(--accent-vivid))` }}
                    />
                );
            })()}

            {/* Orb base layers */}
            <circle cx={CX} cy={CY} r={R} fill="var(--surface-1)" stroke="var(--border-subtle)" strokeWidth={1.5} opacity={0.8} />

            {/* Liquid fill layer - clipped to orb */}
            <defs>
                <clipPath id="orb-clip">
                    <circle cx={CX} cy={CY} r={Math.max(0, R - 1)} />
                </clipPath>
            </defs>

            {/* Liquid fill */}
            {pct > 0 && (
                <rect
                    x={CX - R} y={fillY}
                    width={R * 2} height={fillHeight + 2}
                    fill="var(--accent-vivid)"
                    opacity={0.3}
                    clipPath="url(#orb-clip)"
                    style={{ filter: `drop-shadow(0 0 8px var(--accent-vivid))` }}
                />
            )}
            {pct > 0 && (
                <rect
                    x={CX - R} y={fillY}
                    width={R * 2} height={4}
                    fill="rgba(255,255,255,0.4)"
                    clipPath="url(#orb-clip)"
                    rx={2}
                />
            )}

            {/* Orb glass border */}
            <circle cx={CX} cy={CY} r={R}
                fill="none"
                stroke="var(--border-subtle)" strokeWidth={2}
                opacity={0.5}
                style={{ filter: `drop-shadow(0 0 4px var(--accent-vivid))` }} />

            {/* Center text: % collected */}
            <text x={CX} y={CY - 12} textAnchor="middle"
                fill="var(--text-muted)"
                style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700 }}
                className="font-sans uppercase">
                ROUND
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle"
                fill="var(--text-primary)"
                style={{ fontSize: 26, fontWeight: 800 }}
                className="font-display">
                {round}
            </text>
            <text x={CX} y={CY + 32} textAnchor="middle"
                fill="var(--accent-vivid)"
                style={{ fontSize: 11, fontWeight: 700 }}
                className="font-sans">
                {Math.round(pct)}%
            </text>
        </g>
    );
}

function SatelliteNode({ seat, payment, win, angle, cx, cy, orbitR, isHovered, onSelect, onHover }: any) {
    const pos = pointOnCircle(cx, cy, orbitR, angle);
    const tok = getVisualTokens(payment, win);
    const R = isHovered ? 18 : 14;
    const subR = R + 8;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(seat);
    };

    // Animation value for co-seat orbiting
    const [pulsePhase, setPulsePhase] = useState(0);

    // Pulse ticker for co-seat rotation
    useEffect(() => {
        let frame: number;
        let last = performance.now();
        const tick = (now: number) => {
            const dt = now - last;
            last = now;
            setPulsePhase(p => p + dt * 0.06); // ~degrees per ms at 0.06
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    // Co-seat sub-particle angles (two small nodes orbiting the satellite)
    const sub1 = {
        x: pos.x + subR * Math.cos(toRad(pulsePhase * 1.2)),
        y: pos.y + subR * Math.sin(toRad(pulsePhase * 1.2))
    };
    const sub2 = {
        x: pos.x + subR * Math.cos(toRad(pulsePhase * 1.2 + 180)),
        y: pos.y + subR * Math.sin(toRad(pulsePhase * 1.2 + 180))
    };

    return (
        <motion.g
            onClick={handleClick}
            onMouseEnter={() => onHover(seat)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "pointer" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Co-seat Sub-particles (orbiting around the main seat node) */}
            {seat.isCoSeat && (
                <g>
                    <circle cx={sub1.x} cy={sub1.y} r={3} fill="var(--text-muted)" opacity={0.6} />
                    <circle cx={sub2.x} cy={sub2.y} r={3} fill="var(--warning)" opacity={0.8} />
                </g>
            )}

            {/* Outer halo: pending pulse / selected glow */}
            {(tok.isPulse || isHovered) && (
                <motion.circle
                    cx={pos.x} cy={pos.y} r={R + (isHovered ? 10 : 8)}
                    fill={tok.color}
                    opacity={0.15}
                    animate={tok.isPulse ? { opacity: [0.15, 0.4, 0.15] } : {}}
                    transition={tok.isPulse ? { duration: 1.5, repeat: Infinity } : {}}
                />
            )}

            {/* Main node */}
            {seat.user?.pictureUrl && payment !== "open" ? (
                <g>
                    <clipPath id={`clip-${seat._id}`}>
                        <circle cx={pos.x} cy={pos.y} r={R} />
                    </clipPath>
                    <image href={seat.user.pictureUrl} x={pos.x - R} y={pos.y - R} width={R * 2} height={R * 2} clipPath={`url(#clip-${seat._id})`} preserveAspectRatio="xMidYMid slice" opacity={payment === "unpaid" ? 0.4 : 1} />
                    <motion.circle
                        cx={pos.x} cy={pos.y}
                        fill="none"
                        stroke={tok.color}
                        strokeOpacity={tok.strokeOpacity}
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        strokeDasharray={tok.dasharray}
                        style={{
                            filter: (isHovered || win === "current")
                                ? `drop-shadow(0 0 6px ${tok.color})`
                                : "none",
                        }}
                        initial={{ r: 14 }}
                        animate={{ r: R }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                </g>
            ) : (
                <motion.circle
                    cx={pos.x} cy={pos.y}
                    fill={tok.color}
                    fillOpacity={tok.fillOpacity}
                    stroke={tok.color}
                    strokeOpacity={tok.strokeOpacity}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray={tok.dasharray}
                    style={{
                        filter: (isHovered || win === "current")
                            ? `drop-shadow(0 0 6px ${tok.color})`
                            : "none",
                    }}
                    initial={{ r: 14 }}
                    animate={{ r: R }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
            )}

            {/* Seat number */}
            {(!seat.user?.pictureUrl || payment === "open") && (
                <text
                    x={pos.x} y={pos.y + (R > 13 ? 4 : 3)}
                    textAnchor="middle"
                    fill={tok.color}
                    opacity={tok.strokeOpacity}
                    style={{
                        fontSize: R > 13 ? 10 : 9,
                        fontWeight: 800,
                        pointerEvents: "none",
                    }}
                    className="font-mono"
                >
                    {seat.seatNumber < 10 ? `0${seat.seatNumber}` : seat.seatNumber}
                </text>
            )}

            {/* Trophy icon */}
            {tok.showTrophy && (
                <g transform={`translate(${pos.x - 6}, ${pos.y + R + 2})`}>
                    <foreignObject width={12} height={12}>
                        <TrophyIcon className="w-3 h-3 drop-shadow-sm" style={{ color: tok.trophyColor, opacity: tok.trophyOpacity }} />
                    </foreignObject>
                </g>
            )}
        </motion.g>
    );
}

function SeatTooltip({ seat, payment, win, pos, orbitR, cx, cy }: any) {
    if (!seat) return null;
    const tok = getVisualTokens(payment, win);

    // Position tooltip: outside the orbit, angled away from center
    const angle = Math.atan2(pos.y - cy, pos.x - cx);
    const tipDist = orbitR + 25;
    const tipX = cx + tipDist * Math.cos(angle);
    const tipY = cy + tipDist * Math.sin(angle);
    const isRight = pos.x >= cx;
    const tipW = 120;
    const tipH = seat.isCoSeat ? 65 : 55;
    const boxX = isRight ? tipX : tipX - tipW;
    const boxY = tipY - tipH / 2;

    // Let's cap the boxX so it doesn't overflow the SVG container 
    // Container logic: CX=200, CY=200. Max width approx 400.
    const clampedBoxX = Math.max(10, Math.min(400 - tipW - 10, boxX));
    const clampedBoxY = Math.max(10, Math.min(400 - tipH - 10, boxY));

    const displayName = seat.status === "OPEN" || (!seat.userId && !seat.isCoSeat)
        ? "Open Seat"
        : seat.isCoSeat
            ? seat.coOwners?.map((o: any) => o.userName?.split(" ")[0]).join(" & ")
            : seat.user?.name || "Member";

    const tooltipName = `#${seat.seatNumber < 10 ? '0' + seat.seatNumber : seat.seatNumber} · ${displayName}`;

    const statusLabel = payment === "paid" ? "Paid" : payment === "pending" ? "Pending" : payment === "unpaid" ? "Unpaid" : "Open";
    const displayStatus = win === "current" ? "Cycle Winner" : win === "previous" ? "Previous Winner" : statusLabel;

    return (
        <motion.g style={{ pointerEvents: "none" }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {/* Connector line */}
            <line
                x1={pos.x} y1={pos.y}
                x2={isRight ? clampedBoxX : clampedBoxX + tipW} y2={clampedBoxY + tipH / 2}
                stroke={tok.color} strokeWidth={1}
                opacity={0.5} strokeDasharray="3 4"
            />

            {/* Glass panel */}
            <rect
                x={clampedBoxX} y={clampedBoxY}
                width={tipW} height={tipH}
                rx={8}
                fill="var(--surface-1)"
                opacity={0.9}
                stroke="var(--border-subtle)"
                strokeWidth={1}
                style={{ filter: `drop-shadow(0 4px 16px rgba(0,0,0,0.15))` }}
            />

            {/* Status dot */}
            <circle cx={clampedBoxX + 12} cy={clampedBoxY + 16} r={3} fill={tok.color} />

            {/* Name */}
            <text x={clampedBoxX + 20} y={clampedBoxY + 20}
                fill="var(--text-primary)"
                style={{ fontSize: 10, fontWeight: 700 }}
                className="font-sans">
                {tooltipName?.length > 18 ? tooltipName.slice(0, 16) + "..." : tooltipName}
            </text>

            {/* Status */}
            <text x={clampedBoxX + 12} y={clampedBoxY + 36}
                fill={tok.color}
                style={{ fontSize: 9, fontWeight: 600 }}
                className="font-sans">
                {displayStatus}
            </text>

            {/* Co-seat note */}
            {seat.isCoSeat && (
                <text x={clampedBoxX + 12} y={clampedBoxY + 52}
                    fill="var(--warning)"
                    style={{ fontSize: 8, fontWeight: 700 }}
                    className="font-sans tracking-wide">
                    ⚡ CO-SEAT
                </text>
            )}
        </motion.g>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// ORBITAL VISUALIZER
// ─────────────────────────────────────────────────────────────────────────
interface VisualizerProps {
    pool: PoolDetail;
    seats: PoolSeat[];
    transactions: PoolTransaction[];
    onSeatClick?: (seat: PoolSeat, isOpen: boolean) => void;
}

export function OrbitVisualizer({ pool, seats, transactions, onSeatClick }: VisualizerProps) {
    const [hoveredSeat, setHoveredSeat] = useState<PoolSeat | null>(null);

    const currentRoundIndex = pool.currentRound;

    const sortedSeats = useMemo(() => {
        // We want to ensure all seats render, including placeholders.
        // Even if they are open, they should take up a spot on the orbit.
        return seats.filter(s => s.seatNumber >= 1).sort((a, b) => a.seatNumber - b.seatNumber);
    }, [seats]);

    const collectionProgress = getCollectionProgress?.(pool, seats, transactions, currentRoundIndex) || 0;

    const SIZE = 400;
    const CX = 200;
    const CY = 200;
    const ORBIT_R = 140;

    const seatAngles = sortedSeats.map((_, i) => (i / sortedSeats.length) * 360);

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div className="relative mx-auto flex w-full max-w-[460px] items-center justify-center overflow-visible">
                <svg
                    width="100%"
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    style={{ overflow: "visible", display: "block" }}
                >
                    {/* Scene ambient glow */}
                    <circle cx={CX} cy={CY} r={190} fill="var(--surface-1)" opacity={0.3} />

                    {/* Orbit track */}
                    <circle
                        cx={CX} cy={CY} r={ORBIT_R}
                        fill="none"
                        stroke="var(--border-subtle)"
                        strokeWidth={1.5}
                        strokeDasharray="4 6"
                        opacity={0.5}
                    />

                    {/* Central orb */}
                    <CentralOrb pct={collectionProgress} round={currentRoundIndex} />

                    {/* Energy beam (hovered seat -> orb) */}
                    {hoveredSeat && (() => {
                        const idx = sortedSeats.findIndex(s => s._id === hoveredSeat._id);
                        const angle = seatAngles[idx];
                        const sPos = pointOnCircle(CX, CY, ORBIT_R, angle);

                        const isOpen = seatIsUnallocated(hoveredSeat);
                        const roundTxs = transactions.filter(tx => tx.seatId === hoveredSeat._id && tx.roundIndex === currentRoundIndex);
                        const isPaid = roundTxs.some(tx => tx.status === "PAID");
                        const isPending = roundTxs.some(tx => tx.status === "PENDING");

                        const payment: PaymentStatus = isOpen ? "open" : isPaid ? "paid" : isPending ? "pending" : "unpaid";
                        const win: WinStatus = (hoveredSeat.roundWon && hoveredSeat.roundWon === currentRoundIndex) ? "current"
                            : (hoveredSeat.roundWon && hoveredSeat.roundWon < currentRoundIndex) ? "previous"
                                : "none";

                        const tok = getVisualTokens(payment, win);

                        return (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ pointerEvents: 'none' }}>
                                <line
                                    x1={sPos.x} y1={sPos.y} x2={CX} y2={CY}
                                    stroke={tok.color} strokeWidth={1.5}
                                    opacity={0.4}
                                    style={{ filter: `drop-shadow(0 0 4px ${tok.color})` }}
                                />
                            </motion.g>
                        );
                    })()}

                    {/* Satellite nodes */}
                    {sortedSeats.map((seat, i) => {
                        const angle = seatAngles[i];

                        const isOpen = seatIsUnallocated(seat);
                        const roundTxs = transactions.filter(tx => tx.seatId === seat._id && tx.roundIndex === currentRoundIndex);
                        const isPaid = roundTxs.some(tx => tx.status === "PAID");
                        const isPending = roundTxs.some(tx => tx.status === "PENDING");

                        const payment: PaymentStatus = isOpen ? "open" : isPaid ? "paid" : isPending ? "pending" : "unpaid";
                        const win: WinStatus = (seat.roundWon && seat.roundWon === currentRoundIndex) ? "current"
                            : (seat.roundWon && seat.roundWon < currentRoundIndex) ? "previous"
                                : "none";

                        return (
                            <SatelliteNode
                                key={`${seat.seatNumber}`} // Unique key matching position
                                seat={seat}
                                payment={payment}
                                win={win}
                                angle={angle}
                                cx={CX} cy={CY}
                                orbitR={ORBIT_R}
                                isHovered={hoveredSeat?._id === seat._id}
                                onSelect={() => onSeatClick?.(seat, isOpen)}
                                onHover={(s: PoolSeat | null) => setHoveredSeat(s)}
                            />
                        );
                    })}

                    {/* Tooltip */}
                    <AnimatePresence>
                        {hoveredSeat && (() => {
                            const idx = sortedSeats.findIndex(s => s._id === hoveredSeat._id);
                            const angle = seatAngles[idx];
                            const pos = pointOnCircle(CX, CY, ORBIT_R, angle);

                            const isOpen = seatIsUnallocated(hoveredSeat);
                            const roundTxs = transactions.filter(tx => tx.seatId === hoveredSeat._id && tx.roundIndex === currentRoundIndex);
                            const isPaid = roundTxs.some(tx => tx.status === "PAID");
                            const isPending = roundTxs.some(tx => tx.status === "PENDING");

                            const payment: PaymentStatus = isOpen ? "open" : isPaid ? "paid" : isPending ? "pending" : "unpaid";
                            const win: WinStatus = (hoveredSeat.roundWon && hoveredSeat.roundWon === currentRoundIndex) ? "current"
                                : (hoveredSeat.roundWon && hoveredSeat.roundWon < currentRoundIndex) ? "previous"
                                    : "none";

                            return (
                                <SeatTooltip
                                    key="tooltip"
                                    seat={hoveredSeat}
                                    payment={payment}
                                    win={win}
                                    pos={pos}
                                    orbitR={ORBIT_R}
                                    cx={CX} cy={CY}
                                />
                            );
                        })()}
                    </AnimatePresence>
                </svg>
            </div>

            {/* Legend mapping to tokens */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 px-4 pb-2 max-w-[340px] mx-auto opacity-80">
                {(pool.status === "ACTIVE"
                    ? [
                        { label: "Paid", color: "var(--accent-vivid)", opacity: 1, type: "solid" },
                        { label: "Winner", color: "var(--gold)", opacity: 1, type: "solid" },
                        { label: "Pending", color: "var(--warning)", opacity: 1, type: "solid" },
                        { label: "Unpaid", color: "var(--accent-vivid)", opacity: 0.4, type: "solid" }
                    ]
                    : [
                        { label: "Paid", color: "var(--accent-vivid)", opacity: 1, type: "solid" },
                        { label: "Winner", color: "var(--gold)", opacity: 1, type: "solid" },
                        { label: "Pending", color: "var(--warning)", opacity: 1, type: "solid" },
                        { label: "Unpaid", color: "var(--accent-vivid)", opacity: 0.4, type: "solid" },
                        { label: "Open", color: "var(--text-muted)", opacity: 0.3, type: "dashed" }
                    ]
                ).map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                                backgroundColor: item.type === "dashed" ? "transparent" : item.color,
                                border: item.type === "dashed" ? `1px dashed ${item.color}` : "none",
                                opacity: item.opacity
                            }}
                        />
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium font-sans">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

        </div>
    );
}
