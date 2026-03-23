import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";

import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { PoolFinancialsStep } from "@/components/create-pool/PoolFinancialsStep";
import { PoolSeatsStep } from "@/components/create-pool/PoolSeatsStep";
import { PoolRulesStep } from "@/components/create-pool/PoolRulesStep";
import { StepHeader } from "@/components/create-pool/StepHeader";
import { StepFooterBar } from "@/components/create-pool/StepFooterBar";
import { PoolSummaryPanel } from "@/components/create-pool/PoolSummaryPanel";

// ─── Types ────────────────────────────────────────────────────────────────────
type Frequency = "monthly" | "weekly" | "biweekly" | "quarterly" | "occasional";
type DrawStrategy = "RANDOM" | "MANUAL";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Strategy & Dates" },
  { id: 3, label: "Seats & Fees" },
] as const;

export function CreatePool() {
  const createPool = useMutation(api.pools.create);
  const updatePool = useMutation(api.pools.updatePool);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editPoolId = searchParams.get("edit") as Id<"pools"> | null;
  const existingPool = useQuery(api.pools.get, editPoolId ? { poolId: editPoolId } : "skip");

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    terms: "",
    hasPaymentDetails: false,
    paymentDetails: {
      upiId: "",
      accountName: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
      note: "",
    },
    totalValue: 100000,
    currency: "INR",
    contribution: 10000,
    duration: 10,
    frequency: "monthly" as Frequency,
    commission: 0,
    gracePeriodDays: 5,
    drawStrategy: "RANDOM" as DrawStrategy,
    organizerFirst: true,
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!existingPool) return;
    const existingPayment = existingPool.paymentDetails ?? {};
    const hasPaymentDetails = Boolean(
      existingPayment.upiId ||
      existingPayment.accountName ||
      existingPayment.bankName ||
      existingPayment.accountNumber ||
      existingPayment.ifsc ||
      existingPayment.note
    );
    const nextFormData = {
      title: existingPool.title,
      terms: existingPool.terms || "",
      hasPaymentDetails,
      paymentDetails: {
        upiId: existingPayment.upiId || "",
        accountName: existingPayment.accountName || "",
        bankName: existingPayment.bankName || "",
        accountNumber: existingPayment.accountNumber || "",
        ifsc: existingPayment.ifsc || "",
        note: existingPayment.note || "",
      },
      totalValue: existingPool.config.totalValue,
      currency: existingPool.config.currency || "INR",
      contribution: existingPool.config.contribution,
      duration: existingPool.config.duration,
      frequency: existingPool.config.frequency as Frequency,
      commission: existingPool.config.commission || 0,
      gracePeriodDays: existingPool.config.gracePeriodDays || 0,
      drawStrategy: existingPool.drawStrategy as DrawStrategy,
      organizerFirst: true,
      startDate: existingPool.startDate
        ? new Date(existingPool.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    };
    const frame = window.requestAnimationFrame(() => setFormData(nextFormData));
    return () => window.cancelAnimationFrame(frame);
  }, [existingPool]);

  const isLocked = !!existingPool && (existingPool as any).seats?.some((seat: any) => {
    if (seat.status !== "OPEN" && seat.isGuest === false) return true;
    return false;
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      if (updates.totalValue !== undefined || updates.duration !== undefined) {
        const duration = Math.max(1, Number(next.duration) || 1);
        next.contribution = Math.max(1, Math.round(next.totalValue / duration));
      }
      return next;
    });
    if (error) setError("");
  };

  const organizerFee = Math.round((formData.totalValue * formData.commission) / 100);
  const payout = Math.max(0, formData.totalValue - organizerFee);

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!formData.title.trim() || formData.title.trim().length < 3) return "Pool name must be at least 3 characters.";
    }
    if (stepIndex === 1) {
      if (!formData.startDate) return "Start date is required.";
      if (formData.gracePeriodDays < 0 || formData.gracePeriodDays > 30) {
        return "Grace period must be between 0 and 30 days.";
      }
    }
    if (stepIndex === 2) {
      if (formData.totalValue < 1000) return "Total pool value must be at least 1,000.";
      if (formData.duration < 2) return "Total seats must be at least 2.";
      if (formData.duration > 50) return "Total seats cannot exceed 50.";
      if (formData.contribution < 1) return "Contribution must be greater than 0.";
      if (formData.commission < 0 || formData.commission > 50) return "Organizer commission must be between 0% and 50%.";
    }
    return "";
  };

  const handleNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setError("");
    setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (step !== STEPS.length - 1) return;

    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const contribution = Math.max(1, Math.round(formData.totalValue / formData.duration));
      const rawPaymentDetails = formData.hasPaymentDetails
        ? {
          upiId: formData.paymentDetails.upiId.trim(),
          accountName: formData.paymentDetails.accountName.trim(),
          bankName: formData.paymentDetails.bankName.trim(),
          accountNumber: formData.paymentDetails.accountNumber.trim(),
          ifsc: formData.paymentDetails.ifsc.trim(),
          note: formData.paymentDetails.note.trim(),
        }
        : undefined;
      const paymentDetails = rawPaymentDetails
        ? Object.fromEntries(Object.entries(rawPaymentDetails).filter(([, value]) => value))
        : undefined;
      const payload = {
        title: formData.title.trim(),
        terms: formData.terms.trim() || undefined,
        paymentDetails,
        totalValue: formData.totalValue,
        totalSeats: formData.duration,
        contribution,
        currency: formData.currency,
        frequency: formData.frequency,
        duration: formData.duration,
        commission: Number(formData.commission),
        gracePeriodDays: Number(formData.gracePeriodDays),
        drawStrategy: formData.drawStrategy,
        startDate: new Date(formData.startDate).getTime(),
      };

      let poolId = editPoolId;
      if (editPoolId) {
        await updatePool({ poolId: editPoolId, ...payload });
      } else {
        poolId = await createPool({ ...payload, organizerFirst: formData.organizerFirst });
      }
      navigate(`/pools/${poolId}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      if (message.toLowerCase().includes("up to 5")) {
        setError("You have reached the 5 pool limit. Archive or delete a pool to create a new one.");
      } else {
        setError("Failed to save pool. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const nextLabel = step === 0 ? "Next: Strategy & Dates" : step === 1 ? "Next: Seats & Fees" : "Final step";

  return (
    <div className="min-h-dvh pb-24 relative">
      <StepHeader
        title={editPoolId ? "Edit Pool" : "Create Pool"}
        step={step}
        total={STEPS.length}
        stepLabel={STEPS[step].label}
        onBack={() => (step > 0 ? handleBack() : navigate(-1))}
        backLabel={step === 0 ? "Cancel" : "Back"}
      />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <AnimatePresence mode="wait" custom={step}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && (
                  <PoolFinancialsStep
                    formData={formData}
                    onChange={updateFormData}
                    disabled={false}
                  />
                )}
                {step === 1 && (
                  <PoolRulesStep
                    formData={formData}
                    onChange={updateFormData}
                    disableGracePeriod={isLocked}
                    disableStartDate={isLocked}
                  />
                )}
                {step === 2 && (
                  <PoolSeatsStep
                    formData={formData}
                    onChange={updateFormData}
                    disabled={isLocked}
                    showOrganizerFirst={!editPoolId}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </form>

          <PoolSummaryPanel
            formData={formData}
            organizerFee={organizerFee}
            payout={payout}
            isLocked={isLocked}
          />
        </div>
      </div>

      <StepFooterBar
        step={step}
        total={STEPS.length}
        nextLabel={nextLabel}
        submitLabel={editPoolId ? "Update Pool" : "Create Pool"}
        isSubmitting={isSubmitting}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
