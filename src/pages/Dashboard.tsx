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

            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold">My Pots</h1>
                    <p className="text-gray-400">Manage your active and pending chit funds.</p>
                </div>
                <Link
                    to="/create"
                    className="flex items-center gap-2 bg-[#C1FF72] text-[#1B3022] px-4 py-2 rounded-full font-bold hover:opacity-90 transition-opacity"
                >
                    <Plus size={20} />
                    New Pot
                </Link>
            </header>

            {!pots ? (
                // Loading State
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#232931]/50 h-40 rounded-2xl animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : pots.length === 0 ? (
                // Empty State
                <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl bg-[#232931]/30">
                    <h3 className="text-xl font-display mb-2 text-gray-300">No active pots</h3>
                    <p className="text-gray-500 mb-6">Create your first pot to get started with your community.</p>
                    <Link
                        to="/create"
                        className="inline-block bg-[#232931] border border-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Create Pot
                    </Link>
                </div>
            ) : (
                // List Pots
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pots.map((pot) => (
                        <PotCard key={pot._id} pot={pot} currentUserId={user?._id} />
                    ))}
                </div>
            )}

            {showVerificationModal && (
                <VerificationModal onClose={() => setShowVerificationModal(false)} />
            )}
        </div>
    );
}
