import { useEffect, useRef, useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Clock, FileText, Loader2, LogOut, Mail, Save, ShieldCheck, Smartphone, Upload, X } from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { getThemePreference, getThemeVariant, setThemePreference, setThemeVariant, type ThemePreference, type ThemeVariant } from "@/lib/theme";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PageShell } from "@/components/layout/PageShell";
import { Surface } from "@/components/ui/Surface";

import { api } from "../../convex/_generated/api";



export function Settings() {
    const user = useQuery(api.users.current);
    const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
    const requestVerification = useMutation(api.verification.submit);
    const updateProfile = useMutation(api.users.updateProfile);
    const { signOut } = useClerk();
    const { user: clerkUser } = useUser();
    const feedback = useFeedback();

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [idType, setIdType] = useState("Aadhaar");
    const [idNumber, setIdNumber] = useState("");
    const [error, setError] = useState("");
    const [themePref, setThemePref] = useState<ThemePreference>(() => getThemePreference());
    const [themeVariant, setThemeVariantState] = useState<ThemeVariant>(() => getThemeVariant());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    useEffect(() => {
        if (user && !isEditingProfile) {
            setEditName(user.name || "");
            setEditPhone(user.phone || "");
        }
    }, [user, isEditingProfile]);

    if (!user) return <div className="min-h-dvh grid place-items-center"><Loader2 className="animate-spin text-[var(--accent-vivid)]" /></div>;

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

    const handleIdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !idNumber) {
            setError("Please provide ID Document and Number");
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

            await requestVerification({
                storageId,
                idType,
                idNumber
            });

            setFile(null);
            setIsUploading(false);
            feedback.toast.success("Verification Submitted", "Your ID has been sent for review.");
        } catch (err) {
            console.error(err);
            setError("Failed to verify. Please try again.");
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim()) {
            feedback.toast.error("Invalid Name", "Name cannot be empty.");
            return;
        }
        if (!editPhone || !isValidPhoneNumber(editPhone)) {
            feedback.toast.error("Invalid Phone", "Please enter a valid phone number with country code.");
            return;
        }

        setIsSavingProfile(true);
        try {
            await updateProfile({
                name: editName.trim(),
                phone: editPhone
            });
            feedback.toast.success("Profile Updated", "Your information has been saved successfully.");
            setIsEditingProfile(false);
        } catch (err) {
            console.error(err);
            feedback.toast.error("Update Failed", "Could not save your profile changes.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const statusConfig = {
        UNVERIFIED: { color: "text-[var(--text-muted)]", bg: "bg-[var(--surface-deep)]/60", border: "border-[var(--border-subtle)]", icon: AlertCircle, label: "Unverified" },
        PENDING: { color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10", border: "border-[var(--warning)]/20", icon: Clock, label: "Verification pending" },
        VERIFIED: { color: "text-[var(--success)]", bg: "bg-[var(--accent-vivid)]/10", border: "border-[var(--accent-vivid)]/20", icon: ShieldCheck, label: "Identity verified" },
        REJECTED: { color: "text-[var(--danger)]", bg: "bg-[var(--danger)]/10", border: "border-[var(--danger)]/20", icon: X, label: "Verification rejected" },
    };

    const status = (user.verificationStatus as keyof typeof statusConfig) || "UNVERIFIED";
    const config = statusConfig[status];
    const Icon = config.icon;
    const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "there";

    return (
        <PageShell
            maxWidth="xl"
            sidebar={<AppSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} showAdmin={firstName === "Admin"} />}
            title="Settings"
            subtitle="Manage your identity, preferences, and account details."
        >
            <div className="w-full max-w-5xl space-y-8 animate-in fade-in duration-500">

                {/* Profile Info Card */}
                <Surface tier={2} className="rounded-2xl p-6 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <img src={user.pictureUrl} alt={user.name} className="w-20 h-20 rounded-full border-2 border-[var(--border-subtle)]" />

                        <div className="flex-1 w-full text-center sm:text-left">
                            {isEditingProfile ? (
                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-1">Full Name</label>
                                        <Input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="bg-[var(--surface-card)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-1">Phone Number</label>
                                        <PhoneInputField
                                            value={editPhone}
                                            onChange={setEditPhone}
                                        />
                                        <p className="text-xs text-[var(--text-muted)] mt-1">Preferably a WhatsApp-linked number for easy contact.</p>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <Button type="submit" disabled={isSavingProfile} className="gap-2">
                                            <Save size={16} /> {isSavingProfile ? "Saving..." : "Save Changes"}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                                        {user.name}
                                        {status === "VERIFIED" && <ShieldCheck className="text-[var(--accent-vivid)]" size={24} fill="var(--surface-elevated)" />}
                                    </h2>
                                    <div className="flex flex-col gap-2 mt-3 text-sm text-[var(--text-muted)] items-center sm:items-start">
                                        <span className="flex items-center gap-2"><Mail size={16} /> {user.email}</span>
                                        {user.phone ? (
                                            <span className="flex items-center gap-2"><Smartphone size={16} /> {user.phone}</span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-[var(--warning)] italic">
                                                <AlertCircle size={16} /> Missing phone number
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {!isEditingProfile && (
                        <Button
                            onClick={() => setIsEditingProfile(true)}
                            variant="secondary"
                            className="mt-6 w-full sm:w-auto sm:absolute top-6 right-6 text-sm"
                        >
                            Edit Profile
                        </Button>
                    )}
                </Surface>

                {/* Verification Section */}
                {(status === "UNVERIFIED" || status === "REJECTED") && (
                    <Surface tier={2} className="rounded-2xl p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="text-[var(--accent-vivid)]" /> Verify Identity
                            </h3>
                            <div className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1.5 ${config.bg} ${config.border} ${config.color}`}>
                                <Icon size={14} />
                                <span className="font-bold">{config.label}</span>
                            </div>
                        </div>

                        <p className="text-[var(--text-muted)] mb-6 text-sm">
                            To join higher-value pots and build trust with organizers, please upload a government ID (Aadhaar, PAN, or Driving License).
                        </p>

                        {status === "REJECTED" && user.adminNotes && (
                            <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 p-4 rounded-xl mb-6 text-[var(--danger)] text-sm">
                                <strong>Reason for rejection:</strong> {user.adminNotes}
                            </div>
                        )}

                        <form onSubmit={handleIdSubmit} className="space-y-5 flex-1 w-full max-w-lg">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-2">ID Type</label>
                                    <Select value={idType} onValueChange={setIdType}>
                                        <SelectTrigger className="bg-[var(--surface-card)]">
                                            <SelectValue placeholder="Select ID type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                                            <SelectItem value="PAN">PAN Card</SelectItem>
                                            <SelectItem value="Driving License">Driving License</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-2">ID Number</label>
                                    <Input
                                        type="text"
                                        value={idNumber}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (idType === "Aadhaar") {
                                                val = val.replace(/\D/g, "").slice(0, 12);
                                            } else if (idType === "PAN") {
                                                val = val.toUpperCase().slice(0, 10);
                                            }
                                            setIdNumber(val);
                                        }}
                                        placeholder={idType === "Aadhaar" ? "xxxx xxxx xxxx" : "ABCDE1234F"}
                                        className="bg-[var(--surface-card)]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-2">Upload Document</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? "border-[var(--accent-vivid)]/50 bg-[var(--accent-vivid)]/5" : "border-[var(--border-subtle)] hover:border-[var(--accent-vivid)]/50 hover:bg-[var(--surface-deep)]/30"
                                        }`}
                                >
                                    {file ? (
                                        <>
                                            <FileText className="text-[var(--accent-vivid)] mb-2" size={32} />
                                            <span className="text-sm font-mono text-[var(--text-primary)] truncate max-w-full text-center px-4">{file.name}</span>
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
                                className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isUploading ? "Uploading..." : "Submit for Verification"}
                            </button>
                        </form>
                    </Surface>
                )}

                {status === "PENDING" && (
                    <Surface tier={2} className="rounded-2xl p-8 sm:p-12 text-center">
                        <div className="w-16 h-16 bg-[var(--warning)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} className="text-[var(--warning)]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Verification in progress</h3>
                        <p className="text-[var(--text-muted)] max-w-md mx-auto text-sm">
                            Your documents have been submitted and are under review. This usually takes 24-48 hours.
                        </p>
                    </Surface>
                )}

                {/* Appearance Section */}
                <Surface tier={2} className="rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-2">Appearance</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">Choose how UniGro looks on this device.</p>
                    <div className="mb-6">
                        <p className="text-xs uppercase font-semibold text-[var(--text-muted)] mb-2">Mode</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: "system", label: "System Default" },
                                { id: "dark", label: "Dark Mode" },
                                { id: "light", label: "Light Mode" },
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
                    </div>
                    <div>
                        <p className="text-xs uppercase font-semibold text-[var(--text-muted)] mb-2">Theme variant</p>
                        <div className="max-w-sm">
                            <Select
                                value={themeVariant}
                                onValueChange={(val) => {
                                    const next = val as ThemeVariant;
                                    setThemeVariantState(next);
                                    setThemeVariant(next);
                                }}
                            >
                                <SelectTrigger className="bg-[var(--surface-card)]">
                                    <SelectValue placeholder="Select a variant" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Earthy Glass</span>
                                            <span className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#2B6E57" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#B8834F" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#F6F5F2" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#1D2622" }} />
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ocean">
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Ocean Ledger</span>
                                            <span className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#1F6AA5" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#E07A5F" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#F1F4F7" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#1E2933" }} />
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="clay">
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Clay Studio</span>
                                            <span className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#7A4E2F" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#C46B4E" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#F7F1EA" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#2A211B" }} />
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="dusk">
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Dusk Violet</span>
                                            <span className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#6A4DA3" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#E2836A" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#F4EEF6" }} />
                                                <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: "#2A1F33" }} />
                                            </span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                                Variants update the color palette across the app.
                            </p>
                        </div>
                    </div>
                </Surface>

                <div className="pt-6 flex justify-center pb-12">
                    <Button
                        variant="ghost"
                        onClick={() => signOut()}
                        className="text-[var(--danger)] hover:bg-[var(--danger)]/10 px-6"
                    >
                        <LogOut size={18} /> Sign Out
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
