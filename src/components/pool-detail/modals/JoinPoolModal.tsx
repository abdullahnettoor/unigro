import { useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import * as Icons from "@/lib/icons";
import { useMutation } from "convex/react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { Surface } from "@/components/ui/Surface";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { formatCurrency } from "@/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";

interface JoinPoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: Id<"pools">;
  totalSeats: number;
  filledSeats: number;
  contribution: number;
  totalValue: number;
  currency?: string;
  isAuthenticated: boolean;
}

export function JoinPoolModal({
  open,
  onOpenChange,
  poolId,
  totalSeats,
  filledSeats,
  contribution,
  totalValue,
  currency,
  isAuthenticated,
}: JoinPoolModalProps) {
  const joinPool = useMutation(api.seats.join);
  const joinAsGuest = useMutation(api.seats.joinAsGuest);
  const feedback = useFeedback();

  const [selectedSeatCount, setSelectedSeatCount] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSeats = Math.max(totalSeats - filledSeats, 0);
  const totalCommitment = contribution * selectedSeatCount;
  const potentialWin = totalValue * selectedSeatCount;

  const handleJoin = async () => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      if (isAuthenticated) {
        await joinPool({ poolId, seatCount: selectedSeatCount });
        feedback.toast.success("Joined pool", "You're in. Check your dashboard.");
        onOpenChange(false);
      } else {
        if (!guestName.trim()) {
          feedback.toast.error("Missing info", "Please provide your name.");
          setIsSubmitting(false);
          return;
        }

        if (!guestPhone || !isValidPhoneNumber(guestPhone)) {
          feedback.toast.error("Invalid phone", "Please enter a valid phone number.");
          setIsSubmitting(false);
          return;
        }

        const result = await joinAsGuest({
          poolId,
          name: guestName,
          phone: guestPhone,
          seatCount: selectedSeatCount,
        });

        const existing = JSON.parse(localStorage.getItem("unigro_guest_memberships") || "[]");
        if (!existing.includes(result.userId)) {
          existing.push(result.userId);
          localStorage.setItem("unigro_guest_memberships", JSON.stringify(existing));
        }

        feedback.toast.success("Joined as guest", "Your seats are reserved. Sign up to secure your account.");
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("ALREADY_REGISTERED")) {
        setAuthError("This phone number is already registered. Please sign in to join.");
      } else {
        feedback.toast.error("Join failed", message || "Unable to join pool.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] p-0 gap-0 overflow-hidden max-w-sm sm:max-w-md flex flex-col max-h-[90vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-vivid)]/[0.03] to-transparent pointer-events-none" />

        <DialogHeader className="p-6 pb-2 relative shrink-0 pr-12">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-[var(--accent-vivid)]/10 flex items-center justify-center text-[var(--accent-vivid)]">
              <Icons.JoinIcon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-vivid)]">Participation</p>
              <DialogTitle className="text-xl font-display font-black text-[var(--text-primary)]">Join this Pool</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-2 space-y-6 scrollbar-hide overscroll-contain">
          {!isAuthenticated && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Surface tier={1} className="rounded-2xl border border-[var(--border-subtle)]/60 p-4 bg-[var(--surface-1)]/40">
                <div className="flex gap-3">
                  <div className="shrink-0 text-[var(--accent-secondary)] mt-0.5">
                    <Icons.OrganizerIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)] mb-1">Guest Entry</h4>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">Reserve your seats now. You can link them to a permanent account anytime.</p>
                  </div>
                </div>
              </Surface>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Your Name</label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full name"
                    className="h-12 rounded-2xl bg-[var(--surface-2)]/50 border-[var(--border-subtle)]/40 focus:bg-[var(--surface-2)] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Phone Number</label>
                  <PhoneInputField
                    value={guestPhone}
                    onChange={setGuestPhone}
                    error={!!authError}
                  />
                  {authError && <p className="text-[10px] font-bold text-[var(--danger)] animate-pulse ml-1">{authError}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Select Allocation</h4>
                <p className="text-xs font-bold text-[var(--text-primary)]">How many seats?</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)]/60 border border-[var(--border-subtle)]/40">
                <Icons.SeatIcon size={10} className="text-[var(--accent-vivid)]" />
                <span className="text-[10px] font-bold text-[var(--text-muted)] whitespace-nowrap">{availableSeats} left</span>
              </div>
            </div>

            <div className="w-full h-24 flex items-center justify-center gap-8 rounded-3xl bg-[var(--surface-2)]/40 border border-[var(--border-subtle)]/40 shadow-inner group transition-all hover:bg-[var(--surface-2)]/60">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setSelectedSeatCount(Math.max(1, selectedSeatCount - 1))}
                disabled={selectedSeatCount <= 1}
                className="h-12 w-12 rounded-full border-[var(--border-subtle)] bg-[var(--surface-3)] text-[var(--text-primary)] hover:bg-[var(--accent-vivid)] hover:text-white hover:border-transparent transition-all shadow-sm active:scale-90 disabled:opacity-30"
              >
                <Icons.ExpandIcon size={18} style={{ transform: 'rotate(90deg)' }} />
              </Button>

              <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-4xl font-display font-black text-[var(--text-primary)] leading-none select-none">{selectedSeatCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-vivid)] mt-1.5">Seats</span>
              </div>

              <Button
                size="icon"
                variant="outline"
                onClick={() => setSelectedSeatCount(Math.min(availableSeats, selectedSeatCount + 1))}
                disabled={selectedSeatCount >= availableSeats}
                className="h-12 w-12 rounded-full border-[var(--border-subtle)] bg-[var(--surface-3)] text-[var(--text-primary)] hover:bg-[var(--accent-vivid)] hover:text-white hover:border-transparent transition-all shadow-sm active:scale-90 disabled:opacity-30"
              >
                <Icons.ExpandIcon size={18} style={{ transform: 'rotate(-90deg)' }} />
              </Button>
            </div>

            <div className="w-full mt-4 h-1.5 rounded-full bg-[var(--surface-2)]/60 overflow-hidden border border-[var(--border-subtle)]/20">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-vivid)] to-[var(--accent-secondary)] transition-all duration-500 ease-out shadow-[0_0_8px_var(--accent-vivid)]/30"
                style={{ width: `${(selectedSeatCount / totalSeats) * 100}%` }}
              />
            </div>
          </div>

          <Surface tier={2} className="rounded-3xl border border-[var(--border-subtle)]/60 p-5 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)] shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)]/20 pb-2">
              <Icons.BankIcon size={14} className="text-[var(--text-muted)]" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Commitment Summary</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-muted)]">
                    <Icons.RoundIcon size={10} />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-muted)]">Per round contribution</span>
                </div>
                <span className="font-mono text-sm font-black text-[var(--text-primary)]">{formatCurrency(totalCommitment, currency)}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/10">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-[var(--success)]/10 flex items-center justify-center text-[var(--success)]">
                    <Icons.WinnerIcon size={10} />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-muted)]">Amount per Win</span>
                </div>
                <span className="font-mono text-sm font-black text-[var(--success)]">{formatCurrency(totalValue, currency)}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/10">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-[var(--accent-secondary)]/10 flex items-center justify-center text-[var(--accent-secondary)]">
                    <Icons.ContributionIcon size={10} />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-muted)]">Total potential payout</span>
                </div>
                <span className="font-mono text-sm font-black text-[var(--accent-secondary)]">{formatCurrency(potentialWin, currency)}</span>
              </div>
            </div>
          </Surface>
        </div>

        <DialogFooter className="p-6 pt-0 sm:flex-col gap-3 shrink-0 sm:space-x-0">
          <Button
            onClick={handleJoin}
            disabled={isSubmitting || availableSeats === 0}
            className="w-full h-14 rounded-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] hover:opacity-90 active:scale-[0.98] transition-all font-black text-sm uppercase tracking-widest shadow-xl shadow-[var(--accent-vivid)]/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Icons.HistoryIcon size={16} className="animate-spin" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Confirm & Join
                <Icons.CheckIcon size={16} strokeWidth={3} />
              </span>
            )}
          </Button>
          <p className="text-[10px] text-center text-[var(--text-muted)] font-medium leading-relaxed px-4">
            By joining, you agree to the pool rules and verify that you can fulfill your contribution commitment.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
