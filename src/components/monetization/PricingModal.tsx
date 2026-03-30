import { useState } from "react";
import { CheckCircle2, Mail, MessageCircle, ShieldCheck, WalletCards } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { startUpgrade } from "@/lib/billing";
import type { EntitlementSnapshot } from "@/lib/entitlements";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entitlements: EntitlementSnapshot;
  context?: "settings" | "dashboard" | "pools" | "create-limit";
}

export function PricingModal({ open, onOpenChange, entitlements, context = "settings" }: PricingModalProps) {
  const [showContactOptions, setShowContactOptions] = useState(false);

  const isPro = entitlements.planTier === "pro";
  const freeLimit = 5;

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) setShowContactOptions(false); }}>
      <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[32px] max-w-[440px] p-0 overflow-hidden outline-none">
        <DialogHeader className="p-6 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Organizer Pro</p>
          <DialogTitle className="font-display text-2xl font-bold text-[var(--text-primary)]">
            {isPro ? "You’re already on Pro" : "Upgrade your organizer workspace"}
          </DialogTitle>
          <p className="text-sm text-[var(--text-muted)]">
            {context === "create-limit"
              ? `You've reached the free limit of ${freeLimit} pools.`
              : "Keep your browse surfaces ad-free and unlock more pools."}
          </p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Surface tier={2} className="rounded-[24px] border border-[var(--border-subtle)]/60 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--surface-2)]/45 p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Current plan</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)] capitalize">{entitlements.planTier}</p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-2)]/45 p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Pool limit</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{entitlements.maxPools} pools</p>
              </div>
            </div>
          </Surface>

          <div className="grid gap-3 sm:grid-cols-2">
            <Surface tier={2} className="rounded-[24px] border border-[var(--border-subtle)]/60 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[var(--accent-vivid)]/12 p-2 text-[var(--accent-vivid)]">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Ad-free experience</p>
                  <p className="text-xs text-[var(--text-muted)]">Remove sponsorship slots from browse surfaces.</p>
                </div>
              </div>
            </Surface>
            <Surface tier={2} className="rounded-[24px] border border-[var(--border-subtle)]/60 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[var(--warning)]/12 p-2 text-[var(--warning)]">
                  <WalletCards size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Higher pool cap</p>
                  <p className="text-xs text-[var(--text-muted)]">Go from {freeLimit} to 25 active organizer pools.</p>
                </div>
              </div>
            </Surface>
          </div>

          <Surface tier={1} className="rounded-[24px] border border-[var(--border-subtle)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">What’s included</p>
            <div className="mt-3 space-y-2">
              {[
                "Ad-free Dashboard, Pools, and Settings",
                "Higher organizer pool creation limit",
                "Priority access to upcoming organizer features",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                  <CheckCircle2 size={14} className="text-[var(--accent-vivid)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Surface>

          {!showContactOptions ? (
            <div className="flex flex-col gap-3">
              <Button
                className="h-12 rounded-full bg-[var(--accent-vivid)] font-bold text-[var(--text-on-accent)]"
                onClick={() => setShowContactOptions(true)}
              >
                {isPro ? "Manage plan support" : "Upgrade to Pro"}
              </Button>
              <p className="text-center text-[11px] text-[var(--text-muted)]">
                Billing is coming soon. For now, we’ll help you upgrade manually.
              </p>
            </div>
          ) : (
            <Surface tier={2} className="rounded-[24px] border border-[var(--border-subtle)]/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Choose a contact path</p>
              <div className="mt-3 grid gap-3">
                <Button type="button" variant="secondary" className="h-11 rounded-2xl justify-start gap-2" onClick={() => startUpgrade("whatsapp")}>
                  <MessageCircle size={16} /> Talk to us on WhatsApp
                </Button>
                <Button type="button" variant="secondary" className="h-11 rounded-2xl justify-start gap-2" onClick={() => startUpgrade("email")}>
                  <Mail size={16} /> Email for upgrade access
                </Button>
                <Button type="button" variant="ghost" className="h-10 rounded-2xl" onClick={() => setShowContactOptions(false)}>
                  Billing coming soon
                </Button>
              </div>
            </Surface>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
