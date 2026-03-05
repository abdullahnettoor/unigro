import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
    AlertCircle,
    Bell,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    FileText,
    Heart,
    Info,
    LogOut,
    Mail,
    RefreshCw,
    Save,
    Shield,
    ShieldCheck,
    Smartphone,
    Upload,
    X,
} from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LogoLoader } from "@/components/ui/LogoLoader";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Surface } from "@/components/ui/Surface";
import { getThemePreference, getThemeVariant, setThemePreference, setThemeVariant, type ThemePreference, type ThemeVariant } from "@/lib/theme";

import { api } from "../../convex/_generated/api";

const APP_VERSION = "0.0.0";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type IOSNavigator = Navigator & { standalone?: boolean };

// ── Reusable row components ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {children}
        </p>
    );
}

function SettingRow({
    icon: Icon,
    label,
    description,
    end,
    onClick,
    danger,
}: {
    icon: React.ElementType;
    label: string;
    description?: string;
    end?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
}) {
    const Tag = onClick ? "button" : "div";
    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={`flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors ${onClick ? "hover:bg-[var(--surface-deep)]/40 active:bg-[var(--surface-deep)]/60" : ""
                } ${danger ? "text-[var(--danger)]" : ""}`}
        >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${danger ? "bg-[var(--danger)]/10 text-[var(--danger)]" : "bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]"}`}>
                <Icon size={17} />
            </span>
            <span className="flex-1 min-w-0">
                <span className={`block text-sm font-semibold ${danger ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}>
                    {label}
                </span>
                {description && (
                    <span className="block text-xs text-[var(--text-muted)] mt-0.5 leading-snug">{description}</span>
                )}
            </span>
            {end ?? (onClick && !danger ? <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" /> : null)}
        </Tag>
    );
}

function Divider() {
    return <div className="mx-4 h-px bg-[var(--border-subtle)]" />;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Settings() {
    const user = useQuery(api.users.current);
    const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
    const requestVerification = useMutation(api.verification.submit);
    const updateProfile = useMutation(api.users.updateProfile);
    const { signOut } = useClerk();
    const feedback = useFeedback();
    const { t } = useTranslation();

    // ── PWA state ──
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as IOSNavigator).standalone === true;

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    // ── Verification state ──
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [idType, setIdType] = useState("Aadhaar");
    const [idNumber, setIdNumber] = useState("");
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Theme state ──
    const [themePref, setThemePref] = useState<ThemePreference>(() => getThemePreference());
    const [themeVariant, setThemeVariantState] = useState<ThemeVariant>(() => getThemeVariant());

    // ── Profile edit state ──
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

    if (!user) return <div className="min-h-dvh grid place-items-center"><LogoLoader size="lg" /></div>;

    // ── Handlers ──
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) { setError("File size must be less than 5MB"); return; }
            setFile(selected);
            setError("");
        }
    };

    const handleIdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !idNumber) { setError("Please provide ID Document and Number"); return; }
        setIsUploading(true);
        setError("");
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();
            await requestVerification({ storageId, idType, idNumber });
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
        if (!editName.trim()) { feedback.toast.error("Invalid Name", "Name cannot be empty."); return; }
        if (!editPhone || !isValidPhoneNumber(editPhone)) { feedback.toast.error("Invalid Phone", "Please enter a valid phone number with country code."); return; }
        setIsSavingProfile(true);
        try {
            await updateProfile({ name: editName.trim(), phone: editPhone });
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
    const StatusIcon = config.icon;

    // ── PWA display logic ──
    const canInstall = !isStandalone && (Boolean(deferredPrompt) || isIOS);
    const showPwaRow = canInstall || isStandalone; // always show something app-related

    // ── Member since ──
    const memberSince = user._creationTime
        ? new Date(user._creationTime).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        : null;

    return (
        <PageShell maxWidth="xl" title={t("settings.title")} subtitle={t("settings.subtitle")}>
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-500">

                {/* ── PROFILE SECTION ── */}
                <section>
                    <SectionLabel>Profile</SectionLabel>
                    <Surface tier={2} className="rounded-2xl overflow-hidden">
                        {/* Avatar + Info */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 relative">
                            <div className="relative shrink-0">
                                <img
                                    src={user.pictureUrl}
                                    alt={user.name}
                                    className="w-20 h-20 rounded-full border-2 border-[var(--border-subtle)] object-cover"
                                />
                                {status === "VERIFIED" && (
                                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success)] shadow-md">
                                        <ShieldCheck size={13} className="text-white" />
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 w-full text-center sm:text-left">
                                {isEditingProfile ? (
                                    <form onSubmit={handleSaveProfile} className="space-y-4">
                                        <div>
                                            <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-1">Full Name</label>
                                            <Input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-1">Phone Number</label>
                                            <PhoneInputField value={editPhone} onChange={setEditPhone} />
                                            <p className="text-xs text-[var(--text-muted)] mt-1">Preferably a WhatsApp-linked number for easy contact.</p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-1">
                                            <Button type="submit" disabled={isSavingProfile} className="gap-2">
                                                <Save size={16} /> {isSavingProfile ? "Saving..." : "Save Changes"}
                                            </Button>
                                            <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                                            {user.name}
                                        </h2>
                                        <div className="flex flex-col gap-1.5 mt-2 text-sm text-[var(--text-muted)] items-center sm:items-start">
                                            <span className="flex items-center gap-2"><Mail size={14} /> {user.email}</span>
                                            {user.phone ? (
                                                <span className="flex items-center gap-2"><Smartphone size={14} /> {user.phone}</span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-[var(--warning)] text-xs">
                                                    <AlertCircle size={14} /> Missing phone — add for contact
                                                </span>
                                            )}
                                            {memberSince && (
                                                <span className="flex items-center gap-2 text-xs opacity-70">
                                                    <Clock size={12} /> Member since {memberSince}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {!isEditingProfile && (
                                <Button
                                    onClick={() => setIsEditingProfile(true)}
                                    variant="secondary"
                                    size="sm"
                                    className="sm:absolute top-5 right-5 shrink-0"
                                >
                                    Edit
                                </Button>
                            )}
                        </div>

                        {/* Verification status row */}
                        <Divider />
                        <div className={`flex items-center gap-3 px-4 py-3`}>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                                <StatusIcon size={17} className={config.color} />
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">Identity Verification</p>
                                <p className={`text-xs mt-0.5 ${config.color}`}>{config.label}</p>
                            </div>
                            {(status === "UNVERIFIED" || status === "REJECTED") && (
                                <span className="text-xs font-semibold text-[var(--accent-vivid)] bg-[var(--accent-vivid)]/10 px-2.5 py-1 rounded-full">
                                    {status === "REJECTED" ? "Re-verify" : "Verify"}
                                </span>
                            )}
                        </div>
                    </Surface>

                    {/* Verification form — shown below profile card */}
                    {(status === "UNVERIFIED" || status === "REJECTED") && (
                        <Surface tier={2} className="rounded-2xl p-5 sm:p-6 mt-3">
                            <h3 className="text-base font-bold flex items-center gap-2 mb-1">
                                <ShieldCheck className="text-[var(--accent-vivid)]" size={18} /> Verify Identity
                            </h3>
                            <p className="text-[var(--text-muted)] mb-5 text-sm">
                                Upload a government ID (Aadhaar, PAN, or Driving License) to join higher-value pots.
                            </p>
                            {status === "REJECTED" && user.adminNotes && (
                                <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 p-3 rounded-xl mb-5 text-[var(--danger)] text-sm">
                                    <strong>Rejection reason:</strong> {user.adminNotes}
                                </div>
                            )}
                            <form onSubmit={handleIdSubmit} className="space-y-4 max-w-lg">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-2">ID Type</label>
                                        <Select value={idType} onValueChange={setIdType}>
                                            <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
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
                                                if (idType === "Aadhaar") val = val.replace(/\D/g, "").slice(0, 12);
                                                else if (idType === "PAN") val = val.toUpperCase().slice(0, 10);
                                                setIdNumber(val);
                                            }}
                                            placeholder={idType === "Aadhaar" ? "xxxx xxxx xxxx" : "ABCDE1234F"}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-[var(--text-muted)] font-bold mb-2">Upload Document</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? "border-[var(--accent-vivid)]/50 bg-[var(--accent-vivid)]/5" : "border-[var(--border-subtle)] hover:border-[var(--accent-vivid)]/50 hover:bg-[var(--surface-deep)]/30"}`}
                                    >
                                        {file ? (
                                            <>
                                                <FileText className="text-[var(--accent-vivid)] mb-2" size={28} />
                                                <span className="text-sm font-mono text-[var(--text-primary)] truncate max-w-full text-center px-4">{file.name}</span>
                                                <span className="text-xs text-[var(--text-muted)] mt-1">Tap to change</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="text-[var(--text-muted)] mb-2" size={28} />
                                                <span className="text-sm text-[var(--text-muted)]">Tap to upload ID photo</span>
                                                <span className="text-xs text-[var(--text-muted)] mt-1">Max 5MB</span>
                                            </>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                </div>
                                {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
                                <Button type="submit" disabled={isUploading} className="w-full font-bold">
                                    {isUploading ? "Uploading..." : "Submit for Verification"}
                                </Button>
                            </form>
                        </Surface>
                    )}

                    {status === "PENDING" && (
                        <Surface tier={2} className="rounded-2xl p-6 text-center mt-3">
                            <div className="w-12 h-12 bg-[var(--warning)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Clock size={24} className="text-[var(--warning)]" />
                            </div>
                            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Verification in progress</h3>
                            <p className="text-[var(--text-muted)] text-sm">
                                Your documents are under review. This usually takes 24–48 hours.
                            </p>
                        </Surface>
                    )}
                </section>

                {/* ── PREFERENCES SECTION ── */}
                <section>
                    <SectionLabel>Preferences</SectionLabel>
                    <Surface tier={2} className="rounded-2xl overflow-hidden divide-y divide-[var(--border-subtle)]">

                        {/* Appearance */}
                        <div className="p-4 pb-5">
                            <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-3">Appearance</p>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[
                                    { id: "system", label: "System" },
                                    { id: "dark", label: "Dark" },
                                    { id: "light", label: "Light" },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { const next = opt.id as ThemePreference; setThemePref(next); setThemePreference(next); }}
                                        aria-pressed={themePref === opt.id}
                                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${themePref === opt.id
                                            ? "border-[var(--accent-vivid)]/40 bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]"
                                            : "border-[var(--border-subtle)] bg-[var(--surface-deep)]/40 text-[var(--text-primary)] hover:bg-[var(--surface-deep)]"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-2">Theme</p>
                            <div className="max-w-xs">
                                <Select value={themeVariant} onValueChange={(val) => { const next = val as ThemeVariant; setThemeVariantState(next); setThemeVariant(next); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a variant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            { value: "default", label: "Earthy Glass", colors: ["#2B6E57", "#B8834F", "#F6F5F2", "#1D2622"] },
                                            { value: "ocean", label: "Ocean Ledger", colors: ["#1F6AA5", "#E07A5F", "#F1F4F7", "#1E2933"] },
                                            { value: "clay", label: "Clay Studio", colors: ["#7A4E2F", "#C46B4E", "#F7F1EA", "#2A211B"] },
                                            { value: "dusk", label: "Dusk Violet", colors: ["#6A4DA3", "#E2836A", "#F4EEF6", "#2A1F33"] },
                                        ].map((v) => (
                                            <SelectItem key={v.value} value={v.value}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>{v.label}</span>
                                                    <span className="flex items-center gap-1">
                                                        {v.colors.map((c) => (
                                                            <span key={c} className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                                                        ))}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Language */}
                        <div className="p-4">
                            <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-3">Language</p>
                            <div className="max-w-xs">
                                <LanguageSwitcher />
                            </div>
                        </div>

                        {/* Notifications — placeholder */}
                        <SettingRow
                            icon={Bell}
                            label="Notifications"
                            description="Coming soon — get alerts for payments and activity"
                            end={<span className="text-[10px] font-bold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-0.5 rounded-full uppercase">Soon</span>}
                        />

                        {/* PWA Install / Update */}
                        {showPwaRow && (
                            <>
                                <Divider />
                                {needRefresh ? (
                                    <SettingRow
                                        icon={RefreshCw}
                                        label="Update available"
                                        description="A new version of UniGro is ready to install"
                                        end={
                                            <Button size="sm" variant="primary" onClick={() => updateServiceWorker(true)} className="shrink-0 font-bold">
                                                Update
                                            </Button>
                                        }
                                    />
                                ) : canInstall ? (
                                    <SettingRow
                                        icon={Download}
                                        label="Install app"
                                        description={isIOS ? 'Tap Share → "Add to Home Screen"' : "Install UniGro for faster access and offline use"}
                                        end={
                                            !isIOS && deferredPrompt ? (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    className="shrink-0 font-bold"
                                                    onClick={async () => {
                                                        await deferredPrompt.prompt();
                                                        const result = await deferredPrompt.userChoice;
                                                        if (result.outcome === "accepted") setDeferredPrompt(null);
                                                    }}
                                                >
                                                    Install
                                                </Button>
                                            ) : undefined
                                        }
                                    />
                                ) : (
                                    // Already installed and up to date
                                    <SettingRow
                                        icon={RefreshCw}
                                        label="Check for updates"
                                        description="UniGro is up to date"
                                        onClick={() => updateServiceWorker(false)}
                                    />
                                )}
                            </>
                        )}
                    </Surface>
                </section>

                {/* ── ABOUT SECTION ── */}
                <section>
                    <SectionLabel>About</SectionLabel>
                    <Surface tier={2} className="rounded-2xl overflow-hidden">
                        <SettingRow
                            icon={Shield}
                            label="Privacy Policy"
                            description="How we handle your data"
                            onClick={() => {/* TODO: open privacy policy link */ }}
                        />
                        <Divider />
                        <SettingRow
                            icon={Info}
                            label="About UniGro"
                            description="What is UniGro and how it works"
                            onClick={() => {/* TODO: open about page */ }}
                        />
                        <Divider />
                        <SettingRow
                            icon={ExternalLink}
                            label="Terms of Service"
                            description="Our usage terms and conditions"
                            onClick={() => {/* TODO: open ToS link */ }}
                        />
                        <Divider />
                        {/* App version + made with love */}
                        <div className="flex items-center justify-between px-4 py-3.5">
                            <div className="flex items-center gap-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]">
                                    <Heart size={17} />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">Made with ♥ in India</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">UniGro v{APP_VERSION}</p>
                                </div>
                            </div>
                        </div>
                    </Surface>
                </section>

                {/* ── SIGN OUT ── */}
                <section className="pb-12">
                    <Surface tier={2} className="rounded-2xl overflow-hidden">
                        <SettingRow
                            icon={LogOut}
                            label={t("settings.signOut")}
                            danger
                            onClick={() => signOut()}
                        />
                    </Surface>
                </section>

            </div>
        </PageShell>
    );
}
