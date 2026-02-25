import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SignInButton } from "@clerk/clerk-react";
import { Authenticated, AuthLoading,Unauthenticated } from "convex/react";
import { Home, Settings,WalletCards } from "lucide-react";

import { AdminRoute } from "./components/auth/AdminRoute";
import { UserSync } from "./components/auth/UserSync";
import { PWAPrompt } from "./components/shared/PWAPrompt";


const loadDashboard = () => import("./pages/Dashboard");
const loadPots = () => import("./pages/Pots");
const loadCreatePot = () => import("./pages/CreatePot");
const loadPotDetail = () => import("./pages/PotDetail");
const loadSettings = () => import("./pages/Settings");
const loadAdminDashboard = () => import("./pages/AdminDashboard");
const loadProfileModal = () => import("@/components/layout/ProfileModal");

const Dashboard = lazy(() => loadDashboard().then((m) => ({ default: m.Dashboard })));
const Pots = lazy(() => loadPots().then((m) => ({ default: m.Pots })));
const CreatePot = lazy(() => loadCreatePot().then((m) => ({ default: m.CreatePot })));
const PotDetail = lazy(() => loadPotDetail().then((m) => ({ default: m.PotDetail })));
const SettingsPage = lazy(() => loadSettings().then((m) => ({ default: m.Settings })));
const AdminDashboard = lazy(() => loadAdminDashboard().then((m) => ({ default: m.AdminDashboard })));
const ProfileModal = lazy(() => loadProfileModal().then((m) => ({ default: m.ProfileModal })));

function RouteLoading() {
  return (
    <div className="min-h-[40vh] grid place-items-center py-8">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent-vivid)]"></div>
    </div>
  );
}

function AuthenticatedPrefetch() {
  useEffect(() => {
    let cancelled = false;
    let idleId: number | null = null;

    const prefetch = () => {
      if (cancelled) return;
      void loadPots();
      void loadCreatePot();
      void loadSettings();
      void loadProfileModal();
    };

    if ("requestIdleCallback" in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback(prefetch, { timeout: 1200 });
    } else {
      globalThis.setTimeout(prefetch, 400);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, []);

  return null;
}

function Landing() {
  return (
    <section className="mx-auto mt-12 w-full max-w-4xl px-4 text-center sm:mt-16 sm:px-6">
      <h2 className="text-4xl font-[family-name:var(--font-display)] font-bold leading-tight sm:text-5xl md:text-6xl">
        Communal Finance,<br />Reimagined.
      </h2>
      <p className="mx-auto mb-8 mt-4 max-w-2xl text-base text-[var(--text-muted)] sm:text-lg md:text-xl">
        A verified, transparent, and beautiful way to manage your chit funds.
      </p>
      <div className="mx-auto flex max-w-xs justify-center gap-4 sm:max-w-none">
        <SignInButton mode="modal">
          <button className="w-full rounded-full bg-[var(--accent-vivid)] px-8 py-3 text-base font-bold text-[var(--text-on-accent)] transition-opacity hover:opacity-90 sm:w-auto sm:text-lg">
            Get Started
          </button>
        </SignInButton>
      </div>
    </section>
  );
}

function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));
  const itemClass = (active: boolean) =>
    `flex min-h-11 flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition-colors ${active
      ? "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]"
      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    }`;
  const labelClass = "mt-1 text-[11px] font-semibold leading-none";

  if (location.pathname === "/create" || location.pathname.startsWith("/pot/")) return null;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/95 p-2 shadow-2xl backdrop-blur-md md:hidden">
      <div className="grid grid-cols-3 gap-2">
        <Link
          to="/"
          className={itemClass(isActive("/"))}
          aria-current={isActive("/") ? "page" : undefined}
        >
          <Home size={18} />
          <span className={labelClass}>Dashboard</span>
        </Link>
        <Link
          to="/pots"
          className={itemClass(isActive("/pots"))}
          aria-current={isActive("/pots") ? "page" : undefined}
        >
          <WalletCards size={18} />
          <span className={labelClass}>Pots</span>
        </Link>

        <Link
          to="/settings"
          className={itemClass(isActive("/settings"))}
          aria-current={isActive("/settings") ? "page" : undefined}
        >
          <Settings size={18} />
          <span className={labelClass}>Settings</span>
        </Link>
      </div>
    </nav>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-[family-name:var(--font-body)] pb-24 sm:pb-0">
      {children}
      <BottomNav />
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PWAPrompt />
      <AuthLoading>
        <div className="min-h-screen grid place-items-center bg-[var(--bg-app)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-vivid)]"></div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <main className="min-h-screen bg-[var(--hero-gradient)] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
          <header className="mb-8 flex flex-col items-start gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-[family-name:var(--font-display)] font-bold sm:text-4xl">GrowPot</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">Community savings made transparent.</p>
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
              <SignInButton mode="modal">
                <button className="w-full rounded-full bg-[var(--accent-vivid)] px-6 py-2.5 font-bold text-[var(--text-on-accent)] transition-opacity hover:opacity-90 sm:w-auto">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </header>
          <Landing />
        </main>
      </Unauthenticated>

      <Authenticated>
        <UserSync />
        <AuthenticatedPrefetch />
        <Suspense fallback={null}>
          <ProfileModal />
        </Suspense>
        <MainLayout>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pots" element={<Pots />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/create" element={<CreatePot />} />
              <Route path="/pot/:potId" element={<PotDetail />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </Authenticated>
    </BrowserRouter>
  );
}

export default App;
