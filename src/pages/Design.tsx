import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectionControl } from "@/components/ui/selection-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import * as Icons from "@/lib/icons";
import { LogoLoader } from "@/components/ui/LogoLoader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StatTile } from "@/components/dashboard/StatTile";
import { PoolCard, type PoolItem } from "@/components/dashboard/PoolCard";
import { DatePicker } from "@/components/ui/DatePicker";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-10", className)}>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
        {title}
      </p>
      {children}
    </section>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("glass-2 rounded-[22px] border border-[var(--border-subtle)] p-5", className)}>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-2.5 border-b border-[var(--border-subtle)]/40 last:border-0">
      <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────
function Swatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="h-10 w-10 rounded-2xl border border-[var(--border-subtle)]/60 shadow-[var(--shadow-1)]"
        style={{ background: `var(${token})` }}
      />
      <p className="text-[9px] font-semibold text-[var(--text-muted)] text-center leading-tight">
        {label ?? token.replace("--", "")}
      </p>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="w-full">
      {label && <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">{label}</p>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--accent-vivid)] transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1 text-right text-[10px] text-[var(--text-muted)]">{value}%</p>
    </div>
  );
}

const demoPools: PoolItem[] = [
  {
    _id: "demo-1",
    title: "Family Savings Circle",
    status: "ACTIVE",
    currentRound: 3,
    organizer: { name: "Rahman" },
    config: {
      totalSeats: 12,
      contribution: 5000,
      currency: "INR",
      frequency: "Monthly",
      duration: 12,
      totalValue: 60000,
    },
  },
  {
    _id: "demo-2",
    title: "Rahman Office Pool",
    status: "DRAFT",
    currentRound: 0,
    organizer: { name: "Khalid" },
    config: {
      totalSeats: 8,
      contribution: 3000,
      currency: "INR",
      frequency: "Weekly",
      duration: 8,
      totalValue: 24000,
    },
  },
  {
    _id: "demo-3",
    title: "Community Circle",
    status: "COMPLETED",
    currentRound: 20,
    organizer: { name: "Leena" },
    config: {
      totalSeats: 20,
      contribution: 10000,
      currency: "INR",
      frequency: "Monthly",
      duration: 20,
      totalValue: 200000,
    },
  },
];

// ─── Bottom nav mock ──────────────────────────────────────────────────────────
function BottomNavDemo() {
  const [active, setActive] = useState(0);
  const items = [
    { icon: Icons.NavHomeIcon, label: "Home" },
    { icon: Icons.NavPoolsIcon, label: "Pools" },
    { icon: Icons.NavSettingsIcon, label: "Settings" },
  ];
  return (
    <div className="flex items-center rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden w-fit mx-auto">
      {items.map((item, i) => {
        const isActive = active === i;
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => setActive(i)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 w-[80px] py-3 transition-colors",
              isActive ? "text-[var(--accent-vivid)]" : "text-[var(--text-muted)]"
            )}
          >
            {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-6 rounded-full bg-[var(--accent-vivid)]" />}
            {isActive && <span className="absolute inset-[3px] rounded-[15px] bg-[var(--accent-vivid)]/10" />}
            <span className={cn("transition-all", isActive ? "scale-[1.12]" : "scale-100")}>
              <Icon strokeWidth={isActive ? 2.2 : 1.8} className="h-5 w-5" />
            </span>
            <span className={cn("text-[10px] leading-none", isActive ? "font-semibold" : "font-medium opacity-70")}>
              {item.label}
            </span>
            {i < items.length - 1 && <span className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-[var(--border-subtle)]/60" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function Design() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [demoDate, setDemoDate] = useState("2025-04-01");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6">

      {/* ── Header ── */}
      <header className="glass-3 relative overflow-hidden rounded-[24px] border border-[var(--border-subtle)] p-5">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-glass-gradient)] opacity-60" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--accent-vivid)]/20 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Design System</p>
          <h1 className="mt-3 font-display text-[var(--type-3xl)] font-bold text-[var(--text-primary)]">
            UniGro UI Kit
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[var(--text-muted)]">
            Visual design tokens, component states, and layout patterns. Review and approve before rollout.
          </p>
        </div>
      </header>

      {/* ── 1. Typography ── */}
      <Section title="01 — Typography">
        <Card>
          <div className="space-y-1">
            {[
              { label: "XS · 0.72", size: "var(--type-xs)", weight: "font-medium", sample: "Pool status label" },
              { label: "SM · 0.84", size: "var(--type-sm)", weight: "font-medium", sample: "Body / subheading" },
              { label: "MD · 0.98", size: "var(--type-md)", weight: "font-normal", sample: "Default body text reads naturally" },
              { label: "LG · 1.1", size: "var(--type-lg)", weight: "font-semibold", sample: "Section heading" },
              { label: "XL · 1.35", size: "var(--type-xl)", weight: "font-bold", sample: "Page sub-title" },
              { label: "2XL · 1.7", size: "var(--type-2xl)", weight: "font-bold font-display", sample: "Stat value: ₹1,20,000" },
              { label: "3XL · 2.15", size: "var(--type-3xl)", weight: "font-bold font-display", sample: "Hero headline" },
              { label: "4XL · 2.7", size: "var(--type-4xl)", weight: "font-bold font-display", sample: "Display" },
            ].map(({ label, size, weight, sample }) => (
              <div key={label} className="flex items-baseline justify-between gap-4 border-b border-[var(--border-subtle)]/40 py-2 last:border-0">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[var(--text-muted)]">{label}</span>
                <span className={cn(weight, "text-[var(--text-primary)] text-right")} style={{ fontSize: `var(${size})` }}>
                  {sample}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ── 2. Color Palette ── */}
      <Section title="02 — Color palette">
        <Card>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Brand</p>
          <div className="flex flex-wrap gap-3">
            {[
              { token: "--accent-vivid", label: "Vivid" },
              { token: "--accent-secondary", label: "Secondary" },
              { token: "--accent-soft", label: "Soft" },
            ].map((s) => <Swatch key={s.token} {...s} />)}
          </div>

          <p className="mb-3 mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Status</p>
          <div className="flex flex-wrap gap-3">
            {[
              { token: "--success", label: "Success" },
              { token: "--warning", label: "Warning" },
              { token: "--danger", label: "Danger" },
              { token: "--gold", label: "Gold" },
            ].map((s) => <Swatch key={s.token} {...s} />)}
          </div>

          <p className="mb-3 mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Surfaces</p>
          <div className="flex flex-wrap gap-3">
            {(["--surface-0", "--surface-1", "--surface-2", "--surface-3", "--bg-app"] as const).map((t) => (
              <Swatch key={t} token={t} label={t.replace("--", "")} />
            ))}
          </div>

          <p className="mb-3 mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Text</p>
          <div className="flex flex-wrap gap-3">
            {[
              { token: "--text-primary", label: "Primary" },
              { token: "--text-muted", label: "Muted" },
              { token: "--text-on-accent", label: "On accent" },
            ].map((s) => <Swatch key={s.token} {...s} />)}
          </div>
        </Card>
      </Section>

      {/* ── 3. Glass surfaces ── */}
      <Section title="03 — Surfaces &amp; Glass">
        <div className="flex flex-wrap gap-3">
          {(["glass-1", "glass-2", "glass-3"] as const).map((cls) => (
            <div key={cls} className={cn("flex-1 min-w-[140px] rounded-[22px] border border-[var(--border-subtle)] p-4 flex flex-col gap-1", cls)}>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">{cls}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {cls === "glass-1" ? "Low blur · subtle" : cls === "glass-2" ? "Mid blur · cards" : "High blur · overlays"}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="glass-sticky rounded-[22px] border border-[var(--border-subtle)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">glass-sticky</p>
            <p className="text-xs text-[var(--text-muted)]">Headers / navbars that need to stay readable when scrolling</p>
          </div>
        </div>
      </Section>

      {/* ── 4. Buttons ── */}
      <Section title="04 — Buttons">
        <Card>
          <Row label="Default">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row label="Variants">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </Row>
          <Row label="States">
            <Button disabled>Disabled</Button>
            <Button>
              <Icons.LoadingIcon className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </Button>
          </Row>
          <Row label="With icon">
            <Button size="sm">
              <Icons.CreateIcon className="mr-1.5 h-3.5 w-3.5" /> New Pool
            </Button>
            <Button>
              <Icons.PoolIcon className="mr-2 h-4 w-4" /> Create Pool
            </Button>
            <Button variant="outline" size="lg">
              View all <Icons.ArrowIcon className="ml-2 h-4 w-4" />
            </Button>
          </Row>
          <Row label="Pill">
            <Button className="rounded-full" size="sm">
              <Icons.CreateIcon className="mr-1.5 h-3.5 w-3.5" /> Create
            </Button>
            <Button className="rounded-full">Join Pool</Button>
          </Row>
        </Card>
      </Section>

      {/* ── 5. Form Inputs ── */}
      <Section title="05 — Form inputs">
        <p className="mb-3 text-[10px] text-[var(--text-muted)]">
          Inputs use rounded-2xl (radius-2). Focus state replaces hard borders with a soft 4px glow (accent-vivid/10).
        </p>
        <Card className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Text input</label>
            <Input placeholder="e.g. Family Savings Circle" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Number input</label>
            <Input type="number" placeholder="₹5,000" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Textarea</label>
            <Textarea placeholder="Pool terms or expectations (optional)..." rows={3} />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Select</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Payment frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Date Picker</label>
            <DatePicker value={demoDate} onChange={setDemoDate} />
            <p className="mt-2 text-[10px] text-[var(--text-muted)] italic">Uses a pill-shaped trigger with a glassmorphic calendar popover.</p>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Add payment details</p>
              <p className="text-xs text-[var(--text-muted)]">Showcases checkbox + radio control styling.</p>
            </div>
            <div className="flex items-center gap-3">
              <SelectionControl checked variant="checkbox" />
              <SelectionControl checked={false} variant="radio" />
            </div>
          </div>
        </Card>
      </Section>

      {/* ── 6. Badges ── */}
      <Section title="06 — Badges &amp; Labels">
        <Card>
          <Row label="Pool status">
            <StatusBadge status="ACTIVE" />
            <StatusBadge status="DRAFT" />
            <StatusBadge status="COMPLETED" />
            <StatusBadge status="ARCHIVED" />
          </Row>
          <Row label="Payment">
            <StatusBadge status="PAID" />
            <StatusBadge status="PENDING" />
            <StatusBadge status="UNPAID" />
          </Row>
          <Row label="Pill labels">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-vivid)]/12 px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-vivid)]">
              <Icons.PoolIcon size={10} /> Organizer
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)]">
              <Icons.SeatIcon size={10} /> Seat #3
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/12 px-2.5 py-1 text-[10px] font-semibold text-[var(--gold)]">
              <Icons.WinnerIcon size={10} /> Winner
            </span>
          </Row>
        </Card>
      </Section>

      {/* ── 7. Progress ── */}
      <Section title="07 — Progress &amp; Indicators">
        <Card className="space-y-5">
          <ProgressBar value={25} label="Round progress · 3 of 12" />
          <ProgressBar value={60} label="Seat fill · 7 of 12" />
          <ProgressBar value={83} label="Payments collected · 10 of 12" />
          <ProgressBar value={100} label="Cycle complete" />
        </Card>
      </Section>

      {/* ── 8. Stat Tiles ── */}
      <Section title="08 — Stat tiles">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={Icons.PoolIcon} label="My pools" value="12" hint="3 drafts" />
          <StatTile icon={Icons.ActivePoolIcon} label="Active" value="4" hint="Running" accent />
          <StatTile icon={Icons.TotalValueIcon} label="Total value" value="₹2.4L" hint="All pools" />
          <StatTile icon={Icons.TrendIcon} label="Rounds" value="38" hint="Tracked" />
        </div>
      </Section>

      {/* ── 09. Pool card ── */}
      <Section title="09 — Pool card">
        <p className="mb-3 text-[10px] text-[var(--text-muted)]">Member-first hierarchy with inline frequency + single-line progress dots.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {demoPools.map((pool) => (
            <PoolCard key={pool._id} pool={pool} />
          ))}
          <div className="glass-2 flex flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-[var(--border-subtle)] p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-vivid)]/10 text-[var(--accent-vivid)]">
              <Icons.PoolIcon size={22} />
            </div>
            <p className="font-semibold text-[var(--text-primary)]">No pools yet</p>
            <p className="text-xs text-[var(--text-muted)]">Create or join a pool to start saving.</p>
            <Button size="sm" className="mt-1 rounded-full">
              <Icons.CreateIcon className="mr-1.5 h-3.5 w-3.5" /> Create a Pool
            </Button>
          </div>
        </div>
      </Section>

      {/* ── 10. Callouts & alerts ── */}
      <Section title="10 — Callouts">
        <div className="space-y-3">
          {[
            { color: "accent-vivid", icon: Icons.PoolIcon, title: "Pool activated", body: "All seats are filled. Round 1 begins on 1 Apr 2025." },
            { color: "warning", icon: Icons.DraftIcon, title: "2 pools need attention", body: "Fill all seats and activate to begin rounds." },
            { color: "danger", icon: Icons.DrawIcon, title: "Payment overdue", body: "Round 3 contribution not received from Seat #7." },
            { color: "success", icon: Icons.WinnerIcon, title: "Draw complete", body: "Seat #4 — Aisha Khan won round 3. ₹60,000 disbursed." },
          ].map(({ color, icon: Icon, title, body }) => (
            <div key={title} className={cn("flex items-start gap-3 rounded-[18px] border p-4", `border-[var(--${color})]/30 bg-[var(--${color})]/6`)}>
              <div className={cn("shrink-0 rounded-xl p-2", `bg-[var(--${color})]/15 text-[var(--${color})]`)}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 11. Modal ── */}
      <Section title="11 — Modal / Dialog">
        <Card>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">Open modal preview</Button>
            </DialogTrigger>
            <DialogContent className="glass-3 border border-[var(--border-subtle)]">
              <div className="space-y-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Confirmation</p>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">Archive this pool?</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  This will lock the pool and prevent any further contributions. Members will still be able to view history.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setDialogOpen(false)}>Archive</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </Section>

      {/* ── 12. Icons ── */}
      <Section title="12 — Icon registry (50 icons)">
        <Card>
          {([
            { group: "Navigation", icons: ["NavHomeIcon", "NavPoolsIcon", "NavSettingsIcon", "NavAdminIcon", "NavMenuIcon"] },
            { group: "Pool", icons: ["PoolIcon", "ActivePoolIcon", "DraftIcon", "CompletedIcon", "SeatIcon", "SeatCountIcon", "OrganizerIcon", "DrawIcon", "WinnerIcon", "RoundIcon"] },
            { group: "Finance", icons: ["ContributionIcon", "TotalValueIcon", "TransactionIcon", "ReceiptIcon", "CommissionIcon", "BankIcon"] },
            { group: "Member / Seat", icons: ["SeatNumberIcon", "JoinIcon", "InviteIcon", "ShareIcon"] },
            { group: "Media / Proof", icons: ["UploadImageIcon", "CameraIcon"] },
            { group: "Status", icons: ["LoadingIcon", "TrendIcon", "CheckIcon", "InfoIcon", "BellIcon", "HistoryIcon"] },
            { group: "Actions", icons: ["CreateIcon", "EditIcon", "DeleteIcon", "CopyIcon", "DownloadIcon", "SearchIcon", "FilterIcon", "SortIcon", "StartDateIcon", "CloseIcon"] },
            { group: "Nav helpers", icons: ["DetailIcon", "ExpandIcon", "ArrowIcon", "CoinsIcon", "LayersIcon", "ZapIcon", "ClockIcon"] },
          ] as const).map(({ group, icons }) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">{group}</p>
              <div className="flex flex-wrap gap-3">
                {icons.map((name) => {
                  const Icon = (Icons as Record<string, React.ElementType>)[name];
                  return Icon ? (
                    <div key={name} className="flex flex-col items-center gap-1 w-14 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-primary)]">
                        <Icon size={17} />
                      </div>
                      <p className="text-[8px] font-mono text-[var(--text-muted)] leading-tight break-all">{name.replace("Icon", "")}</p>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </Card>
      </Section>

      {/* ── 13. Navigation ── */}
      <Section title="13 — Navigation components">
        <div className="space-y-4">
          <Card>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Bottom Nav (interactive)</p>
            <BottomNavDemo />
            <p className="mt-3 text-center text-xs text-[var(--text-muted)]">Tap items to switch active state</p>
          </Card>

          <Card>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Desktop Rail (static mock)</p>
            <div className="flex flex-wrap gap-3">
              {/* Collapsed */}
              <div className="glass-2 flex w-14 flex-col items-center gap-1 rounded-[18px] border border-[var(--border-subtle)] py-4">
                {[Icons.NavHomeIcon, Icons.NavPoolsIcon, Icons.NavSettingsIcon].map((Icon, i) => (
                  <div key={i} className={cn("flex h-10 w-10 items-center justify-center rounded-xl", i === 0 ? "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]" : "text-[var(--text-muted)]")}>
                    <Icon size={19} strokeWidth={i === 0 ? 2.2 : 1.8} />
                  </div>
                ))}
              </div>
              {/* Expanded */}
              <div className="glass-2 flex min-w-[160px] flex-col gap-1 rounded-[18px] border border-[var(--border-subtle)] p-2">
                {[
                  { icon: Icons.NavHomeIcon, label: "Home", active: true },
                  { icon: Icons.NavPoolsIcon, label: "My Pools", active: false },
                  { icon: Icons.NavSettingsIcon, label: "Settings", active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div key={label} className={cn("flex items-center gap-3 rounded-xl px-3 py-2", active ? "bg-[var(--accent-vivid)]/12 text-[var(--accent-vivid)]" : "text-[var(--text-muted)]")}>
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                    <span className={cn("text-sm", active ? "font-semibold" : "font-medium")}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── 14. Radius tokens ── */}
      <Section title="14 — Radius tokens">
        <Card>
          <div className="flex flex-wrap gap-4">
            {[
              { token: "radius-1", value: "14px", use: "Inputs, small chips" },
              { token: "radius-2", value: "20px", use: "Stat tiles, sections" },
              { token: "radius-3", value: "28px", use: "Cards, modals" },
              { token: "radius-4", value: "34px", use: "Pills, hero blocks" },
            ].map(({ token, value, use }) => (
              <div key={token} className="flex flex-col items-start gap-2">
                <div
                  className="h-14 w-14 border-2 border-[var(--accent-vivid)]/40 bg-[var(--accent-vivid)]/8"
                  style={{ borderRadius: `var(--${token})` }}
                />
                <div>
                  <p className="text-[10px] font-mono font-bold text-[var(--text-muted)]">{token}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">{value}</p>
                  <p className="text-[9px] text-[var(--text-muted)] italic">{use}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ── 15. Custom loader ── */}
      <Section title="15 — Custom loader">
        <Card>
          <p className="mb-4 text-xs text-[var(--text-muted)]">Our logo SVG with staggered fade pulse — left blade → middle → right. Use at different sizes depending on context.</p>
          <div className="flex flex-wrap items-end gap-8">
            {(["sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <LogoLoader size={size} />
                <p className="text-[10px] font-mono text-[var(--text-muted)]">size={size}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] bg-[var(--surface-2)] py-10">
              <LogoLoader size="lg" />
              <p className="text-xs text-[var(--text-muted)]">Full-page load</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] bg-[var(--surface-2)] py-10">
              <div className="flex items-center gap-3">
                <LogoLoader size="sm" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Processing payment…</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Inline / button load state</p>
            </div>
          </div>
        </Card>
      </Section>

      {/* ── 16. Progress system ── */}
      <Section title="16 — Progress — context-aware">
        <p className="mb-3 text-[10px] text-[var(--text-muted)]">
          Three distinct contexts, three distinct colours. Never mix them — each must be readable at a glance.
        </p>
        <Card className="space-y-6">

          {/* Rounds */}
          <div>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Round progress — accent-vivid</p>
            <p className="mb-3 text-[10px] text-[var(--text-muted)]">How far through the full cycle. Shown on ACTIVE pools.</p>
            {[{ label: "Round 1 of 12", v: 8 }, { label: "Round 4 of 12", v: 33 }, { label: "Round 9 of 12", v: 75 }].map(({ label, v }) => (
              <div key={label} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">{label}</span>
                  <span className="text-[10px] font-bold text-[var(--accent-vivid)]">{v}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div className="h-full rounded-full bg-[var(--accent-vivid)] transition-all" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-[var(--border-subtle)]/50" />

          {/* Seat fill */}
          <div>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Seat fill — warning amber (invitation energy)</p>
            <p className="mb-3 text-[10px] text-[var(--text-muted)]">How many seats are taken. Shown on DRAFT pools. Changes urgency as it fills up.</p>
            {[{ label: "3 of 12 seats filled", v: 25 }, { label: "8 of 12 seats filled", v: 67 }, { label: "11 of 12 seats filled", v: 92 }].map(({ label, v }) => (
              <div key={label} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">{label}</span>
                  <span className="text-[10px] font-bold text-[var(--warning)]">{v}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div className="h-full rounded-full bg-[var(--warning)] transition-all" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-[var(--border-subtle)]/50" />

          {/* Payment collection */}
          <div>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Payment collection — success green</p>
            <p className="mb-3 text-[10px] text-[var(--text-muted)]">Contributions received for the current round. Shown inside an active round view.</p>
            {[{ label: "4 of 12 paid", v: 33 }, { label: "10 of 12 paid", v: 83 }, { label: "12 of 12 paid", v: 100 }].map(({ label, v }) => (
              <div key={label} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">{label}</span>
                  <span className="text-[10px] font-bold text-[var(--success)]">{v === 100 ? "Complete ✓" : `${v}%`}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div className={cn("h-full rounded-full transition-all", v === 100 ? "bg-[var(--success)]" : "bg-[var(--success)]")} style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-[var(--border-subtle)]/50" />

          {/* Dot grid — seat visualiser */}
          <div>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Seat grid — dot visualiser (alternative to bar)</p>
            <p className="mb-3 text-[10px] text-[var(--text-muted)]">For 12 or fewer seats. Each dot = one seat. Filled = taken, empty = available, gold = winner.</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const state = i < 7 ? "filled" : i === 9 ? "winner" : "empty";
                return (
                  <div
                    key={i}
                    title={`Seat ${i + 1}: ${state}`}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 grid place-items-center text-[9px] font-bold transition-all",
                      state === "filled" && "border-[var(--accent-vivid)] bg-[var(--accent-vivid)]/20 text-[var(--accent-vivid)]",
                      state === "winner" && "border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]",
                      state === "empty" && "border-[var(--border-subtle)] bg-transparent text-[var(--text-muted)]"
                    )}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">7 filled · 1 won (gold) · 4 open</p>
          </div>

        </Card>
      </Section>

      {/* ── 17. Modals & Dialogs ── */}
      <Section title="17 — Modals &amp; Dialogs">
        <Card className="space-y-4">
          <p className="text-xs text-[var(--text-muted)]">All dialogs use glass-3 surface. Three core patterns: confirmation, form entry, and danger.</p>

          {/* Confirmation modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Confirmation dialog</Button>
            </DialogTrigger>
            <DialogContent className="glass-3 border border-[var(--border-subtle)] max-w-sm rounded-[28px] focus:outline-none">
              <DialogHeader>
                <div className="mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Activation</p>
                </div>
                <DialogTitle className="font-display text-xl font-bold text-[var(--text-primary)] leading-tight">Activate pool?</DialogTitle>
                <DialogDescription className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Once activated, members will be assigned rounds and contributions will begin. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-8 flex flex-col items-stretch gap-3 sm:flex-col">
                <Button className="h-12 w-full rounded-2xl bg-[var(--accent-vivid)] font-bold text-white shadow-lg shadow-[var(--accent-vivid)]/20">Yes, activate</Button>
                <Button variant="outline" className="h-12 w-full rounded-2xl border-[var(--border-subtle)]/60 text-[var(--text-muted)] font-bold">Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Form modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Form dialog</Button>
            </DialogTrigger>
            <DialogContent className="glass-3 border border-[var(--border-subtle)] rounded-[28px] focus:outline-none">
              <DialogHeader>
                <div className="mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-vivid)]">Transaction</p>
                </div>
                <DialogTitle className="font-display text-xl font-bold text-[var(--text-primary)]">Record payment</DialogTitle>
                <DialogDescription className="text-sm text-[var(--text-muted)]">
                  Manually mark a contribution as received for Round 4.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Member</label>
                  <Input placeholder="Search member name…" className="bg-[var(--surface-2)]/40 h-12 rounded-[20px] border-[var(--border-subtle)]/60" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Payment method</label>
                  <Select>
                    <SelectTrigger className="bg-[var(--surface-2)]/40 h-12 rounded-[20px] border-[var(--border-subtle)]/60"><SelectValue placeholder="Choose method" /></SelectTrigger>
                    <SelectContent className="glass-3 rounded-2xl border-[var(--border-subtle)]">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] ml-1">Remarks (optional)</label>
                  <Textarea placeholder="e.g. Paid via GPay #ref123" rows={2} className="bg-[var(--surface-2)]/40 rounded-[20px] border-[var(--border-subtle)]/60" />
                </div>
              </div>
              <DialogFooter className="mt-10 flex flex-col items-stretch gap-3 sm:flex-col">
                <Button className="h-12 w-full rounded-2xl bg-[var(--accent-vivid)] font-bold text-white shadow-lg shadow-[var(--accent-vivid)]/20"><Icons.CheckIcon className="mr-1.5 h-4 w-4" /> Record payment</Button>
                <Button variant="outline" className="h-12 w-full rounded-2xl border-[var(--border-subtle)]/60 text-[var(--text-muted)] font-bold">Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Danger modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">Danger dialog</Button>
            </DialogTrigger>
            <DialogContent className="glass-3 border border-[var(--danger)]/30 max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-display text-lg font-bold text-[var(--danger)]">Delete pool?</DialogTitle>
                <DialogDescription className="text-sm text-[var(--text-muted)]">
                  This will permanently delete <strong className="text-[var(--text-primary)]">Family Savings Circle</strong> and all its data. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-2 flex gap-2">
                <Button variant="outline" className="flex-1">Keep pool</Button>
                <Button variant="destructive" className="flex-1"><Icons.DeleteIcon className="mr-1.5 h-4 w-4" /> Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </Section>

      {/* ── 18. Alerts & Callouts ── */}
      <Section title="18 — Alerts &amp; Callouts">
        <div className="space-y-3">

          {/* Inline callouts */}
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Inline callouts — contextual, non-dismissible</p>
          {[
            { color: "accent-vivid", icon: Icons.InfoIcon, title: "Pool is full", body: "All 12 seats are filled. Activate at any time to begin rounds." },
            { color: "warning", icon: Icons.DraftIcon, title: "2 seats still open", body: "Share the invite link so remaining seats are filled before activation." },
            { color: "danger", icon: Icons.DrawIcon, title: "Payment overdue — Seat #7", body: "Round 4 contribution from Arjun has not been received within the grace period." },
            { color: "success", icon: Icons.WinnerIcon, title: "Draw complete — Round 4", body: "Seat #9 (Aisha Khan) won. ₹60,000 disbursed on 10 Apr 2025." },
            { color: "gold", icon: Icons.BellIcon, title: "Your turn this round!", body: "You have won the draw for Round 7. Contact the organizer to receive your payout." },
          ].map(({ color, icon: Icon, title, body }) => (
            <div key={title} className={cn("flex items-start gap-3 rounded-[18px] border p-4", `border-[var(--${color})]/30 bg-[var(--${color})]/7`)}>
              <div className={cn("shrink-0 mt-0.5 rounded-xl p-2", `bg-[var(--${color})]/15 text-[var(--${color})]`)}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{body}</p>
              </div>
            </div>
          ))}

          {/* Dismissible alert banner */}
          <p className="mt-6 text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Dismissible banners — with action</p>
          {[
            { color: "warning", icon: Icons.BellIcon, title: "3 overdue payments", action: "Review", body: "Rounds may be delayed if contributions aren't collected soon." },
            { color: "success", icon: Icons.CheckIcon, title: "Round 4 payments complete", action: "Run draw", body: "All 12 members have paid. You can now run the draw." },
          ].map(({ color, icon: Icon, title, body, action }) => (
            <div key={title} className={cn("flex flex-wrap gap-3 items-start rounded-[18px] border p-4", `border-[var(--${color})]/30 bg-[var(--${color})]/7`)}>
              <div className={cn("shrink-0 mt-0.5 rounded-xl p-2", `bg-[var(--${color})]/15 text-[var(--${color})]`)}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{body}</p>
              </div>
              <button className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold border", `border-[var(--${color})]/40 text-[var(--${color})]`)}>{action}</button>
            </div>
          ))}

        </div>
      </Section>

      {/* ── 19. Spacing & breakpoints ── */}
      <Section title="19 — Spacing &amp; Breakpoints">
        <Card>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            All breakpoints use a consistent padding/margin scale. px = horizontal page gutter, pt/pb = vertical page rhythm.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Breakpoint", "Trigger", "Page gutter (px)", "Section gap (mt)", "Card padding (p)", "Use case"].map((h) => (
                    <th key={h} className="py-2 pr-4 text-left text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { bp: "Base", trigger: "< 640px", gutter: "px-4", section: "mt-8", card: "p-4", use: "Mobile portrait" },
                  { bp: "SM", trigger: "≥ 640px", gutter: "px-6", section: "mt-10", card: "p-5", use: "Mobile landscape / small tablet" },
                  { bp: "MD", trigger: "≥ 768px", gutter: "px-6", section: "mt-10", card: "p-5", use: "Tablet portrait" },
                  { bp: "LG", trigger: "≥ 1024px", gutter: "px-8", section: "mt-12", card: "p-6", use: "Desktop / rail visible (add pl-16)" },
                  { bp: "XL", trigger: "≥ 1280px", gutter: "px-8", section: "mt-12", card: "p-6", use: "Wide desktop" },
                  { bp: "Max-w", trigger: "max-w-5xl", gutter: "mx-auto", section: "—", card: "—", use: "Content always capped at 64rem" },
                ].map(({ bp, trigger, gutter, section, card, use }) => (
                  <tr key={bp} className="border-b border-[var(--border-subtle)]/40 last:border-0">
                    <td className="py-2 pr-4 font-bold text-[var(--text-primary)]">{bp}</td>
                    <td className="py-2 pr-4 font-mono text-[var(--text-muted)]">{trigger}</td>
                    <td className="py-2 pr-4 font-mono text-[var(--accent-vivid)]">{gutter}</td>
                    <td className="py-2 pr-4 font-mono text-[var(--accent-vivid)]">{section}</td>
                    <td className="py-2 pr-4 font-mono text-[var(--accent-vivid)]">{card}</td>
                    <td className="py-2 pr-4 text-[var(--text-muted)]">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 mb-3 text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Live gutter demo</p>
          <div className="rounded-[18px] border border-dashed border-[var(--border-subtle)] px-4 sm:px-6 lg:px-8">
            <div className="border-x border-[var(--accent-vivid)]/30 py-4 text-center">
              <p className="text-xs font-semibold text-[var(--text-primary)]">Content area</p>
              <p className="text-[10px] text-[var(--text-muted)]">Resize window to see gutter change</p>
            </div>
          </div>
        </Card>
      </Section>

    </div>
  );
}
