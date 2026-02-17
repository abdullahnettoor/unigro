import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, AlertCircle, Clock, ShieldCheck, FileText, Smartphone, Mail, X, Loader2 } from "lucide-react";
import { getThemePreference, setThemePreference, type ThemePreference } from "../lib/theme";

export function Profile() {
    const user = useQuery(api.users.current);
    const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
    const requestVerification = useMutation(api.verification.submit);

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [idType, setIdType] = useState("Aadhaar");
    const [idNumber, setIdNumber] = useState("");
    const [error, setError] = useState("");
    const [themePref, setThemePref] = useState<ThemePreference>(() => getThemePreference());
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-[var(--accent-vivid)]" /></div>;

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
        UNVERIFIED: { color: "text-[var(--text-muted)]", bg: "bg-[var(--surface-deep)]/60", border: "border-[var(--border-subtle)]", icon: AlertCircle, label: "Unverified" },
        PENDING: { color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10", border: "border-[var(--warning)]/20", icon: Clock, label: "Verification Pending" },
        VERIFIED: { color: "text-[var(--success)]", bg: "bg-[var(--accent-vivid)]/10", border: "border-[var(--accent-vivid)]/20", icon: ShieldCheck, label: "Verified Identity" },
        REJECTED: { color: "text-[var(--danger)]", bg: "bg-[var(--danger)]/10", border: "border-[var(--danger)]/20", icon: X, label: "Verification Rejected" },
    };

    const status = (user.verificationStatus as keyof typeof statusConfig) || "UNVERIFIED";
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-display font-bold mb-2">My Profile</h1>
            <p className="text-[var(--text-muted)] mb-8">Manage your identity and trust settings.</p>

            {/* Profile Header */}
            <div className="bg-[var(--surface-elevated)]/50 border border-[var(--border-subtle)] rounded-2xl p-6 mb-6 flex items-center gap-6">
                <img src={user.pictureUrl} alt={user.name} className="w-20 h-20 rounded-full border-2 border-[var(--border-subtle)]" />
                <div className="flex-1">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {user.name}
                        {status === "VERIFIED" && <ShieldCheck className="text-[var(--accent-vivid)]" size={20} />}
                    </h2>
                    <div className="flex gap-4 mt-2 text-sm text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                        {user.phone && <span className="flex items-center gap-1"><Smartphone size={14} /> {user.phone}</span>}
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${config.bg} ${config.border} ${config.color}`}>
                    <Icon size={18} />
                    <span className="font-bold text-sm">{config.label}</span>
                </div>
            </div>

            <section className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-bold mb-2">Appearance</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">Choose how GrowPot looks on this device.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { id: "system", label: "System Default" },
                        { id: "dark", label: "Dark" },
                        { id: "light", label: "Light" },
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => {
                                const next = opt.id as ThemePreference;
                                setThemePref(next);
                                setThemePreference(next);
                            }}
                            aria-pressed={themePref === opt.id}
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${themePref === opt.id
                                ? "border-[var(--accent-vivid)]/40 bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]"
                                : "border-[var(--border-subtle)] bg-[var(--surface-deep)]/40 text-[var(--text-primary)] hover:bg-[var(--surface-deep)]"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Verification Section */}
            {(status === "UNVERIFIED" || status === "REJECTED") && (
                <section className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-8">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-[var(--accent-vivid)]" /> Verify Identity
                    </h3>
                    <p className="text-[var(--text-muted)] mb-6 max-w-xl">
                        To join higher-value pots and build trust with Foremen, please upload a Government ID (Aadhaar, PAN, or Driving License).
                    </p>

                    {status === "REJECTED" && user.adminNotes && (
                        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 p-4 rounded-xl mb-6 text-[var(--danger)] text-sm">
                            <strong>Reason for Rejection:</strong> {user.adminNotes}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-2">ID Type</label>
                                <select
                                    value={idType}
                                    onChange={(e) => setIdType(e.target.value)}
                                    className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-3 text-[var(--text-primary)] focus:border-[var(--accent-vivid)] outline-none"
                                >
                                    <option value="Aadhaar">Aadhaar Card</option>
                                    <option value="PAN">PAN Card</option>
                                    <option value="Driving License">Driving License</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-2">ID Number</label>
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
                                    className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-3 text-[var(--text-primary)] focus:border-[var(--accent-vivid)] outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-2">Upload Document</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? "border-[var(--accent-vivid)]/50 bg-[var(--accent-vivid)]/5" : "border-[var(--border-subtle)] hover:border-[var(--accent-vivid)]/50 hover:bg-[var(--surface-deep)]/30"
                                    }`}
                            >
                                {file ? (
                                    <>
                                        <FileText className="text-[var(--accent-vivid)] mb-2" size={32} />
                                        <span className="text-sm font-mono text-[var(--text-primary)] truncate max-w-full">{file.name}</span>
                                        <span className="text-xs text-[var(--text-muted)] mt-1">Click to change</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="text-[var(--text-muted)] mb-2" size={32} />
                                        <span className="text-sm text-[var(--text-muted)]">Tap to upload ID photo</span>
                                        <span className="text-xs text-[var(--text-muted)] mt-1">Max 5MB</span>
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

                        {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={isUploading}
                        className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                            {isUploading ? "Uploading..." : "Submit for Verification"}
                        </button>
                    </form>
                </section>
            )}

            {status === "PENDING" && (
                <div className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-[var(--warning)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={32} className="text-[var(--warning)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Verification in Progress</h3>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto">
                        Your documents have been submitted and are under review. This usually takes 24-48 hours.
                    </p>
                </div>
            )}
        </div>
    );
}
