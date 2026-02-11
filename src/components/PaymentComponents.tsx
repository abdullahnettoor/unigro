import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Upload, CheckCircle, Clock, AlertCircle, X, Image as ImageIcon, Banknote, Smartphone } from "lucide-react";

interface PaymentModalProps {
    potId: Id<"pots">;
    monthIndex: number;
    onClose: () => void;
}

export function PaymentModal({ potId, monthIndex, onClose }: PaymentModalProps) {
    const generateUploadUrl = useMutation(api.transactions.generateUploadUrl);
    const submitPayment = useMutation(api.transactions.submitPayment);

    const [paymentType, setPaymentType] = useState<"cash" | "online" | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
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
        if (confirm("Confirm that you have paid cash to the Foreman?")) {
            setIsUploading(true);
            try {
                await submitPayment({
                    potId,
                    monthIndex,
                    type: "cash",
                    remarks: "Cash payment pending approval",
                });
                onClose();
            } catch (err) {
                console.error(err);
                setError("Failed to submit request.");
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#232931] border border-white/10 rounded-2xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold mb-1">Make Payment</h3>
                <p className="text-gray-400 text-sm mb-6">Month {monthIndex + 1}</p>

                {!paymentType ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setPaymentType("online")}
                            className="bg-[#2a3038] hover:bg-[#C1FF72]/10 border border-white/5 hover:border-[#C1FF72] p-6 rounded-xl flex flex-col items-center gap-3 transition-all group"
                        >
                            <Smartphone className="text-gray-400 group-hover:text-[#C1FF72]" size={32} />
                            <span className="font-bold text-gray-200 group-hover:text-white">Online</span>
                        </button>
                        <button
                            onClick={() => setPaymentType("cash")}
                            className="bg-[#2a3038] hover:bg-yellow-500/10 border border-white/5 hover:border-yellow-500 p-6 rounded-xl flex flex-col items-center gap-3 transition-all group"
                        >
                            <Banknote className="text-gray-400 group-hover:text-yellow-500" size={32} />
                            <span className="font-bold text-gray-200 group-hover:text-white">Cash</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <button onClick={() => setPaymentType(null)} className="text-sm text-gray-500 hover:text-white mb-4 flex items-center gap-1">
                            ← Back
                        </button>

                        {paymentType === "online" ? (
                            <form onSubmit={handleOnlineSubmit} className="space-y-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? "border-[#C1FF72]/50 bg-[#C1FF72]/5" : "border-gray-600 hover:border-gray-500 hover:bg-white/5"
                                        }`}
                                >
                                    {file ? (
                                        <>
                                            <ImageIcon className="text-[#C1FF72] mb-2" size={32} />
                                            <span className="text-sm font-mono text-white truncate max-w-full">{file.name}</span>
                                            <span className="text-xs text-gray-400 mt-1">Click to change</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="text-gray-400 mb-2" size={32} />
                                            <span className="text-sm text-gray-400">Tap to upload screenshot</span>
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

                                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={isUploading || !file}
                                    className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? "Uploading..." : "Submit Proof"}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center">
                                <div className="bg-yellow-500/10 p-4 rounded-xl mb-6 border border-yellow-500/20">
                                    <p className="text-yellow-200 text-sm">
                                        Please confirm that you have handed strictly cash to the Foreman. The Foreman will need to approve this request.
                                    </p>
                                </div>
                                <button
                                    onClick={handleCashSubmit}
                                    disabled={isUploading}
                                    className="w-full bg-yellow-500 text-[#1B3022] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isUploading ? "Processing..." : "Confirm Cash Payment"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

interface PaymentStatusCardProps {
    status: "UNPAID" | "PENDING" | "PAID";
    amount: number;
    monthIndex: number;
    onPay: () => void;
}

export function PaymentStatusCard({ status, amount, monthIndex, onPay }: PaymentStatusCardProps) {
    const statusConfig = {
        UNPAID: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", icon: AlertCircle, label: "Unpaid" },
        PENDING: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", icon: Clock, label: "Pending Approval" },
        PAID: { color: "text-[#C1FF72]", bg: "bg-[#C1FF72]/10", border: "border-[#C1FF72]/20", icon: CheckCircle, label: "Paid" },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={`rounded-xl p-4 border ${config.border} ${config.bg} flex items-center justify-between`}>
            <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Month {monthIndex + 1} Payment</div>
                <div className="text-2xl font-mono font-bold text-white">₹{amount.toLocaleString()}</div>
            </div>

            <div className="text-right">
                <div className={`flex items-center gap-1.5 ${config.color} font-bold mb-2 justify-end`}>
                    <Icon size={16} /> {config.label}
                </div>
                {status === "UNPAID" && (
                    <button
                        onClick={onPay}
                        className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Mark as Paid
                    </button>
                )}
            </div>
        </div>
    );
}
