import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, X, ShieldCheck, AlertCircle } from "lucide-react";

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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#232931] border border-white/10 rounded-2xl p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[#C1FF72]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C1FF72]/20">
                        <ShieldCheck size={32} className="text-[#C1FF72]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h2>
                    <p className="text-gray-400 text-sm">
                        Upload your Government ID for trust verification.
                    </p>
                    {user?.adminNotes && user.verificationStatus === "REJECTED" && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm text-red-200">
                            <strong>Reason for Rejection:</strong> {user.adminNotes}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ID Type Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Document Type</label>
                        <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#C1FF72]/50"
                        >
                            <option value="Aadhaar">Aadhaar Card</option>
                            <option value="PAN">PAN Card</option>
                            <option value="Passport">Passport</option>
                            <option value="Driving License">Driving License</option>
                        </select>
                    </div>

                    {/* ID Number Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">ID Number</label>
                        <input
                            type="text"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#C1FF72]/50"
                            placeholder={idType === "Aadhaar" ? "xxxx-xxxx-xxxx" : "Enter ID Number"}
                        />
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#C1FF72]/50 hover:bg-white/5 transition-all"
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
                                <div className="bg-[#C1FF72] text-[#1B3022] font-bold px-3 py-1 rounded-full text-xs mb-2">
                                    File Selected
                                </div>
                                <p className="text-white font-medium truncate max-w-full text-sm">{file.name}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <Upload size={24} className="mb-2" />
                                <p className="text-sm font-bold">Upload Document Image</p>
                                <p className="text-[10px] mt-1">JPG, PNG, PDF</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-400/10 p-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !file}
                        className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Uploading..." : "Submit for Verification"}
                    </button>
                </form>
            </div>
        </div>
    );
}
