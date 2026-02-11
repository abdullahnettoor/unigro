import { Link } from "react-router-dom";
import type { Doc } from "../../convex/_generated/dataModel";

interface PotCardProps {
    pot: Doc<"pots">;
}

export function PotCard({ pot }: PotCardProps) {
    const isDraft = pot.status === "DRAFT";

    return (
        <Link to={`/pot/${pot._id}`} className="block">
            <div className="bg-[#232931] border border-white/5 rounded-2xl p-6 hover:border-[#C1FF72]/50 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${isDraft ? "bg-yellow-500/20 text-yellow-300" : "bg-[#C1FF72]/20 text-[#C1FF72]"
                        }`}>
                        {pot.status}
                    </span>
                </div>

                <h3 className="text-xl font-bold font-display text-white mb-1 group-hover:text-[#C1FF72] transition-colors">
                    {pot.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                    {pot.config.frequency} • {pot.config.duration} Months
                </p>

                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Total Value</div>
                        <div className="text-lg font-mono text-white">₹{pot.config.totalValue.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Contribution</div>
                        <div className="text-lg font-mono text-[#E07A5F]">₹{pot.config.contribution.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
