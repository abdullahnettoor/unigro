import { useCallback, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PWAPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
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
    const [dismissed, setDismissed] = useState(false);

    const track = useCallback((event: string, details?: Record<string, unknown>) => {
        const w = window as any;
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
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const showInstallHint = !dismissed && !isStandalone && (Boolean(deferredPrompt) || isIOS);

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
        track("pwa_prompt_dismissed");
        setDeferredPrompt(null);
        setDismissed(true);
    };

    if (!offlineReady && !needRefresh && !showInstallHint) return null;

    return (
        <div className="fixed inset-x-3 bottom-3 z-50 animate-in slide-in-from-bottom-5 sm:inset-x-auto sm:right-4 sm:bottom-4">
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/95 p-4 shadow-2xl sm:max-w-sm">
                <div className="rounded-lg bg-[var(--accent-vivid)]/10 p-2 text-[var(--accent-vivid)]">
                    <Download size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">
                        {needRefresh
                            ? "New content available"
                            : offlineReady
                                ? "App ready to work offline"
                                : "Install GrowPot"}
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs mb-3">
                        {needRefresh
                            ? "A new version of GrowPot is available. Update now to get the latest features."
                            : offlineReady
                                ? "You can now use this app without an internet connection."
                                : isIOS
                                    ? "On iOS, tap Share and choose “Add to Home Screen”."
                                    : "Install for faster access and offline support."}
                    </p>

                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="w-full rounded-lg bg-[var(--accent-vivid)] px-3 py-2 text-sm font-bold text-[var(--text-on-accent)] transition-opacity hover:opacity-90 sm:w-auto sm:text-xs sm:py-1.5"
                        >
                            Update now
                        </button>
                    )}
                    {!needRefresh && !offlineReady && deferredPrompt && (
                        <button
                            onClick={async () => {
                                track("pwa_install_prompt_shown");
                                await deferredPrompt.prompt();
                                const result = await deferredPrompt.userChoice;
                                track("pwa_install_prompt_result", { outcome: result.outcome });
                                setDeferredPrompt(null);
                            }}
                            className="w-full rounded-lg bg-[var(--accent-vivid)] px-3 py-2 text-sm font-bold text-[var(--text-on-accent)] transition-opacity hover:opacity-90 sm:w-auto sm:text-xs sm:py-1.5"
                        >
                            Install app
                        </button>
                    )}
                </div>
                <button onClick={close} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
