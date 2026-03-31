/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly VITE_ADSENSE_CLIENT_ID?: string
    readonly VITE_ADSENSE_SLOT_DASHBOARD?: string
    readonly VITE_ADSENSE_SLOT_POOLS?: string
    readonly VITE_ADSENSE_SLOT_SETTINGS?: string
    readonly VITE_ADSENSE_SLOT_POOL_OVERVIEW?: string
    readonly VITE_ADSENSE_SLOT_POOL_HISTORY?: string
    readonly VITE_ADSENSE_SLOT_SUCCESS_CREATE?: string
    readonly VITE_ADSENSE_SLOT_SUCCESS_JOIN?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module 'virtual:pwa-register/react' {
    import type { Dispatch, SetStateAction } from 'react'

    export interface RegisterSWOptions {
        immediate?: boolean
        onNeedRefresh?: () => void
        onOfflineReady?: () => void
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
        onRegisterError?: (error: any) => void
    }

    export function useRegisterSW(options?: RegisterSWOptions): {
        needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
        offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
        updateServiceWorker: (reloadPage?: boolean) => Promise<void>
    }
}
