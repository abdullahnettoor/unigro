import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, ShieldCheck, Upload, X } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { ModalCloseButton, ModalFooter, ModalHeader, ModalShell } from "@/components/ui/ModalShell";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

import { api } from "../../../convex/_generated/api";

interface VerificationModalProps {
    onClose: () => void;
}

export function VerificationModal({ onClose }: VerificationModalProps) {
    const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
    const submitVerification = useMutation(api.verification.submit);

    const user = useQuery(api.users.current);

    const [file, setFile] = useState<File | null>(null);
    const [idType, setIdType] = useState("Aadhaar");
    const [idNumber, setIdNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a document to upload.");
            return;
        }
        if (!idNumber.trim()) {
            setError("Please enter your ID Number.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1. Get Upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload File
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();

            // 3. Submit for Verification
            await submitVerification({
                storageId,
                idType,
                idNumber
            });

            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to upload document. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell zIndex={100}>
            <ModalHeader>
                <ModalCloseButton onClick={onClose}>
                    <X size={24} />
                </ModalCloseButton>

                <div className="text-center">
                    <div className="w-16 h-16 bg-[var(--accent-vivid)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--accent-vivid)]/20">
                        <ShieldCheck size={32} className="text-[var(--accent-vivid)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Verify your identity</h2>
                    <p className="text-[var(--text-muted)] text-sm">
                        Upload your government ID for trust verification.
                    </p>
                    {user?.adminNotes && user.verificationStatus === "REJECTED" && (
                        <div className="mt-4 bg-[var(--danger)]/10 border border-[var(--danger)]/20 p-3 rounded-lg text-sm text-[var(--danger)]">
                            <strong>Reason for rejection:</strong> {user.adminNotes}
                        </div>
                    )}
                </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* ID Type Selection */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Document Type</label>
                        <Select value={idType} onValueChange={setIdType}>
                            <SelectTrigger className="bg-[var(--surface-deep)]/60">
                                <SelectValue placeholder="Document type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                                <SelectItem value="PAN">PAN Card</SelectItem>
                                <SelectItem value="Passport">Passport</SelectItem>
                                <SelectItem value="Driving License">Driving License</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ID Number Input */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">ID Number</label>
                        <Input
                            type="text"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="bg-[var(--surface-deep)]/60"
                            placeholder={idType === "Aadhaar" ? "xxxx-xxxx-xxxx" : "Enter ID Number"}
                        />
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-6 text-center cursor-pointer hover:border-[var(--accent-vivid)]/50 hover:bg-[var(--surface-deep)]/60 transition-all"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,.pdf"
                        />

                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold px-3 py-1 rounded-full text-xs mb-2">
                                    File Selected
                                </div>
                                <p className="text-[var(--text-primary)] font-medium truncate max-w-full text-sm">{file.name}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-[var(--text-muted)]">
                                <Upload size={24} className="mb-2" />
                                <p className="text-sm font-bold">Upload document image</p>
                                <p className="text-[10px] mt-1">JPG, PNG, PDF</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-[var(--danger)] text-sm bg-[var(--danger)]/10 p-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <ModalFooter>
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Uploading..." : "Submit for verification"}
                        </button>
                    </ModalFooter>
                </form>
            </ModalShell>
    );
}
