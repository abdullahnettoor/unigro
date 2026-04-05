import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/api";
import { Button } from "@/components/ui/button";
import { ContactIcon, LoadingIcon, ZapIcon } from "@/lib/icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const currentUser = useQuery(api.users.current);
    const updateProfile = useMutation(api.users.updateProfile);

    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If still loading or unauthenticated, let the underlying routing handle it
    if (currentUser === undefined || currentUser === null) {
        return <>{children}</>;
    }

    // If phone is present, render normal children
    if (currentUser.phone && currentUser.phone.trim() !== "") {
        return <>{children}</>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let formattedPhone = phone.trim();
        if (!formattedPhone) {
            toast.error("Please enter a valid phone number");
            return;
        }

        // Auto-prefix with +91 if no country code is provided
        if (!formattedPhone.startsWith("+")) {
            formattedPhone = `+91${formattedPhone}`;
        }

        setIsSubmitting(true);
        try {
            await updateProfile({
                name: currentUser.name,
                phone: formattedPhone,
            });
            toast.success("Profile completed! 🎉", {
                description: "We've synced any guest pools associated with this number."
            });
        } catch (e: any) {
            toast.error("Failed to update profile", { description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* The rest of the app is hidden underneath or we can render it blurred */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-app)]/80 backdrop-blur-md">
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="relative w-full max-w-[400px] rounded-[32px] bg-[var(--surface-1)] p-6 md:p-8 shadow-2xl border border-[var(--border-subtle)] overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-vivid)]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                        
                        <div className="relative text-center mb-8">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center mb-6 shadow-sm">
                                <ZapIcon size={28} className="text-[var(--accent-vivid)]" />
                            </div>
                            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
                                Almost there!
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] font-medium px-4">
                                Enter your phone number to automatically link any pools you've been invited to.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative">
                            <div className="space-y-2">
                                <div className="space-y-1.5 px-1 flex items-center justify-between">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] group-focus-within:text-[var(--accent-vivid)] transition-colors">
                                        Mobile Number
                                    </label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                                        <ContactIcon size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Mobile number (e.g., 9876543210)"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent-vivid)] focus:ring-1 focus:ring-[var(--accent-vivid)] text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all font-medium text-[15px]"
                                        autoFocus
                                        required
                                    />
                                    {!phone.startsWith("+") && phone.length > 0 && (
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-3)] px-2 py-0.5 rounded-full">
                                                +91 defaulted
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || phone.trim().length < 8}
                                className="w-full h-14 rounded-2xl text-[15px] font-bold bg-[var(--text-primary)] text-[var(--bg-app)] hover:bg-[var(--text-primary)]/90 shadow-xl shadow-[var(--text-primary)]/10"
                            >
                                {isSubmitting ? (
                                    <LoadingIcon className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Complete Profile"
                                )}
                            </Button>
                        </form>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* 
              Render children but visually hide them so the guard feels like an overlay 
              on top of exactly what they were trying to access.
            */}
            <div aria-hidden="true" className="pointer-events-none opacity-0 h-0 overflow-hidden">
                {children}
            </div>
        </>
    );
}
