import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { useEntitlements } from "@/hooks/useEntitlements";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  placement: "dashboard" | "pools" | "settings" | "pool-overview" | "pool-history" | "success-create" | "success-join";
  title?: string;
  body?: string;
  onUpgrade?: () => void;
  audience?: "organizers" | "all-free";
  className?: string;
}

const copyByPlacement: Record<AdSlotProps["placement"], { title: string; body: string }> = {
  dashboard: {
    title: "Sponsored organizer tools",
    body: "Ad slots will power the free organizer plan. Upgrade to Pro for an ad-free workspace.",
  },
  pools: {
    title: "Sponsored spotlight",
    body: "Browse ads are limited to free organizer surfaces. Pro organizers never see these placements.",
  },
  settings: {
    title: "Sponsored support",
    body: "Free plans stay accessible through light sponsorship. Upgrade if you want a clean, ad-free setup.",
  },
  "pool-overview": {
    title: "Sponsored member support",
    body: "This light sponsorship helps keep member views free while payments and organizer actions stay untouched.",
  },
  "pool-history": {
    title: "Sponsored round insights",
    body: "A compact sponsorship slot inside history keeps the browsing flow sustainable without interrupting payment actions.",
  },
  "success-create": {
    title: "Sponsored organizer launchpad",
    body: "A larger sponsor card fits naturally into the create-success moment while your next step stays clear and primary.",
  },
  "success-join": {
    title: "Sponsored member companion",
    body: "A compact sponsor card can sit below the join success summary while the pool actions stay front and center.",
  },
};

export function AdSlot({ placement, title, body, onUpgrade, audience = "organizers", className }: AdSlotProps) {
  const { entitlements } = useEntitlements();

  const shouldShow =
    audience === "all-free"
      ? !entitlements.adsDisabled
      : entitlements.canShowAds;

  if (!shouldShow) return null;

  const copy = copyByPlacement[placement];

  return (
    <Surface tier={2} className={cn("rounded-[26px] border border-[var(--border-subtle)]/70 p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[var(--warning)]">Sponsored</p>
          <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{title || copy.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{body || copy.body}</p>
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
