import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { useEntitlements } from "@/hooks/useEntitlements";
import * as Icons from "@/lib/icons";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  placement: "dashboard" | "pools" | "settings" | "pool-overview" | "pool-history" | "success-create" | "success-join";
  title?: string;
  body?: string;
  onUpgrade?: () => void;
  audience?: "organizers" | "all-free";
  className?: string;
}

type PlacementCopy = {
  title: string;
  body: string;
  minHeight: string;
};

const copyByPlacement: Record<AdSlotProps["placement"], PlacementCopy> = {
  dashboard: {
    title: "Sponsored organizer tools",
    body: "Ad slots power the free plan. Upgrade to Pro for an ad-free workspace.",
    minHeight: "136px",
  },
  pools: {
    title: "Sponsored spotlight",
    body: "This feed placement is reserved for free plans and tuned for lightweight browsing surfaces.",
    minHeight: "184px",
  },
  settings: {
    title: "Sponsored support",
    body: "Free plans stay accessible through light sponsorship. Pro keeps the experience ad-free.",
    minHeight: "136px",
  },
  "pool-overview": {
    title: "Sponsored member support",
    body: "A compact sponsorship slot helps keep browse surfaces free while money actions stay clean.",
    minHeight: "136px",
  },
  "pool-history": {
    title: "Sponsored round insights",
    body: "This slot stays inside history only, away from payment and organizer control moments.",
    minHeight: "136px",
  },
  "success-create": {
    title: "Sponsored organizer launchpad",
    body: "A larger sponsor card fits the create-success surface without interrupting the confirmation.",
    minHeight: "220px",
  },
  "success-join": {
    title: "Sponsored member companion",
    body: "A compact sponsor slot sits below the success summary while your next action stays primary.",
    minHeight: "168px",
  },
};

const slotByPlacement: Record<AdSlotProps["placement"], string | undefined> = {
  dashboard: import.meta.env.VITE_ADSENSE_SLOT_DASHBOARD,
  pools: import.meta.env.VITE_ADSENSE_SLOT_POOLS,
  settings: import.meta.env.VITE_ADSENSE_SLOT_SETTINGS,
  "pool-overview": import.meta.env.VITE_ADSENSE_SLOT_POOL_OVERVIEW,
  "pool-history": import.meta.env.VITE_ADSENSE_SLOT_POOL_HISTORY,
  "success-create": import.meta.env.VITE_ADSENSE_SLOT_SUCCESS_CREATE,
  "success-join": import.meta.env.VITE_ADSENSE_SLOT_SUCCESS_JOIN,
};

const rawClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim();
const clientId = rawClientId
  ? rawClientId.startsWith("ca-pub-")
    ? rawClientId
    : `ca-pub-${rawClientId}`
  : undefined;

let adsenseScriptPromise: Promise<void> | null = null;

function loadAdSenseScript() {
  if (typeof window === "undefined" || !clientId) {
    return Promise.reject(new Error("Missing AdSense client id"));
  }

  if (adsenseScriptPromise) return adsenseScriptPromise;

  const existing = document.querySelector<HTMLScriptElement>('script[data-unigro-adsense="true"]');
  if (existing) {
    adsenseScriptPromise = Promise.resolve();
    return adsenseScriptPromise;
  }

  adsenseScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.crossOrigin = "anonymous";
    script.dataset.unigroAdsense = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load AdSense script"));
    document.head.appendChild(script);
  });

  return adsenseScriptPromise;
}

function PlaceholderCard({
  title,
  body,
  minHeight,
  onUpgrade,
  className,
  reason,
}: {
  title: string;
  body: string;
  minHeight: string;
  onUpgrade?: () => void;
  className?: string;
  reason?: string;
}) {
  return (
    <Surface
      tier={2}
      className={cn("rounded-[26px] border border-[var(--border-subtle)]/70 p-4", className)}
      style={{ minHeight }}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[var(--warning)]">Sponsored</p>
          <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
          {reason ? <p className="mt-3 text-[11px] text-[var(--text-muted)]/80">{reason}</p> : null}
        </div>
        {onUpgrade ? (
          <Button size="sm" variant="secondary" className="shrink-0 rounded-full" onClick={onUpgrade}>
            Remove ads
          </Button>
        ) : null}
      </div>
    </Surface>
  );
}

export function AdSlot({ placement, title, body, onUpgrade, audience = "organizers", className }: AdSlotProps) {
  const { entitlements } = useEntitlements();
  const adRef = useRef<HTMLModElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error" | "unfilled">("idle");

  const shouldShow =
    audience === "all-free"
      ? !entitlements.adsDisabled
      : entitlements.canShowAds;

  const copy = copyByPlacement[placement];
  const slotId = slotByPlacement[placement];
  const hasConfig = Boolean(clientId && slotId);

  const shouldUsePlaceholder = useMemo(() => !hasConfig || import.meta.env.DEV, [hasConfig]);

  useEffect(() => {
    if (!shouldShow || shouldUsePlaceholder || !slotId || !clientId || !adRef.current) return;

    let cancelled = false;
    let observer: MutationObserver | null = null;

    setStatus("loading");

    loadAdSenseScript()
      .then(() => {
        if (cancelled || !adRef.current) return;

        observer = new MutationObserver(() => {
          const adStatus = adRef.current?.getAttribute("data-ad-status");
          if (!adStatus) return;
          setStatus(adStatus === "unfilled" ? "unfilled" : "ready");
        });

        observer.observe(adRef.current, { attributes: true, attributeFilter: ["data-ad-status"] });
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [shouldShow, shouldUsePlaceholder, slotId]);

  if (!shouldShow) return null;

  if (shouldUsePlaceholder) {
    const reason = !hasConfig
      ? "Add VITE_ADSENSE_CLIENT_ID and the placement slot ids to start loading real Google ads."
      : "Development mode uses a safe placeholder instead of requesting live ad inventory.";

    return (
      <PlaceholderCard
        title={title || copy.title}
        body={body || copy.body}
        minHeight={copy.minHeight}
        onUpgrade={onUpgrade}
        className={className}
        reason={reason}
      />
    );
  }

  const isBlocked = status === "error";
  const isUnfilled = status === "unfilled";

  return (
    <Surface
      tier={2}
      className={cn("relative rounded-[26px] border border-[var(--border-subtle)]/70 p-2.5", className)}
      style={{ minHeight: copy.minHeight }}
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[var(--warning)]">Sponsored</p>
        {onUpgrade ? (
          <Button size="sm" variant="secondary" className="h-8 shrink-0 rounded-full px-3 text-xs" onClick={onUpgrade}>
            Remove ads
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <ins
          ref={adRef}
          className="adsbygoogle block w-full overflow-hidden rounded-[22px]"
          style={{
            display: status === "ready" ? "block" : "none",
            minHeight: `calc(${copy.minHeight} - 24px)`,
            margin: 0,
            padding: 0,
          }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
          data-adtest={import.meta.env.DEV ? "on" : undefined}
        />

        {(isBlocked || isUnfilled) ? (
          <div
            className="flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500"
            style={{ minHeight: `calc(${copy.minHeight} - 24px)` }}
          >
            <div className="h-10 w-10 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center text-[var(--text-muted)] opacity-40 mb-3">
              <Icons.ShieldAlertIcon size={20} />
            </div>
            <p className="text-[11px] font-bold text-[var(--text-primary)] mb-1">
              {isBlocked ? "Ad Content Blocked" : "Sponsorship Pending"}
            </p>
            <p className="text-[10px] leading-relaxed text-[var(--text-muted)] max-w-[200px]">
              {isBlocked
                ? "Browser settings are limiting ad delivery. Support UniGro by upgrading to Pro."
                : "Live inventory is loading. We keep browse surfaces light and accessible."}
            </p>
          </div>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-x-6 bottom-6 top-12 rounded-[22px] border border-[var(--border-subtle)]/35 bg-[var(--surface-1)]/35" />
      ) : null}
    </Surface>
  );
}
