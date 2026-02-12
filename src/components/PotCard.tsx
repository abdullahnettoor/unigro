import { Link } from "react-router-dom";
import type { Doc } from "../../convex/_generated/dataModel";

interface PotCardProps {
    pot: Doc<"pots">;
    currentUserId?: string;
}

export function PotCard({ pot }: PotCardProps) {
    const isDraft = pot.status === "DRAFT";

    return (
        <Link to={`/pot/${pot._id}`} className="block">
            <div className="bg-[#232931] border border-white/5 rounded-2xl p-6 hover:border-[#C1FF72]/50 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between">

                <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-full uppercase tracking-wider ${isDraft ? "bg-yellow-500/10 text-yellow-300" : "bg-[#C1FF72]/10 text-[#C1FF72]"
                        }`}>
                        {pot.status}
                    </span>
                    <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-full uppercase tracking-wider">
                        {pot.config.frequency}
                    </span>
                </div>

                <div>
                    <h3 className="text-xl font-bold font-display text-white mb-1 group-hover:text-[#C1FF72] transition-colors truncate">
                        {pot.title}
                    </h3>
                    <p className="text-gray-500 text-xs mb-6">
                        Managed by Foreman
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Pool Value</div>
                        <div className="text-lg font-mono font-bold text-white">₹{pot.config.totalValue.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase mb-1">
                            Per {pot.config.frequency === 'monthly' ? 'Month' : (pot.config.frequency === 'occasional' ? 'Round' : 'Cycle')}
                        </div>
                        <div className="text-lg font-mono font-bold text-[#E07A5F]">₹{pot.config.contribution.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
