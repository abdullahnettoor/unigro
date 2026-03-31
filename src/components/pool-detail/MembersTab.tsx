import { useMemo, useState } from "react";
import * as Icons from "@/lib/icons";
import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PoolDetail, PoolSeat, PoolTransaction } from "./types";
import type { Id } from "@convex/dataModel";

interface MembersTabProps {
  pool: PoolDetail;
  seats: PoolSeat[];
  currentUserId?: string;
  isOrganizer: boolean;
  transactions?: PoolTransaction[];
  onEditGuest: (guestId: Id<"users">, name: string, phone: string) => void;
}

export function MembersTab({
  pool,
  seats,
  currentUserId,
  isOrganizer,
  transactions = [],
  onEditGuest
}: MembersTabProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const members = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      phone: string;
      pictureUrl?: string | null;
      isGuest: boolean;
      seats: PoolSeat[];
      totalDue: number;
      isOrganizer: boolean;
    }>();

    seats.forEach((seat) => {
      const processUser = (user: any, isGuest: boolean, share?: number) => {
        if (!user?._id) return;
        const key = user._id as string;
        const existing = map.get(key);

        // Calculate due for this specific seat/user
        // Simplified: if there's no transaction for current round, they might owe money
        // In legacy they calculated from total cycles. For now let's show status from transactions.
        const currentRoundTx = transactions?.find(tx =>
          tx.roundIndex === pool.currentRound &&
          tx.userId === user._id &&
          tx.seatId === seat._id
        );
        const isPaid = currentRoundTx?.status === "PAID";
        const txDue = !isPaid ? pool.config.contribution * ((share || 100) / 100) : 0;

        map.set(key, {
          id: key,
          name: user.name || "Member",
          phone: user.phone || "",
          pictureUrl: user.pictureUrl,
          isGuest: isGuest,
          isOrganizer: user._id === pool.organizerId,
          seats: existing ? [...existing.seats, seat] : [seat],
          totalDue: (existing?.totalDue || 0) + txDue,
        });
      };

      if (seat.user) processUser(seat.user, !!seat.isGuest);
      seat.coOwners?.forEach((owner) => {
        processUser({
          _id: owner.userId,
          name: owner.userName,
          phone: owner.userPhone,
          pictureUrl: owner.userPictureUrl
        }, !!owner.isGuest, owner.sharePercentage);
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [seats, pool.organizerId, pool.currentRound, pool.config.contribution, transactions]);

  const toggleExpand = (id: string) => {
    setExpandedMember(expandedMember === id ? null : id);
  };

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Participants</p>
        <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Members Directory</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {members.map((member) => {
          const isMe = member.id === currentUserId;
          const isExpanded = expandedMember === member.id;
          const isFullyPaid = member.totalDue === 0;

          return (
            <Surface
              key={member.id}
              tier={2}
              className={cn(
                "grain flex flex-col rounded-[28px] border transition-all duration-300 overflow-hidden",
                isMe ? "border-[var(--accent-vivid)]/40 bg-[var(--surface-2)]" : "border-[var(--border-subtle)] bg-[var(--surface-2)]"
              )}
            >
              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-3)]/40 transition-colors"
                onClick={() => toggleExpand(member.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {member.pictureUrl ? (
                      <img src={member.pictureUrl} alt={member.name} className="h-12 w-12 rounded-2xl object-cover border border-[var(--border-subtle)]" />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-[var(--accent-vivid)]/10 border border-[var(--accent-vivid)]/20 text-[var(--accent-vivid)] flex items-center justify-center font-display text-lg font-black">
                        {member.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    {isMe && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[var(--accent-vivid)] border-2 border-[var(--surface-2)] flex items-center justify-center">
                        <Icons.CheckIcon size={8} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] truncate flex items-center gap-2">
                      {member.name}
                      {isMe && <span className="text-[9px] font-black uppercase text-[var(--accent-vivid)] tracking-tighter">You</span>}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[var(--text-muted)]">
                      <Icons.PhoneIcon size={10} />
                      <span className="text-[11px] font-mono leading-none">{member.phone || "No phone"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden xs:block">
                    <p className={cn(
                      "text-[10px] font-mono font-bold leading-none",
                      isFullyPaid ? "text-[var(--accent-vivid)]" : "text-[var(--accent-secondary)]"
                    )}>
                      {isFullyPaid ? "PAID" : "DUE"}
                    </p>
                    {!isFullyPaid && (
                      <p className="text-[9px] text-[var(--text-muted)] mt-1">₹{member.totalDue.toLocaleString()}</p>
                    )}
                  </div>
                  <Icons.ExpandIcon
                    size={14}
                    className={cn(
                      "text-[var(--text-muted)] transition-transform duration-300",
                      isExpanded ? "rotate-180" : ""
                    )}
                  />
                </div>
              </div>

              {/* Expansion Content */}
              {isExpanded && (
                <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3 rounded-2xl bg-[var(--surface-3)]/50 p-4 border border-[var(--border-subtle)]/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Details</p>
                      <div className="flex gap-1.5">
                        {member.isOrganizer && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--accent-vivid)]/10 text-[8px] font-black uppercase text-[var(--accent-vivid)] border border-[var(--accent-vivid)]/20">Organizer</span>
                        )}
                        {member.isGuest && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--surface-deep)] text-[8px] font-bold text-[var(--text-muted)] border border-[var(--border-subtle)] uppercase">Guest</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {member.seats.map((seat) => (
                        <div key={seat.seatNumber} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[var(--surface-1)]/40 hover:bg-[var(--surface-1)] transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border-subtle)]/40">
                              #{seat.seatNumber}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {seat.isCoSeat ? "Co-seat Stake" : "Full Seat"}
                            </span>
                          </div>
                          {seat.status === "FILLED" && (
                            <span className="text-[9px] font-black uppercase text-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10 px-1.5 py-0.5 rounded">Active</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {isOrganizer && member.isGuest && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 h-9 rounded-xl border-[var(--border-subtle)] text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-vivid)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGuest(member.id as Id<"users">, member.name, member.phone);
                        }}
                      >
                        <Icons.EditIcon size={12} className="mr-2" />
                        Edit Guest Info
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Surface>
          );
        })}
      </div>
    </section>
  );
}
