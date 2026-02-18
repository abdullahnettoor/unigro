import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { User, Phone, Save } from "lucide-react";

export function ProfileModal() {
    const user = useQuery(api.users.current);
    const updateProfile = useMutation(api.users.updateProfile);

    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Only show if user is loaded but missing phone number (or name)
    // AND they are not a ghost themselves (which shouldn't happen for logged in users, but safety)
    if (!user || user.phone) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) {
            setError("Name and Phone are required.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await updateProfile({ name, phone });
            // Modal will close automatically because user.phone will be set
        } catch (err) {
            console.error(err);
            setError("Failed to update profile. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-end justify-center p-3 sm:items-center sm:p-4 z-[100]">
            <div className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-md relative animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-[var(--accent-vivid)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--accent-vivid)]/20">
                        <User size={40} className="text-[var(--accent-vivid)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Complete Your Profile</h2>
                    <p className="text-[var(--text-muted)]">
                        We need your phone number to link any existing pot invitations to your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-vivid)]/50 transition-colors"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-[var(--surface-deep)]/60 border border-[var(--border-subtle)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-vivid)]/50 transition-colors"
                                placeholder="+91 9876543210"
                            />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 ml-1">
                            Used to claim “Ghost” accounts created by organizers.
                        </p>
                    </div>

                    {error && <p className="text-[var(--danger)] text-sm text-center bg-[var(--danger)]/10 p-2 rounded-lg">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--accent-vivid)] text-[var(--text-on-accent)] font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : (
                            <>
                                <Save size={18} /> Save & Continue
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
