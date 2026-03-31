import { ArrowLeft, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { OrganizerBadge } from "@/components/pool-detail/OrganizerBadge";
import type { PoolOrganizer } from "@/components/pool-detail/types";

interface DetailHeaderProps {
    title: string;
    isOrganizer: boolean;
    organizer?: PoolOrganizer | null;
    onShare?: () => void;
    onEdit?: () => void;
    onJoin?: () => void;
}

export function DetailHeader({ title, isOrganizer, organizer, onShare, onEdit, onJoin }: DetailHeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 w-full glass-sticky border-b border-[var(--border-subtle)]/30 shadow-sm safe-top">
            <div className="mx-auto w-full max-w-4xl px-4 py-3 flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => navigate(-1)}
                        className="shrink-0 hover:bg-[var(--surface-2)]/60"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-sm font-bold text-[var(--text-primary)] truncate font-display tracking-tight">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isOrganizer ? (
                        <div className="flex items-center gap-1">
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={onEdit}
                                    className="hover:bg-[var(--surface-2)]/60 text-[var(--accent-vivid)]"
                                    title="Edit Pool"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={onShare}
                                className="hover:bg-[var(--surface-2)]/60 text-[var(--accent-vivid)]"
                            >
                                <Share2 size={18} />
                            </Button>
                        </div>
                    ) : (
                        organizer && (
                            <div className="flex items-center gap-2">
                                {onJoin && (
                                    <Button
                                        size="sm"
                                        onClick={onJoin}
                                        className="h-8 rounded-full bg-[var(--accent-vivid)] hover:bg-[var(--accent-vivid)]/90 text-white font-bold px-4 gap-1.5 shadow-md shadow-[var(--accent-vivid)]/20 animate-in fade-in zoom-in duration-300"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><path d="M4 14.5 14 3 12 9.5H20L10 21 12 14.5H4z" /></svg>
                                        <span className="text-xs">Join</span>
                                    </Button>
                                )}
                                <OrganizerBadge
                                    organizer={organizer}
                                    avatarOnly={true}
                                    className="h-8 w-8 text-xs border-[var(--accent-vivid)]/20 shadow-sm"
                                />
                            </div>
                        )
                    )}
                </div>
            </div>
        </header>
    );
}
