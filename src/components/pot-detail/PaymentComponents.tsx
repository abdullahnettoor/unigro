import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { AlertCircle, Banknote, CheckCircle, Clock, Image as ImageIcon, Smartphone, Upload, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { ModalBody, ModalCloseButton, ModalFooter, ModalHeader, ModalShell } from "@/components/ui/ModalShell";
import { formatCurrency } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface PaymentModalProps {
    potId: Id<"pots">;
    slotId: Id<"slots">;
    monthIndex: number;
    amount: number;

    onClose: () => void;
    isForeman?: boolean;
    onForemanRecord?: (date: number) => Promise<void>;
    currency?: string;
}

export function PaymentModal({ potId, slotId, monthIndex, amount, onClose, isForeman, onForemanRecord, currency }: PaymentModalProps) {
    const generateUploadUrl = useMutation(api.transactions.generateUploadUrl);
    const submitPayment = useMutation(api.transactions.submitPayment);
    const feedback = useFeedback();

    const [paymentType, setPaymentType] = useState<"cash" | "online" | null>(isForeman ? "cash" : null); // Foreman defaults to cash
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]); // Foreman Backdating
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) { // 5MB limit
                setError("File size must be less than 5MB");
                return;
            }
            setFile(selected);
            setError("");
        }
    };

    const handleOnlineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a file");
            return;
        }

        setIsUploading(true);
        setError("");

        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();

            await submitPayment({
                potId,
                slotId,
                monthIndex,
                storageId: storageId as Id<"_storage">,
                type: "online",
            });

            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to upload payment proof. Please try again.");
            setIsUploading(false);
        }
    };

    const handleCashSubmit = async () => {
        if (isForeman && onForemanRecord) {
            setIsUploading(true);
            try {
                const dateTimestamp = new Date(paymentDate).getTime();
                await onForemanRecord(dateTimestamp);
                onClose();
            } catch (err) {
                console.error(err);
                setError("Failed to record payment.");
                setIsUploading(false);
            }
            return;
        }

        const ok = await feedback.confirm({
            title: "Confirm cash payment?",
            message: "The organizer will need to approve this request.",
            confirmText: "Confirm",
        });
        if (ok) {
            setIsUploading(true);
            try {
                await submitPayment({
                    potId,
                    slotId,
                    monthIndex,
                    type: "cash",
                    remarks: "Cash payment pending approval",
                });
                feedback.toast.success("Cash payment submitted");
                onClose();
            } catch (err) {
                console.error(err);
                setError("Failed to submit request.");
                setIsUploading(false);
            }
        }
    };

    return (
        <ModalShell
            zIndex={150}
            overlayClassName="bg-black/60 backdrop-blur-sm shadow-2xl animate-in fade-in duration-200"
            className="rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        >
            <ModalHeader>
                <ModalCloseButton onClick={onClose}>
                    <X size={20} />
                </ModalCloseButton>
                <h3 className="text-xl font-bold mb-1">Make payment</h3>
                <p className="text-[var(--text-muted)] text-sm">
                    Cycle {monthIndex + 1} •{" "}
                    <span className="text-[var(--accent-vivid)] font-mono">
                        {formatCurrency(amount, currency)}
                    </span>
                </p>
            </ModalHeader>

            <ModalBody>
                {!paymentType ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setPaymentType("online")}
                            className="bg-[var(--surface-deep)] hover:bg-[var(--accent-vivid)]/10 border border-[var(--border-subtle)] hover:border-[var(--accent-vivid)] p-6 rounded-xl flex flex-col items-center gap-3 transition-all group"
                        >
                            <Smartphone className="text-[var(--text-muted)] group-hover:text-[var(--accent-vivid)]" size={32} />
                            <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)]">Online</span>
                        </button>
                        <button
                            onClick={() => setPaymentType("cash")}
                            className="bg-[var(--surface-deep)] hover:bg-[var(--warning)]/10 border border-[var(--border-subtle)] hover:border-[var(--warning)] p-6 rounded-xl flex flex-col items-center gap-3 transition-all group"
                        >
                            <Banknote className="text-[var(--text-muted)] group-hover:text-[var(--warning)]" size={32} />
                            <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)]">Cash</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setPaymentType(null)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 pl-0">
                            ← Back
                        </Button>

                        {paymentType === "online" ? (
                            <form onSubmit={handleOnlineSubmit} className="space-y-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? "border-[var(--accent-vivid)]/50 bg-[var(--accent-vivid)]/5" : "border-[var(--border-subtle)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-deep)]/60"
                                        }`}
                                >
                                    {file ? (
                                        <>
                                            <ImageIcon className="text-[var(--accent-vivid)] mb-2" size={32} />
                                            <span className="text-sm font-mono text-[var(--text-primary)] truncate max-w-full">{file.name}</span>
                                            <span className="text-xs text-[var(--text-muted)] mt-1">Click to change</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="text-[var(--text-muted)] mb-2" size={32} />
                                            <span className="text-sm text-[var(--text-muted)]">Tap to upload screenshot</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {error && <p className="text-[var(--danger)] text-sm text-center">{error}</p>}

                                <ModalFooter className="pt-4 pb-2 mt-4 flex items-center justify-center">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        disabled={isUploading || !file}
                                    >
                                        {isUploading ? "Uploading..." : "Submit proof"}
                                    </Button>
                                </ModalFooter>
                            </form>
                        ) : (

                            <div className="text-center">
                                {
                                    isForeman ? (
                                        <div className="mb-6 text-left" >
                                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Payment Date</label>
                                            <DatePicker
                                                value={paymentDate}
                                                onChange={setPaymentDate}
                                                className="bg-[var(--surface-deep)]/60"
                                            />
                                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                                Record the actual date this payment was received.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-[var(--warning)]/15 p-5 rounded-xl mb-6 border border-[var(--warning)]/30 backdrop-blur-sm">
                                            <p className="text-[var(--text-primary)] font-medium text-sm leading-relaxed">
                                                Please confirm that you have handed cash to the organizer. The organizer will need to approve this request.
                                            </p>
                                        </div>
                                    )}
                                <ModalFooter className="pt-4 pb-2 mt-4 flex items-center justify-center">
                                    <Button
                                        variant={isForeman ? "primary" : "danger"}
                                        size="lg"
                                        fullWidth
                                        onClick={handleCashSubmit}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? "Processing..." : (isForeman ? "Record received" : "Confirm cash payment")}
                                    </Button>
                                </ModalFooter>
                            </div>
                        )}
                    </>
                )
                }
            </ModalBody>
        </ModalShell>
    );
}

interface PaymentStatusCardProps {
    status: "UNPAID" | "PENDING" | "PAID";
    amount: number;
    monthIndex: number;
    onPay: () => void;
    currency?: string;
}

export function PaymentStatusCard({ status, amount, monthIndex, onPay, currency }: PaymentStatusCardProps) {
    const statusConfig = {
        UNPAID: { color: "text-[var(--danger)]", bg: "bg-[var(--danger)]/10", border: "border-[var(--danger)]/20", icon: AlertCircle, label: "Unpaid" },
        PENDING: { color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10", border: "border-[var(--warning)]/20", icon: Clock, label: "Pending Approval" },
        PAID: { color: "text-[var(--accent-vivid)]", bg: "bg-[var(--accent-vivid)]/10", border: "border-[var(--accent-vivid)]/20", icon: CheckCircle, label: "Paid" },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={`rounded-xl p-4 border ${config.border} ${config.bg} flex items-center justify-between`}>
            <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Cycle {monthIndex + 1} Payment</div>
                <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">{formatCurrency(amount, currency)}</div>
            </div>

            <div className="text-right">
                <div className={`flex items-center gap-1.5 ${config.color} font-bold mb-2 justify-end`}>
                    <Icon size={16} /> {config.label}
                </div>
                {status === "UNPAID" && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onPay}
                    >
                        Mark as Paid
                    </Button>
                )}
            </div>
        </div>
    );
}
