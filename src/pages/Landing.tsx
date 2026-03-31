import { useRef } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";

/* ─── Monogram Paths (from LogoLoader) ─────────────────────────────────────── */
const MONO_RIGHT =
  "M198.3.63c3-1.77,6.78.39,6.78,3.87v152.39c-2.61,43.57-40.55,86.99-89.81,96.95-19.47,3.39-38.34,2.67-55-1.39,10.42-3.46,20.04-7.55,28.98-12.35,20.19-10.82,36.8-25.34,48.94-42.65,4.36-6.2,8.15-12.76,11.3-19.64,7.64-16.6,11.85-36.1,11.85-54.91V42.56c0-12.46,6.58-23.98,17.31-30.32L198.3.63Z";
const MONO_MIDDLE =
  "M108.88,53.43c-10.72,6.33-17.31,17.86-17.31,30.32v39.16c0,8.69-2.04,18.31-5.46,25.74-10.46,22.75-34.6,37.12-73.8,43.95-4.11.71-8.22,1.22-12.32,1.51.1,1.11.22,2.24.38,3.35.07.54.16,1.08.26,1.62,2.54,14.39,10.8,26.78,22.95,36.29,20.93-3.94,38.46-9.8,53.53-17.87,10.42-5.59,19.66-12.32,27.52-20.04,9.09-8.92,16.36-19.14,21.53-30.36,6.13-13.31,9.5-29,9.5-44.19V45.48c0-3.48-3.78-5.64-6.78-3.87l-20.01,11.82Z";
const MONO_LEFT =
  "M34.04,97.62c-7.76,4.58-13.47,11.97-15.95,20.64l-14.2,49.67h0c1.34-.17,2.68-.38,4.02-.61,29.85-5.2,48.32-15.09,54.91-29.4,1.86-4.04,3.11-10.07,3.11-15.01v-36.24c0-3.48-3.78-5.64-6.78-3.87l-25.1,14.82Z";

/* ─── Section wrapper with scroll-reveal ───────────────────────────────────── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Feature data ─────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "Fully Transparent",
    desc: "Every contribution, every round, every payout — visible to all members in real time. No hidden ledgers.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "Verified & Secure",
    desc: "Member identity verified through secure authentication. Payment proofs recorded and visible to organizers.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Community First",
    desc: "Built for the way communities actually save — chit funds, tandas, susus, game's. Your tradition, digitized.",
  },
];

/* ─── How-it-works steps ───────────────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Create a Pool",
    desc: "Set the contribution amount, round frequency, and total seats. Your pool is live in seconds.",
  },
  {
    num: "02",
    title: "Invite Members",
    desc: "Share a link. Members join with one tap, pick their seats, and everyone sees who's in.",
  },
  {
    num: "03",
    title: "Grow Together",
    desc: "Rounds progress automatically. Track contributions, payouts, and history — all in one place.",
  },
];

/* ─── Stats ────────────────────────────────────────────────────────────────── */
const STATS = [
  { value: "100%", label: "Transparent" },
  { value: "Zero", label: "Hidden Fees" },
  { value: "Real-time", label: "Tracking" },
  { value: "PWA", label: "Install Anywhere" },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  LANDING PAGE                                                               */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  return (
    <div className="landing-root min-h-dvh overflow-x-hidden bg-[var(--bg-app)]">
      {/* ── Grain overlay ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-[1] landing-grain" />

      {/* ══════════════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════════════ */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 sm:px-8 sm:py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="glass-2 landing-nav-pill flex items-center gap-2.5 rounded-full px-4 py-2 sm:px-5 sm:py-2.5">
          <img
            src="/app_icon.svg"
            alt="UniGro"
            className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-sm"
          />
          <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
            UniGro
          </span>
        </div>

        <SignInButton mode="modal">
          <button className="landing-cta-btn rounded-full bg-[var(--accent-vivid)] px-5 py-2 text-sm font-semibold text-[var(--text-on-accent)] shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.97] sm:px-6 sm:py-2.5">
            Sign In
          </button>
        </SignInButton>
      </motion.nav>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-dvh flex-col items-center justify-center px-5 pt-24 pb-16 text-center sm:px-8"
      >
        {/* Radial glow behind monogram */}
        <div className="landing-hero-glow" />

        {/* Animated Monogram */}
        <motion.svg
          viewBox="0 0 205.08 256"
          className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 landing-monogram-float"
          initial="hidden"
          animate="visible"
        >
          <defs>
            <linearGradient id="mono-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-vivid)" />
              <stop offset="100%" stopColor="var(--accent-secondary)" />
            </linearGradient>
          </defs>
          {[MONO_LEFT, MONO_MIDDLE, MONO_RIGHT].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="url(#mono-grad)"
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8, delay: 0.3 + i * 0.18, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            />
          ))}
        </motion.svg>

        {/* Eyebrow */}
        <motion.p
          className="mt-8 text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--accent-vivid)] sm:text-xs sm:tracking-[0.4em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          Community Savings Platform
        </motion.p>

        {/* Headline */}
        <motion.h1
          className="mt-5 max-w-3xl font-display text-[2.5rem] font-bold leading-[1.08] tracking-tight text-[var(--text-primary)] sm:text-[3.5rem] md:text-[4.2rem]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          Communal Finance,{" "}
          <span className="landing-gradient-text">Reimagined</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-muted)] sm:text-lg md:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          A verified, transparent, and beautiful way to manage your community
          savings pools — chit funds, tandas, susus, and more.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <SignUpButton mode="modal">
            <button className="landing-cta-btn group relative rounded-full bg-[var(--accent-vivid)] px-8 py-3.5 text-base font-semibold text-[var(--text-on-accent)] shadow-xl transition-all hover:shadow-2xl hover:brightness-110 active:scale-[0.97] sm:px-10 sm:py-4 sm:text-lg">
              Get Started — It's Free
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </SignUpButton>
          <span className="text-xs text-[var(--text-muted)]">
            No credit card required
          </span>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.6 }}
        >
          <div className="landing-scroll-indicator flex flex-col items-center gap-2 text-[var(--text-muted)]">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
              Scroll
            </span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="landing-scroll-arrow">
              <path
                d="M8 4v12m0 0l-4-4m4 4l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-5 py-20 sm:px-8 sm:py-28 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--accent-secondary)] sm:text-xs">
            Why UniGro
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
            Savings pools,{" "}
            <span className="text-[var(--accent-vivid)]">done right</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            Traditional community savings deserve modern tools. UniGro brings
            clarity, security, and delight to every round.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:mt-16">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.12}>
              <div className="landing-feature-card glass-2 grain group relative flex flex-col rounded-[var(--radius-3)] border border-[var(--border-subtle)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-vivid)]/40 hover:shadow-xl sm:p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-vivid)]/12 text-[var(--accent-vivid)] transition-transform duration-300 group-hover:scale-110">
                  {f.icon}
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                  {f.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-5 py-20 sm:px-8 sm:py-28 md:py-32">
        {/* Subtle background band */}
        <div className="absolute inset-0 bg-[var(--surface-1)]/50" />

        <div className="relative mx-auto max-w-5xl">
          <Reveal className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--accent-secondary)] sm:text-xs">
              How It Works
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
              Three steps to{" "}
              <span className="text-[var(--accent-vivid)]">financial harmony</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-8 sm:mt-16 md:grid-cols-3 md:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.15}>
                <div className="group relative flex flex-col items-center text-center md:items-start md:text-left">
                  {/* Number badge */}
                  <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[var(--accent-vivid)]/8 transition-transform duration-500 group-hover:scale-110" />
                    <span className="relative font-display text-2xl font-bold text-[var(--accent-vivid)]">
                      {s.num}
                    </span>
                  </div>

                  {/* Connector line (desktop only) */}
                  {i < STEPS.length - 1 && (
                    <div className="landing-step-connector hidden md:block" />
                  )}

                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <Reveal>
          <div className="glass-2 grain mx-auto grid max-w-4xl grid-cols-2 gap-6 rounded-[var(--radius-3)] border border-[var(--border-subtle)] p-8 sm:grid-cols-4 sm:gap-4 sm:p-10">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1} className="text-center">
                <p className="font-display text-2xl font-bold text-[var(--accent-vivid)] sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)] sm:text-sm">
                  {s.label}
                </p>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-5 py-20 sm:px-8 sm:py-28">
        <div className="absolute inset-0 bg-[var(--surface-1)]/40" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--accent-secondary)] sm:text-xs">
              Built on Trust
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Your money, your community,{" "}
              <span className="text-[var(--accent-vivid)]">your rules</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              UniGro doesn't hold your money. We provide the platform for organizers
              and members to coordinate payments with full visibility. Every transaction
              is logged, every round is tracked, and every member has equal access to information.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[var(--text-muted)]">
              {[
                { icon: "🔒", text: "End-to-end verified" },
                { icon: "📱", text: "Install as an app" },
                { icon: "🌍", text: "Works globally" },
                { icon: "🕶️", text: "No hidden fees" },
              ].map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-2 rounded-full bg-[var(--surface-2)]/70 px-4 py-2 text-xs font-medium sm:text-sm"
                >
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          {/* Background glow */}
          <div className="landing-cta-glow" />

          <h2 className="relative font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
            Ready to grow{" "}
            <span className="landing-gradient-text">together?</span>
          </h2>
          <p className="relative mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            Start your first pool in under a minute. Invite your community and
            watch your collective savings flourish.
          </p>

          <div className="relative mt-10">
            <SignUpButton mode="modal">
              <button className="landing-cta-btn group rounded-full bg-[var(--accent-vivid)] px-10 py-4 text-base font-semibold text-[var(--text-on-accent)] shadow-xl transition-all hover:shadow-2xl hover:brightness-110 active:scale-[0.97] sm:text-lg">
                Create Your First Pool
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </SignUpButton>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[var(--border-subtle)]/50 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img
              src="/app_icon.svg"
              alt="UniGro"
              className="h-6 w-6 drop-shadow-sm"
            />
            <span className="font-display text-sm font-bold tracking-tight text-[var(--text-primary)]">
              UniGro
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} UniGro. Community savings, made transparent.
          </p>
        </div>
      </footer>
    </div>
  );
}
