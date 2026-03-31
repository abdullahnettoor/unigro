import { useMemo, useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useNavigate } from "react-router-dom";
import * as Icons from "@/lib/icons";
import { useMutation } from "convex/react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { Surface } from "@/components/ui/Surface";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { AdSlot } from "@/components/monetization/AdSlot";
import { formatCurrency } from "@/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";

interface JoinPoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinSuccess?: (payload: { isGuest: boolean; seatNumbers: number[]; userId?: string; guestName?: string; guestPhone?: string }) => void;
  poolId: Id<"pools">;
  totalSeats: number;
  filledSeats: number;
  contribution: number;
  totalValue: number;
  currency?: string;
  isAuthenticated: boolean;
  poolTitle: string;
  isOrganizerVerified: boolean;
  userPhone?: string;
  userName?: string;
}

export function JoinPoolModal({
  open,
  onOpenChange,
  onJoinSuccess,
  poolId,
  totalSeats,
  filledSeats,
  contribution,
  totalValue,
  currency,
  isAuthenticated,
  poolTitle,
  isOrganizerVerified,
  userPhone,
  userName,
}: JoinPoolModalProps) {
  const joinPool = useMutation(api.seats.join);
  const joinAsGuest = useMutation(api.seats.joinAsGuest);
  const updateProfile = useMutation(api.users.updateProfile);
  const feedback = useFeedback();
  const navigate = useNavigate();

  const [selectedSeatCount, setSelectedSeatCount] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [localName, setLocalName] = useState(userName || "");
  const [localPhone, setLocalPhone] = useState(userPhone || "");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successState, setSuccessState] = useState<{
    seatNumbers: number[];
    isGuest: boolean;
    guestName?: string;
  } | null>(null);

  const availableSeats = Math.max(totalSeats - filledSeats, 0);
  const totalCommitment = contribution * selectedSeatCount;
  const potentialWin = totalValue * selectedSeatCount;
  const successSummary = useMemo(() => {
    if (!successState) return null;
    const seatNumbers = successState.seatNumbers ?? [];

    if (seatNumbers.length === 0) {
      return selectedSeatCount === 1 ? "Seat reserved" : `${selectedSeatCount} seats reserved`;
    }

    return seatNumbers.length === 1
      ? `Seat #${seatNumbers[0]} reserved`
      : `Seats #${seatNumbers.join(", #")} reserved`;
  }, [selectedSeatCount, successState]);

  const handleModalClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSuccessState(null);
      setAuthError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleJoin = async () => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      if (isAuthenticated) {
        // Check if phone number is missing
        if (!userPhone) {
          if (!localPhone || !isValidPhoneNumber(localPhone)) {
            feedback.toast.error("Phone required", "Please enter a valid phone number to continue.");
            setIsSubmitting(false);
            return;
          }

          // Update profile first
          await updateProfile({
            name: localName || "Anonymous",
            phone: localPhone,
          });
        }

        const result = await joinPool({ poolId, seatCount: selectedSeatCount });
        const seatNumbers = Array.isArray(result?.seatNumbers)
          ? result.seatNumbers
          : typeof result?.firstSeat === "number"
            ? [result.firstSeat]
            : [];
        setSuccessState({
          seatNumbers,
          isGuest: false,
        });
        onJoinSuccess?.({ isGuest: false, seatNumbers });
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

        const seatNumbers = Array.isArray(result?.seatNumbers)
          ? result.seatNumbers
          : typeof result?.firstSeat === "number"
            ? [result.firstSeat]
            : [];

        setSuccessState({
          seatNumbers,
          isGuest: true,
          guestName: guestName.trim(),
        });
        onJoinSuccess?.({
          isGuest: true,
          seatNumbers,
          userId: result.userId as string,
          guestName: guestName.trim(),
          guestPhone: guestPhone,
        });
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
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] p-0 gap-0 overflow-hidden max-w-sm sm:max-w-md flex flex-col max-h-[90vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-vivid)]/[0.03] to-transparent pointer-events-none" />

        {successState ? (
          <div className="relative z-[1] max-h-[90vh] overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="rounded-[28px] border border-[var(--border-subtle)]/70 bg-[var(--surface-elevated)]/92 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--accent-vivid)]">
                  {successState.isGuest ? "Guest access confirmed" : "Join confirmed"}
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold text-[var(--text-primary)]">
                  {successState.isGuest ? "Seats reserved successfully" : "You’re in the pool"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {successState.isGuest
                    ? "Your guest reservation is active now. Sign in later with the same phone number to fully claim these seats."
                    : "Your participation is live. Open the pool now or head back to your dashboard."}
                </p>

                <div className="mt-4 rounded-[22px] border border-[var(--border-subtle)]/50 bg-[var(--surface-2)]/45 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Pool</p>
                  <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{poolTitle}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{successSummary}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {formatCurrency(totalCommitment, currency)} per round
                  </p>
                </div>

                {successState.isGuest ? (
                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                    {successState.guestName || "Your guest account"} will stay linked to these seats until you sign in with the same number.
                  </p>
                ) : null}

                <div className="mt-5 flex flex-col gap-3">
                  <Button
                    className="h-12 rounded-full"
                    onClick={() => {
                      setSuccessState(null);
                      onOpenChange(false);
                    }}
                  >
                    Open pool
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-12 rounded-full"
                    onClick={() => {
                      setSuccessState(null);
                      onOpenChange(false);
                      navigate("/");
                    }}
                  >
                    Go to dashboard
                  </Button>
                </div>
              </div>

              <AdSlot
                placement="success-join"
                audience="all-free"
                title="Sponsored community tools"
                body="A compact sponsor block sits in the lower half of this success state while the confirmation stays focused above."
              />
            </div>
          </div>
        ) : (
        <>
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
          {!isAuthenticated ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Surface tier={1} className="rounded-2xl border border-[var(--border-subtle)]/60 p-4 bg-[var(--surface-1)]/40">
                <div className="flex gap-3">
                  <div className="shrink-0 text-[var(--accent-secondary)] mt-0.5">
                    <Icons.OrganizerIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-bitest text-[var(--text-primary)] mb-1">Guest Entry</h4>
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
          ) : !userPhone ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Surface tier={1} className="rounded-2xl border border-[var(--border-subtle)]/60 p-4 bg-[var(--accent-vivid)]/[0.03]">
                <div className="flex gap-3">
                  <div className="shrink-0 text-[var(--accent-vivid)] mt-0.5">
                    <Icons.ShieldCheckIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-bitest text-[var(--text-primary)] mb-1">Complete Profile</h4>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">Please add your phone number to join pools and participate.</p>
                  </div>
                </div>
              </Surface>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Your Name</label>
                  <Input
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    placeholder="Full name"
                    className="h-12 rounded-2xl bg-[var(--surface-2)]/50 border-[var(--border-subtle)]/40 focus:bg-[var(--surface-2)] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Phone Number</label>
                  <PhoneInputField
                    value={localPhone}
                    onChange={setLocalPhone}
                    error={!!authError}
                  />
                  {authError && <p className="text-[10px] font-bold text-[var(--danger)] animate-pulse ml-1">{authError}</p>}
                </div>
              </div>
            </div>
          ) : null}

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
            disabled={isSubmitting || availableSeats === 0 || !isOrganizerVerified}
            className="w-full h-14 rounded-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] hover:opacity-90 active:scale-[0.98] transition-all font-black text-sm uppercase tracking-widest shadow-xl shadow-[var(--accent-vivid)]/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Icons.HistoryIcon size={16} className="animate-spin" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isOrganizerVerified ? "Confirm & Join" : "Organizer Not Verified"}
                <Icons.CheckIcon size={16} strokeWidth={3} />
              </span>
            )}
          </Button>
          {!isOrganizerVerified && (
             <p className="text-[10px] text-center text-[var(--danger)] font-bold px-4">
               Joining is currently paused while the organizer completes verification.
             </p>
          )}
          <p className="text-[10px] text-center text-[var(--text-muted)] font-medium leading-relaxed px-4">
            By joining, you agree to the pool rules and verify that you can fulfill your contribution commitment.
          </p>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
