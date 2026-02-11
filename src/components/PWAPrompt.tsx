import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';

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

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-[#232931] border border-white/10 p-4 rounded-xl shadow-2xl max-w-sm flex items-start gap-4">
                <div className="bg-[#C1FF72]/10 p-2 rounded-lg text-[#C1FF72]">
                    <Download size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white text-sm mb-1">
                        {offlineReady ? "App ready to work offline" : "New content available"}
                    </h3>
                    <p className="text-gray-400 text-xs mb-3">
                        {offlineReady
                            ? "You can now use this app without an internet connection."
                            : "A new version of GrowPot is available. Update now to get the latest features."}
                    </p>

                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="bg-[#C1FF72] text-[#1B3022] text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90"
                        >
                            Update Now
                        </button>
                    )}
                </div>
                <button onClick={close} className="text-gray-500 hover:text-white">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
