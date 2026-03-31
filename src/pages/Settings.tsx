import { useEffect, useRef, useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "@/lib/icons";
import {
    ChevronRight,
    FileText,
    LogOut,
    Mail,
    Smartphone,
    Upload,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Clock,
    SmartphoneIcon,
    Sun,
    Moon,
    Monitor
} from "lucide-react";

import { useFeedback } from "@/components/shared/FeedbackProvider";
import { AdSlot } from "@/components/monetization/AdSlot";
import { PricingModal } from "@/components/monetization/PricingModal";
import { OfflineFallback } from "@/components/shared/OfflineFallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LogoLoader } from "@/components/ui/LogoLoader";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatBytes, compressImage } from "@/lib/image-compression";
import {
    getThemePreference,
    getThemeVariant,
    setThemePreference,
    setThemeVariant,
    type ThemePreference,
    type ThemeVariant
} from "@/lib/theme";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useEntitlements } from "@/hooks/useEntitlements";

import { api } from "../../convex/_generated/api";

const APP_VERSION = "0.0.1";
const SETTINGS_CACHE_KEY = "unigro_settings_cache";

type SettingsUserSnapshot = {
    _creationTime?: number;
    name: string;
    email: string;
    phone?: string;
    pictureUrl: string;
    verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    adminNotes?: string;
};

// ── Shared Layout Components ──────────────────────────────────────────────────

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={cn("mt-10", className)}>
            <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
                {title}
            </p>
            {children}
        </section>
    );
}

function SettingRow({
    icon: Icon,
    label,
    description,
    end,
    onClick,
    danger,
    className
}: {
    icon?: React.ElementType;
    label: string;
    description?: string;
    end?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
    className?: string;
}) {
    const Tag = onClick ? "button" : "div";
    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={cn(
                "flex w-full items-center gap-4 px-4 py-4 text-left transition-all",
                onClick ? "hover:bg-[var(--surface-deep)]/30 active:scale-[0.98]" : "",
                className
            )}
        >
            {Icon && (
                <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                    danger ? "bg-red-500/10 text-red-500" : "bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]"
                )}>
                    <Icon size={18} />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <span className={cn(
                    "block text-sm font-bold tracking-tight",
                    danger ? "text-red-500" : "text-[var(--text-primary)]"
                )}>
                    {label}
                </span>
                {description && (
                    <span className="block text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug font-medium">{description}</span>
                )}
            </div>
            {end ?? (onClick && !danger ? <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]/50" /> : null)}
        </Tag>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Settings() {
    const user = useQuery(api.users.current) as SettingsUserSnapshot | null | undefined;
    const isAdmin = useQuery(api.users.isAdmin);
    const { isOnline } = useNetworkStatus();
    const { entitlements, isFromCache: entitlementsFromCache } = useEntitlements();
    const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
    const requestVerification = useMutation(api.verification.submit);
    const updateProfile = useMutation(api.users.updateProfile);
    const setCurrentPlanTierForTesting = useMutation(api.users.setCurrentPlanTierForTesting);
    const { signOut } = useClerk();
    const feedback = useFeedback();

    // ── PWA state ──
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW();
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;

    // ── Verification state ──
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [idType, setIdType] = useState("Aadhaar");
    const [idNumber, setIdNumber] = useState("");
    const [error, setError] = useState("");
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Theme state ──
    const [themePref, setThemePref] = useState<ThemePreference>(() => getThemePreference());
    const [themeVariant, setThemeVariantState] = useState<ThemeVariant>(() => getThemeVariant());

    // ── Profile edit state ──
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [pricingOpen, setPricingOpen] = useState(false);
    const [isUpdatingPlanTier, setIsUpdatingPlanTier] = useState(false);
    const [cachedUser, setCachedUser] = useState<SettingsUserSnapshot | null>(() => {
        if (typeof window === "undefined") return null;
        try {
            const raw = window.localStorage.getItem(SETTINGS_CACHE_KEY);
            return raw ? JSON.parse(raw) as SettingsUserSnapshot : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (!user) return;
        const snapshot: SettingsUserSnapshot = {
            _creationTime: user._creationTime,
            name: user.name,
            email: user.email,
            phone: user.phone,
            pictureUrl: user.pictureUrl,
            verificationStatus: user.verificationStatus,
            adminNotes: user.adminNotes,
        };
        setCachedUser(snapshot);
        window.localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(snapshot));
    }, [user]);

    const effectiveUser = user ?? (!isOnline ? cachedUser : null);
    const isUsingCachedUser = !isOnline && !user && !!cachedUser;

    useEffect(() => {
        if (effectiveUser && !isEditingProfile) {
            setEditName(effectiveUser.name || "");
            setEditPhone(effectiveUser.phone || "");
        }
    }, [effectiveUser, isEditingProfile]);

    if (!effectiveUser && user === undefined && !isOnline) {
        return (
            <OfflineFallback
                title="Settings unavailable offline"
                message="Open Settings once while connected so we can cache your account details for offline viewing."
            />
        );
    }

    if (!effectiveUser) {
        return (
            <div className="min-h-[80dvh] grid place-items-center">
                <LogoLoader size="lg" />
            </div>
        );
    }

    // ── Handlers ──
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (selected.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            return;
        }

        setIsCompressing(true);
        setError("");

        try {
            const originalSize = selected.size;
            // Target 100-200kb with 0.5 quality and 1000px max dimension
            const compressed = await compressImage(selected, { 
                quality: 0.5,
                maxWidth: 1000,
                maxHeight: 1000 
            });
            const compressedSize = compressed.size;

            console.log(`[Compression Profile] ${selected.name}: ${formatBytes(originalSize)} -> ${formatBytes(compressedSize)} (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`);

            setFile(compressed);
        } catch (err) {
            console.error("Compression failed:", err);
            setFile(selected); // Fallback
        } finally {
            setIsCompressing(false);
        }
    };

    const handleTestPlanSwitch = async (planTier: "free" | "pro") => {
        setIsUpdatingPlanTier(true);
        try {
            await setCurrentPlanTierForTesting({ planTier });
            feedback.toast.success(
                "Plan updated",
                planTier === "pro" ? "Pro entitlements enabled for testing." : "Free organizer state restored."
            );
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Could not switch the testing plan tier.";
            feedback.toast.error("Plan update failed", message);
        } finally {
            setIsUpdatingPlanTier(false);
        }
    };

    const handleIdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOnline) {
            feedback.toast.info("Offline right now", "Reconnect before sending verification details.");
            return;
        }
        if (!editPhone || !isValidPhoneNumber(editPhone)) {
            setError("Please provide a valid phone number for identity matching.");
            return;
        }
        if (!file || !idNumber) {
            setError("Please provide ID Document and Number");
            return;
        }
        setIsUploading(true);
        setError("");
        try {
            // Ensure profile is updated with the phone number first
            await updateProfile({ name: editName.trim() || effectiveUser.name, phone: editPhone });
            
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();
            await requestVerification({ storageId, idType, idNumber });
            setFile(null);
            setIsUploading(false);
            feedback.toast.success("Verification Submitted", "Your ID and phone have been sent for review.");
        } catch (err) {
            console.error(err);
            setError("Failed to submit. Please try again.");
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOnline) {
            feedback.toast.info("Offline right now", "Reconnect to save profile changes.");
            return;
        }
        if (!editName.trim()) { feedback.toast.error("Invalid Name", "Name cannot be empty."); return; }
        if (!editPhone || !isValidPhoneNumber(editPhone)) { feedback.toast.error("Invalid Phone", "Please enter a valid phone number."); return; }
        setIsSavingProfile(true);
        try {
            await updateProfile({ name: editName.trim(), phone: editPhone });
            feedback.toast.success("Profile Updated", "Changes saved.");
            setIsEditingProfile(false);
        } catch (err) {
            console.error(err);
            feedback.toast.error("Update Failed", "Could not save changes.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const status = (effectiveUser.verificationStatus as "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED") || "UNVERIFIED";
    const memberSince = effectiveUser._creationTime
        ? new Date(effectiveUser._creationTime).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        : null;

    return (
        <div className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">

            {/* Header */}
            <header className="glass-3 relative overflow-hidden rounded-[28px] border border-[var(--border-subtle)] p-6 mb-8">
                <div className="pointer-events-none absolute inset-0 bg-[var(--bg-glass-gradient)] opacity-60" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--accent-vivid)]/10 blur-3xl opacity-50" />

                {/* PWA Update Banner */}
                <AnimatePresence>
                    {needRefresh && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-4 overflow-hidden"
                        >
                            <div className="bg-[var(--accent-vivid)] text-white p-3 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-[var(--accent-vivid)]/20">
                                <div className="flex items-center gap-2">
                                    <Icons.ZapIcon size={16} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Update Available</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 rounded-xl px-3 text-[10px] font-bold uppercase tracking-widest bg-white text-[var(--accent-vivid)] hover:bg-white/90"
                                    onClick={() => updateServiceWorker(true)}
                                >
                                    Refresh Now
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Member Account</p>
                    <h1 className="mt-3 font-display text-[var(--type-3xl)] font-bold text-[var(--text-primary)]">
                        Settings
                    </h1>
                    <p className="mt-2 text-xs text-[var(--text-muted)] font-medium">
                        Personalize your experience and manage your verified identity.
                    </p>
                    {isUsingCachedUser ? (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--warning)]/20 bg-[var(--warning)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--warning)]">
                            <AlertCircle size={14} />
                            Viewing cached settings. Live edits need a connection.
                        </div>
                    ) : null}
                </div>
            </header>

            {/* Profile Section */}
            <Section title="Profile & Identity">
                <div className="glass-2 overflow-hidden rounded-[24px] border border-[var(--border-subtle)]/70">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 rounded-full bg-[var(--accent-vivid)]/5 animate-pulse" />
                            <img
                                src={effectiveUser.pictureUrl}
                                alt={effectiveUser.name}
                                className="relative w-24 h-24 rounded-[32px] border-2 border-white shadow-xl shadow-black/5 object-cover"
                            />
                            {status === "VERIFIED" && (
                                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-vivid)] text-white shadow-lg border-2 border-white">
                                    <ShieldCheck size={16} strokeWidth={2.5} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 w-full text-center sm:text-left pt-2">
                            <AnimatePresence mode="wait">
                                {isEditingProfile ? (
                                    <motion.form
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        onSubmit={handleSaveProfile}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Full Name</label>
                                                <Input
                                                    className="bg-[var(--surface-2)]/40 border-[var(--border-subtle)]/60 rounded-full h-11 px-5"
                                                    value={editName}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Phone Number</label>
                                                <PhoneInputField
                                                    className="rounded-full"
                                                    value={editPhone}
                                                    onChange={setEditPhone}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <Button type="submit" size="sm" disabled={isSavingProfile} className="rounded-full px-5">
                                                {isSavingProfile ? <LogoLoader size="sm" className="mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                                                Save
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" className="rounded-full text-[var(--text-muted)]" onClick={() => setIsEditingProfile(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </motion.form>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="w-full flex flex-col items-center sm:items-start"
                                    >
                                        <div className="flex flex-col gap-1 items-center sm:items-start">
                                            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                                                {effectiveUser.name}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[13px] font-medium text-[var(--text-muted)] justify-center sm:justify-start">
                                                <span className="flex items-center gap-1.5"><Mail size={14} className="opacity-60" /> {effectiveUser.email}</span>
                                                {effectiveUser.phone && <span className="flex items-center gap-1.5"><Smartphone size={14} className="opacity-60" /> {effectiveUser.phone}</span>}
                                            </div>
                                            {memberSince && (
                                                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-vivid)]/60">
                                                    Member since {memberSince}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => {
                                                if (!isOnline) {
                                                    feedback.toast.info("Offline right now", "Reconnect to edit your profile.");
                                                    return;
                                                }
                                                setIsEditingProfile(true);
                                            }}
                                            variant="secondary"
                                            size="sm"
                                            className="mt-4 rounded-full bg-[var(--surface-0)] border border-[var(--border-subtle)]/50 sm:px-6 h-8 text-[11px] font-bold uppercase tracking-widest shadow-sm shadow-black/5 active:scale-95 transition-all"
                                        >
                                            Edit Profile
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Verification Status Banner */}
                    <div className={cn(
                        "mx-4 mb-4 flex items-center gap-4 rounded-2xl border p-4",
                        status === "VERIFIED" ? "bg-green-500/5 border-green-500/10 text-green-600" :
                            status === "PENDING" ? "bg-[var(--warning)]/5 border-[var(--warning)]/10 text-[var(--warning)]" :
                                status === "REJECTED" ? "bg-red-500/5 border-red-500/10 text-red-500" :
                                    "bg-[var(--surface-3)]/40 border-[var(--border-subtle)]/50 text-[var(--text-muted)]"
                    )}>
                        <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            status === "VERIFIED" ? "bg-green-500/10" :
                                status === "PENDING" ? "bg-[var(--warning)]/10" :
                                    status === "REJECTED" ? "bg-red-500/10" :
                                        "bg-[var(--surface-1)]"
                        )}>
                            {status === "VERIFIED" ? <ShieldCheck size={20} /> :
                                status === "PENDING" ? <Clock size={20} /> :
                                    status === "REJECTED" ? <AlertCircle size={20} /> :
                                        <Icons.HistoryIcon size={20} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-80">Identity Status</p>
                            <p className="text-sm font-bold tracking-tight">
                                {status === "VERIFIED" ? "Fully Verified Member" :
                                    status === "PENDING" ? "Verification In Progress" :
                                        status === "REJECTED" ? "Verification Flagged" :
                                            "Identity Unverified"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Identity Form (Visible if unverified) */}
                {(status === "UNVERIFIED" || status === "REJECTED") && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-3 overflow-hidden"
                    >
                        <div className="glass-2 rounded-[24px] border border-[var(--border-subtle)] p-6">
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                                <Icons.DetailIcon className="text-[var(--accent-vivid)]" size={18} />
                                Upgrade your account
                            </h3>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium mb-6 leading-relaxed">
                                Verify your identity to create or join high-value pools and unlock premium social features.
                            </p>

                            {status === "REJECTED" && effectiveUser.adminNotes && (
                                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl mb-6 flex gap-3">
                                    <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold text-red-600 mb-0.5 uppercase tracking-wider">Reviewer Note</p>
                                        <p className="text-red-500">{effectiveUser.adminNotes}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleIdSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">ID Type</label>
                                        <Select value={idType} onValueChange={setIdType}>
                                            <SelectTrigger className="bg-[var(--surface-2)]/30 border-[var(--border-subtle)]/50 rounded-full h-11 px-5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="glass-3 rounded-2xl">
                                                <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                                                <SelectItem value="PAN">PAN Card</SelectItem>
                                                <SelectItem value="Driving License">Driving License</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">ID Number</label>
                                        <Input
                                            className="bg-[var(--surface-2)]/30 border-[var(--border-subtle)]/50 rounded-full h-11 px-5"
                                            value={idNumber}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = e.target.value;
                                                if (idType === "Aadhaar") val = val.replace(/\D/g, "").slice(0, 12);
                                                else if (idType === "PAN") val = val.toUpperCase().slice(0, 10);
                                                setIdNumber(val);
                                            }}
                                            placeholder={idType === "Aadhaar" ? "0000 0000 0000" : "ABCDE1234F"}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Phone Number</label>
                                    <PhoneInputField
                                        className="rounded-full h-11"
                                        value={editPhone}
                                        onChange={setEditPhone}
                                    />
                                    <p className="px-1 text-[9px] text-[var(--text-muted)] italic leading-relaxed font-medium">We link all your past contributions and winnings using this number.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Proof Attachment</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "relative border-2 border-dashed rounded-[22px] py-10 transition-all cursor-pointer overflow-hidden",
                                            file ? "border-[var(--accent-vivid)]/40 bg-[var(--accent-vivid)]/6" : "border-[var(--border-subtle)]/60 hover:bg-[var(--surface-2)]/30"
                                        )}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-3 text-center px-4 relative z-10">
                                            {isCompressing ? (
                                                <>
                                                    <div className="h-12 w-12 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center text-[var(--accent-vivid)]">
                                                        <Icons.LoadingIcon className="h-6 w-6 animate-spin" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-[var(--accent-vivid)] uppercase tracking-widest">Optimizing...</p>
                                                        <p className="text-[10px] text-[var(--text-muted)] font-medium">Reducing size for faster upload</p>
                                                    </div>
                                                </>
                                            ) : file ? (
                                                <>
                                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-xl shadow-black/5 flex items-center justify-center text-[var(--accent-vivid)]">
                                                        <FileText size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[240px]">{file.name}</p>
                                                        <p className="text-[10px] text-[var(--accent-vivid)] font-bold uppercase tracking-widest">Tap to change</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-12 w-12 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center text-[var(--text-muted)]">
                                                        <Upload size={22} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-[var(--text-primary)]">Upload ID Document</p>
                                                        <p className="text-[10px] text-[var(--text-muted)] font-medium">JPEG or PNG, Max 5MB</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                </div>

                                {error && <p className="px-2 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}

                                <Button type="submit" disabled={!isOnline || isUploading || isCompressing || !file || !idNumber} className="w-full h-12 rounded-[18px] font-bold text-sm shadow-xl shadow-[var(--accent-vivid)]/10">
                                    {isUploading ? <LogoLoader size="sm" /> : "Request Verification"}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </Section>

            {/* Appearance Section */}
            <Section title="Personalization">
                <div className="glass-2 overflow-hidden rounded-[24px] border border-[var(--border-subtle)]/70 divide-y divide-[var(--border-subtle)]/40">
                    <div className="p-5">
                        <label className="px-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-3">Display Mode</label>
                        <div className="flex bg-[var(--surface-0)]/50 p-1 rounded-2xl">
                            {[
                                { id: "system", label: "System", icon: Monitor },
                                { id: "light", label: "Light", icon: Sun },
                                { id: "dark", label: "Dark", icon: Moon },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { const next = opt.id as ThemePreference; setThemePref(next); setThemePreference(next); }}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider",
                                        themePref === opt.id
                                            ? "glass-1 text-[var(--text-primary)] shadow-sm"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    )}
                                >
                                    <opt.icon size={13} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <label className="px-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1">Color Palette</label>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium">Coordinate the interface with your vibe.</p>
                        </div>
                        <div className="w-full sm:w-48">
                            <Select value={themeVariant} onValueChange={(val: string) => { const next = val as ThemeVariant; setThemeVariantState(next); setThemeVariant(next); }}>
                                <SelectTrigger className="bg-[var(--surface-0)]/50 border-[var(--border-subtle)]/50 h-10 rounded-full px-3 text-[11px] font-bold shadow-sm shadow-black/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-3 rounded-2xl overflow-hidden min-w-[200px]">
                                    {[
                                        { value: "default", label: "Earthy Glass", colors: ["#2B6E57", "#B8834F"] },
                                        { value: "ocean", label: "Ocean Ledger", colors: ["#1F6AA5", "#E07A5F"] },
                                        { value: "clay", label: "Clay Studio", colors: ["#7A4E2F", "#C46B4E"] },
                                        { value: "dusk", label: "Dusk Violet", colors: ["#6A4DA3", "#E2836A"] },
                                    ].map((v) => (
                                        <SelectItem key={v.value} value={v.value} className="py-2.5">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-[11px] font-bold">{v.label}</span>
                                                <div className="flex gap-1 ml-4">
                                                    {v.colors.map(c => <div key={c} className="h-3 w-3 rounded-full border border-black/5" style={{ backgroundColor: c }} />)}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <label className="px-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1">Language</label>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium">Set your preferred regional dialogue.</p>
                        </div>
                        <div className="w-full sm:w-48">
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </Section>

            {/* Application & About Section */}
            <Section title="Application">
                <div className="glass-2 overflow-hidden rounded-[24px] border border-[var(--border-subtle)]/70 divide-y divide-[var(--border-subtle)]/40">
                    <div className="px-4 py-4">
                        <div className="rounded-[20px] border border-[var(--border-subtle)]/60 bg-[var(--surface-2)]/45 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-vivid)]">Organizer plan</p>
                                    <h3 className="mt-1 text-sm font-bold text-[var(--text-primary)] capitalize">
                                        {entitlements.planTier} plan
                                    </h3>
                                    <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
                                        {entitlements.planTier === "pro"
                                            ? `Ad-free with room for ${entitlements.maxPools} pools.`
                                            : `Free tier includes up to ${entitlements.maxPools} pools and light sponsorship on browse surfaces.`}
                                    </p>
                                    {(isUsingCachedUser || entitlementsFromCache) && (
                                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--warning)]">
                                            Cached plan details while offline
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant={entitlements.planTier === "pro" ? "secondary" : "default"}
                                    className="rounded-full"
                                    onClick={() => setPricingOpen(true)}
                                >
                                    {entitlements.planTier === "pro" ? "Manage plan" : "Upgrade"}
                                </Button>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-[var(--border-subtle)]/50 bg-[var(--surface-1)]/55 p-3">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Pool cap</p>
                                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{entitlements.maxPools} pools</p>
                                </div>
                                <div className="rounded-2xl border border-[var(--border-subtle)]/50 bg-[var(--surface-1)]/55 p-3">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Browse ads</p>
                                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                                        {entitlements.adsDisabled ? "Disabled" : entitlements.organizedPoolsCount > 0 ? "Enabled" : "Not active yet"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PWA / App Row */}
                    {isStandalone ? (
                        <SettingRow
                            icon={SmartphoneIcon}
                            label="Desktop App Active"
                            description={`Running UniGro PWA Version ${APP_VERSION}`}
                            end={<CheckCircle2 size={16} className="text-[var(--success)]" />}
                        />
                    ) : (
                        <SettingRow
                            icon={Icons.ZapIcon}
                            label="Add to home screen"
                            description="Install for biometric entry and instant access."
                            onClick={() => feedback.toast.info("Install Application", "Open your browser menu and choose 'Add to Home Screen'.")}
                        />
                    )}

                    <SettingRow
                        icon={Icons.BellIcon}
                        label="Push Notifications"
                        description="Stay updated on rounds and draws."
                        end={<span className="text-[9px] font-bold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Soon</span>}
                    />

                    <SettingRow
                        icon={ShieldCheck}
                        label="Privacy Policy"
                        description="Read our commitment to your data."
                        onClick={() => { }}
                    />

                    <SettingRow
                        icon={Icons.InfoIcon}
                        label="About UniGro"
                        description="Understand our architecture and mission."
                        onClick={() => { }}
                    />

                    <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500">
                                <Icons.WinnerIcon size={18} />
                            </div>
                            <p className="text-xs font-bold text-[var(--text-primary)]">Made in Kerala, Bharat</p>
                        </div>
                        <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">v{APP_VERSION}</span>
                    </div>
                </div>
            </Section>

            {entitlements.planTier === "free" && entitlements.organizedPoolsCount > 0 ? (
                <div className="mt-4">
                    <AdSlot placement="settings" onUpgrade={() => setPricingOpen(true)} />
                </div>
            ) : null}

            {import.meta.env.DEV && isAdmin ? (
                <Section title="Developer">
                    <div className="glass-2 overflow-hidden rounded-[24px] border border-[var(--border-subtle)]/70">
                        <div className="px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--warning)]">Testing entitlements</p>
                                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                                        Switch between Free and Pro without wiring billing yet.
                                    </p>
                                </div>
                                <span className="rounded-full bg-[var(--surface-2)]/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                    {entitlements.planTier}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={entitlements.planTier === "free" ? "default" : "secondary"}
                                    className="rounded-full"
                                    disabled={isUpdatingPlanTier || entitlements.planTier === "free"}
                                    onClick={() => handleTestPlanSwitch("free")}
                                >
                                    Switch to Free
                                </Button>
                                <Button
                                    type="button"
                                    variant={entitlements.planTier === "pro" ? "default" : "secondary"}
                                    className="rounded-full"
                                    disabled={isUpdatingPlanTier || entitlements.planTier === "pro"}
                                    onClick={() => handleTestPlanSwitch("pro")}
                                >
                                    Switch to Pro
                                </Button>
                            </div>
                        </div>
                    </div>
                </Section>
            ) : null}

            {/* Logout Section */}
            <div className="mt-8">
                <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className="w-full h-14 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-bold group"
                >
                    <LogOut size={18} className="mr-3 transition-transform group-hover:-translate-x-1" />
                    Sign Out of Account
                </Button>
            </div>

            {pricingOpen ? (
                <PricingModal
                    open={pricingOpen}
                    onOpenChange={setPricingOpen}
                    entitlements={entitlements}
                    context="settings"
                />
            ) : null}

        </div>
    );
}
