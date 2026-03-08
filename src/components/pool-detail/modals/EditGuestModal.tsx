import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import * as Icons from "@/lib/icons";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";

interface EditGuestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestId: Id<"users"> | null;
  initialName?: string;
  initialPhone?: string;
}

export function EditGuestModal({ open, onOpenChange, guestId, initialName, initialPhone }: EditGuestModalProps) {
  const editGuest = useMutation(api.users.editGuest);
  const feedback = useFeedback();
  const [name, setName] = useState(initialName || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setPhone(initialPhone || "");
    }
  }, [initialName, initialPhone, open]);

  const handleSubmit = async () => {
    if (!guestId) return;
    if (!name.trim()) {
      feedback.toast.error("Invalid input", "Name cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      await editGuest({ userId: guestId, name, phone });
      feedback.toast.success("Guest updated", "Profile changed successfully.");
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update guest.";
      feedback.toast.error("Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] max-w-sm rounded-[32px] p-0 focus:outline-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex flex-col max-h-[85vh]">
          <DialogHeader className="p-7 pb-2 shrink-0 text-center sm:text-left pr-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Profile Management</p>
            <DialogTitle className="font-display text-xl font-bold text-[var(--text-primary)]">Edit guest info</DialogTitle>
            <DialogDescription className="text-sm text-[var(--text-muted)]">
              Update the contact details for this unverified member.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-7 pb-7 space-y-5 scrollbar-hide overscroll-contain">
            <div className="mt-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm"
                  placeholder="e.g. Khalid Ben"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Phone Number</label>
                <PhoneInputField
                  value={phone}
                  onChange={setPhone}
                  className="bg-[var(--surface-0)]/70 h-12 rounded-full border-[var(--border-subtle)]/80 shadow-sm"
                />
              </div>
            </div>

            <DialogFooter className="mt-12 flex flex-col items-stretch gap-3 pb-2 sm:space-x-0">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="h-12 w-full rounded-full bg-[var(--accent-vivid)] font-bold text-white shadow-[0_12px_28px_rgba(var(--accent-glow),0.25)] hover:bg-[var(--accent-vivid)]/90 transition-all">
                {isSubmitting ? <Icons.LoadingIcon className="h-4 w-4 animate-spin mr-2" /> : <Icons.EditIcon size={16} className="mr-2" />}
                Save changes
              </Button>
              <Button variant="outline" className="h-12 w-full rounded-full border-[var(--border-subtle)] text-[var(--text-muted)] font-bold hover:bg-[var(--surface-2)]/60 hover:text-[var(--text-primary)] transition-all" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
