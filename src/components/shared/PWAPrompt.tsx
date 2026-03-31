import { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type IOSNavigator = Navigator & { standalone?: boolean };

const DISMISS_KEY = "pwa_prompt_dismissed_at";
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

export function PWAPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) { console.log('SW Registered:', r); },
        onRegisterError(error) { console.log('SW registration error', error); },
    });

    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(() => {
        const at = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
        return at > 0 && Date.now() - at < DISMISS_COOLDOWN_MS;
    });

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as IOSNavigator).standalone;

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const close = useCallback(() => {
        setNeedRefresh(false);
        setDeferredPrompt(null);
        setDismissed(true);
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }, [setNeedRefresh]);

    const showInstallHint = !dismissed && !isStandalone && (Boolean(deferredPrompt) || isIOS);

    if (!needRefresh && !showInstallHint) return null;

    return (
        <div className="fixed inset-x-3 bottom-3 z-50 animate-in slide-in-from-bottom-5 sm:inset-x-auto sm:right-4 sm:bottom-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl shadow-2xl sm:max-w-sm border border-white/10 backdrop-blur-xl bg-[var(--surface-card)]/80">
                <div className="rounded-lg bg-[var(--accent-vivid)]/10 p-2 text-[var(--accent-vivid)] shrink-0">
                    <Download size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">
                        {needRefresh ? "New content available" : "Install UniGro"}
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs mb-3">
                        {needRefresh
                            ? "A new version of UniGro is available. Update now."
                            : isIOS
                                ? 'Tap Share → "Add to Home Screen" to install.'
                                : "Install for faster access and better experience."}
                    </p>
                    {needRefresh && (
                        <Button
                            size="sm"
                            onClick={() => updateServiceWorker(true)}
                            className="w-full sm:w-auto"
                        >
                            Update now
                        </Button>
                    )}
                    {!needRefresh && deferredPrompt && (
                        <Button
                            size="sm"
                            onClick={async () => {
                                await deferredPrompt.prompt();
                                setDeferredPrompt(null);
                            }}
                            className="w-full sm:w-auto"
                        >
                            Install app
                        </Button>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={close} aria-label="Dismiss">
                    <X size={16} />
                </Button>
            </div>
        </div>
    );
}
