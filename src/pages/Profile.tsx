import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, AlertCircle, Clock, ShieldCheck, FileText, Smartphone, Mail, X, Loader2 } from "lucide-react";

export function Profile() {
    const user = useQuery(api.users.current);
    const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
    const requestVerification = useMutation(api.verification.submit);

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [idType, setIdType] = useState("Aadhaar");
    const [idNumber, setIdNumber] = useState("");
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-[#C1FF72]" /></div>;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5MB");
                return;
            }
            setFile(selected);
            setError("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !idNumber) {
            setError("Please provide ID Document and Number");
            return;
        }

        setIsUploading(true);
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

            // 3. Submit Verification Request
            await requestVerification({
                storageId,
                idType,
                idNumber
            });

            setFile(null);
            setIsUploading(false);
        } catch (err) {
            console.error(err);
            setError("Failed to verify. Please try again.");
            setIsUploading(false);
        }
    };

    const statusConfig = {
        UNVERIFIED: { color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20", icon: AlertCircle, label: "Unverified" },
        PENDING: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", icon: Clock, label: "Verification Pending" },
        VERIFIED: { color: "text-[#C1FF72]", bg: "bg-[#C1FF72]/10", border: "border-[#C1FF72]/20", icon: ShieldCheck, label: "Verified Identity" },
        REJECTED: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", icon: X, label: "Verification Rejected" },
    };

    const status = (user.verificationStatus as keyof typeof statusConfig) || "UNVERIFIED";
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-display font-bold mb-2">My Profile</h1>
            <p className="text-gray-400 mb-8">Manage your identity and trust settings.</p>

            {/* Profile Header */}
            <div className="bg-[#232931]/50 border border-white/5 rounded-2xl p-6 mb-8 flex items-center gap-6">
                <img src={user.pictureUrl} alt={user.name} className="w-20 h-20 rounded-full border-2 border-white/10" />
                <div className="flex-1">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {user.name}
                        {status === "VERIFIED" && <ShieldCheck className="text-[#C1FF72]" size={20} />}
                    </h2>
                    <div className="flex gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                        {user.phone && <span className="flex items-center gap-1"><Smartphone size={14} /> {user.phone}</span>}
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${config.bg} ${config.border} ${config.color}`}>
                    <Icon size={18} />
                    <span className="font-bold text-sm">{config.label}</span>
                </div>
            </div>

            {/* Verification Section */}
            {(status === "UNVERIFIED" || status === "REJECTED") && (
                <section className="bg-[#232931] border border-white/5 rounded-2xl p-8">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-[#C1FF72]" /> Verify Identity
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-xl">
                        To join higher-value pots and build trust with Foremen, please upload a Government ID (Aadhaar, PAN, or Driving License).
                    </p>

                    {status === "REJECTED" && user.adminNotes && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6 text-red-300 text-sm">
                            <strong>Reason for Rejection:</strong> {user.adminNotes}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-2">ID Type</label>
                                <select
                                    value={idType}
                                    onChange={(e) => setIdType(e.target.value)}
                                    className="w-full bg-[#1a1f26] border border-white/10 rounded-xl p-3 text-white focus:border-[#C1FF72] outline-none"
                                >
                                    <option value="Aadhaar">Aadhaar Card</option>
                                    <option value="PAN">PAN Card</option>
                                    <option value="Driving License">Driving License</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-2">ID Number</label>
                                <input
                                    type="text"
                                    value={idNumber}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (idType === "Aadhaar") {
                                            val = val.replace(/\D/g, '').slice(0, 12);
                                        } else if (idType === "PAN") {
                                            val = val.toUpperCase().slice(0, 10);
                                        }
                                        setIdNumber(val);
                                    }}
                                    placeholder={idType === "Aadhaar" ? "123412341234" : "ABCDE1234F"}
                                    className="w-full bg-[#1a1f26] border border-white/10 rounded-xl p-3 text-white focus:border-[#C1FF72] outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Upload Document</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? "border-[#C1FF72]/50 bg-[#C1FF72]/5" : "border-gray-600 hover:border-gray-500 hover:bg-white/5"
                                    }`}
                            >
                                {file ? (
                                    <>
                                        <FileText className="text-[#C1FF72] mb-2" size={32} />
                                        <span className="text-sm font-mono text-white truncate max-w-full">{file.name}</span>
                                        <span className="text-xs text-gray-400 mt-1">Click to change</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="text-gray-400 mb-2" size={32} />
                                        <span className="text-sm text-gray-400">Tap to upload ID photo</span>
                                        <span className="text-xs text-gray-500 mt-1">Max 5MB</span>
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
                        </div>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={isUploading}
                            className="w-full bg-[#C1FF72] text-[#1B3022] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isUploading ? "Uploading..." : "Submit for Verification"}
                        </button>
                    </form>
                </section>
            )}

            {status === "PENDING" && (
                <div className="bg-[#232931] border border-white/5 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={32} className="text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Verification in Progress</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Your documents have been submitted and are under review. This usually takes 24-48 hours.
                    </p>
                </div>
            )}
        </div>
    );
}
