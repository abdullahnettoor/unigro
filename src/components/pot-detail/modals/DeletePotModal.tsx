import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { AlertTriangle, Archive, Trash2, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Input } from "@/components/ui/Input";
import { ModalCloseButton, ModalHeader, ModalShell } from "@/components/ui/ModalShell";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface DeletePotModalProps {
    potId: Id<"pots">;
    potTitle: string;
    potStatus: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
    onClose: () => void;
}

export function DeletePotModal({ potId, potTitle, potStatus, onClose }: DeletePotModalProps) {
    const navigate = useNavigate();
    const feedback = useFeedback();
    const deletePot = useMutation(api.pots.deletePot);
    const archivePot = useMutation(api.pots.archivePot);

    const isDraft = potStatus === "DRAFT";

    // Steps: "initial" | "confirm-delete"
    const [step, setStep] = useState<"initial" | "confirm-delete">("initial");
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleArchive = async () => {
        setLoading(true);
        try {
            await archivePot({ potId });
            feedback.toast.success("Pot archived", "This pot is now archived and hidden from active pots.");
            onClose();
        } catch (err: any) {
            feedback.toast.error("Archive failed", err.message);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deletePot({ potId });
            feedback.toast.success("Pot deleted", "The pot and all its data have been permanently removed.");
            navigate("/pots");
        } catch (err: any) {
            feedback.toast.error("Delete failed", err.message);
            setLoading(false);
        }
    };

    const canConfirmDelete = confirmText.trim().toLowerCase() === potTitle.trim().toLowerCase();

    return (
        <ModalShell zIndex={100} showHandle={false}>
            <ModalHeader className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDraft || step === "confirm-delete" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                        {isDraft || step === "confirm-delete" ? <Trash2 size={20} /> : <Archive size={20} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">
                            {isDraft ? "Delete pot" : step === "confirm-delete" ? "Confirm permanent delete" : "Remove pot"}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">{potTitle}</p>
                    </div>
                </div>
                <ModalCloseButton onClick={onClose}>
                    <X size={18} />
                </ModalCloseButton>
            </ModalHeader>

            <div className="p-6 space-y-5">
                {/* ── DRAFT: immediate type-to-confirm delete ── */}
                {isDraft && (
                    <>
                        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 flex gap-3">
                            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300 leading-relaxed">
                                This will <strong>permanently delete</strong> this pot and all its slots. This action cannot be undone.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Type <span className="text-[var(--text-primary)] font-black">"{potTitle}"</span> to confirm
                            </label>
                            <Input
                                type="text"
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                placeholder={potTitle}
                                className="bg-[var(--surface-elevated)] text-sm focus:border-red-500"
                            />
                        </div>

                        <button
                            onClick={handleDelete}
                            disabled={!canConfirmDelete || loading}
                            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            {loading ? "Deleting…" : "Delete forever"}
                        </button>
                    </>
                )}

                {/* ── NON-DRAFT, STEP 1: archive suggestion ── */}
                {!isDraft && step === "initial" && (
                    <>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                            This pot is <strong className="text-[var(--text-primary)]">{potStatus}</strong>. We recommend archiving it instead of deleting — archived pots are hidden but their history is preserved.
                        </p>

                        {/* Archive — recommended */}
                        <button
                            onClick={handleArchive}
                            disabled={loading || potStatus === "ARCHIVED"}
                            className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-black py-3 rounded-xl hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            <Archive size={16} />
                            {loading ? "Archiving…" : potStatus === "ARCHIVED" ? "Already archived" : "Archive pot"}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                            <span className="text-xs text-[var(--text-muted)]">or</span>
                            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                        </div>

                        {/* Force delete — destructive secondary */}
                        <button
                            onClick={() => setStep("confirm-delete")}
                            className="w-full border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={14} />
                            Permanently delete instead
                        </button>
                    </>
                )}

                {/* ── NON-DRAFT, STEP 2: type-to-confirm ── */}
                {!isDraft && step === "confirm-delete" && (
                    <>
                        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 flex gap-3">
                            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300 leading-relaxed">
                                This will <strong>permanently delete</strong> the pot, all {potStatus === "ACTIVE" ? "ongoing " : ""}slots, transactions, and history. This cannot be undone.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Type <span className="text-[var(--text-primary)] font-black">"{potTitle}"</span> to confirm
                            </label>
                            <Input
                                type="text"
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                placeholder={potTitle}
                                className="bg-[var(--surface-elevated)] text-sm focus:border-red-500"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setStep("initial"); setConfirmText(""); }}
                                className="flex-1 border border-[var(--border-subtle)] text-[var(--text-muted)] font-bold py-3 rounded-xl hover:text-[var(--text-primary)] text-sm transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={!canConfirmDelete || loading}
                                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <Trash2 size={14} />
                                {loading ? "Deleting…" : "Delete forever"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </ModalShell>
    );
}
