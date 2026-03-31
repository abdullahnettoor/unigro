import { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type AnalyticsWindow = Window & {
    gtag?: (eventName: string, action: string, details?: Record<string, unknown>) => void;
    dataLayer?: Array<Record<string, unknown>>;
};

type IOSNavigator = Navigator & {
    standalone?: boolean;
};

const DISMISS_KEY = "pwa_prompt_dismissed_at";
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

export function PWAPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(() => {
        const dismissedAtRaw = window.localStorage.getItem(DISMISS_KEY);
        const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
        return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
    });

    const track = useCallback((event: string, details?: Record<string, unknown>) => {
        const w = window as AnalyticsWindow;
        if (typeof w.gtag === "function") {
            w.gtag("event", event, details || {});
        } else if (Array.isArray(w.dataLayer)) {
            w.dataLayer.push({ event, ...(details || {}) });
        }
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            track("pwa_install_prompt_available");
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [track]);

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as IOSNavigator).standalone;
    const showInstallHint = !dismissed && !isStandalone && (Boolean(deferredPrompt) || isIOS);

    const close = () => {
        setNeedRefresh(false);
        track("pwa_prompt_dismissed");
        setDeferredPrompt(null);
        setDismissed(true);
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    if (!needRefresh && !showInstallHint) return null;

    return (
        <div className="fixed inset-x-3 bottom-3 z-50 animate-in slide-in-from-bottom-5 sm:inset-x-auto sm:right-4 sm:bottom-4">
            <Surface tier={3} rounded="2xl" className="flex items-start gap-3 p-4 shadow-2xl sm:max-w-sm">
                <div className="rounded-lg bg-[var(--accent-vivid)]/10 p-2 text-[var(--accent-vivid)]">
                    <Download size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">
                        {needRefresh ? "New content available" : "Install UniGro"}
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs mb-3">
                        {needRefresh
                            ? "A new version of UniGro is available. Update now to get the latest features."
                            : isIOS
                                ? 'On iOS, tap Share and choose "Add to Home Screen".'
                                : "Install for faster access and better experience."}
                    </p>

                    {needRefresh && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateServiceWorker(true)}
                            className="w-full font-bold sm:w-auto mt-2"
                        >
                            Update now
                        </Button>
                    )}
                    {!needRefresh && deferredPrompt && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                                track("pwa_install_prompt_shown");
                                await deferredPrompt.prompt();
                                const result = await deferredPrompt.userChoice;
                                track("pwa_install_prompt_result", { outcome: result.outcome });
                                setDeferredPrompt(null);
                            }}
                            className="w-full font-bold sm:w-auto mt-2"
                        >
                            Install app
                        </Button>
                    )}
                </div>
                <Button variant="ghost" size="sm" onClick={close} aria-label="Dismiss prompt" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] h-auto p-1">
                    <X size={16} />
                </Button>
            </Surface>
        </div>
    );
}
