import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { PotCard } from "../components/PotCard";
import { Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { VerificationModal } from "../components/VerificationModal";

export function Dashboard() {
    const pots = useQuery(api.pots.list);
    const user = useQuery(api.users.current);
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const managedPots = pots?.filter(p => p.foremanId === user?._id) || [];
    const joinedPots = pots?.filter(p => p.foremanId !== user?._id) || [];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">

            {/* Verification Banner */}
            {user && user.verificationStatus === "UNVERIFIED" && (
                <div
                    onClick={() => setShowVerificationModal(true)}
                    className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-yellow-500/20 transition-colors"
                >
                    <div className="bg-yellow-500/20 p-2 rounded-full text-yellow-500 shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h3 className="text-yellow-500 font-bold mb-1">Verify your Identity</h3>
                        <p className="text-gray-400 text-sm">Upload a Government ID to build trust and unlock full features.</p>
                    </div>
                </div>
            )}

            {user && user.verificationStatus === "PENDING" && (
                <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-4">
                    <div className="bg-blue-500/20 p-2 rounded-full text-blue-500 shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="text-blue-500 font-bold mb-1">Verification Pending</h3>
                        <p className="text-gray-400 text-sm">Your documents are under review. This usually takes 24 hours.</p>
                    </div>
                </div>
            )}

            {user && user.verificationStatus === "REJECTED" && (
                <div
                    onClick={() => setShowVerificationModal(true)}
                    className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-red-500/20 transition-colors"
                >
                    <div className="bg-red-500/20 p-2 rounded-full text-red-500 shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h3 className="text-red-500 font-bold mb-1">Verification Rejected</h3>
                        <p className="text-gray-400 text-sm">Action required. Click to view reason and resubmit.</p>
                    </div>
                </div>
            )}

            {/* Global Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold">My Dashboard</h1>
                    <p className="text-gray-400">Track your pots, payments, and investments.</p>
                </div>
                <Link
                    to="/create"
                    className="flex items-center gap-2 bg-[#C1FF72] text-[#1B3022] px-4 py-2 rounded-full font-bold hover:opacity-90 transition-opacity"
                >
                    <Plus size={20} />
                    New Pot
                </Link>
            </header>

            {/* Managed Section - Only show if user manages pots */}
            {managedPots.length > 0 && (
                <section className="mb-12">
                    <header className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
                                Managed by Me
                                {pots && <span className="bg-white/10 text-sm px-2 py-0.5 rounded-full text-gray-400">{managedPots.length}</span>}
                            </h2>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {managedPots.map((pot) => (
                            <PotCard key={pot._id} pot={pot} currentUserId={user?._id} />
                        ))}
                    </div>
                </section>
            )}

            {/* Investments Section */}
            <section>
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-display font-bold flex items-center gap-3">
                            My Investments
                            {pots && <span className="bg-white/10 text-sm px-2 py-0.5 rounded-full text-gray-400">{joinedPots.length}</span>}
                        </h2>
                    </div>
                </header>

                {!pots ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(i => <div key={i} className="bg-[#232931]/50 h-40 rounded-2xl animate-pulse border border-white/5" />)}
                    </div>
                ) : joinedPots.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-[#232931]/30">
                        <p className="text-gray-500">You haven't joined any pots yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {joinedPots.map((pot) => (
                            <PotCard key={pot._id} pot={pot} currentUserId={user?._id} />
                        ))}
                    </div>
                )}
            </section>

            {showVerificationModal && (
                <VerificationModal onClose={() => setShowVerificationModal(false)} />
            )}
        </div>
    );
}
