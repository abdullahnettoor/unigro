import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SignInButton } from "@clerk/clerk-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Home, Settings, WalletCards } from "lucide-react";

import { AdminRoute } from "./components/auth/AdminRoute";
import { UserSync } from "./components/auth/UserSync";
import { AppShell } from "./components/layout/AppShell";
import { AppSidebar } from "./components/layout/AppSidebar";
import { PWAPrompt } from "./components/shared/PWAPrompt";
import { Button } from "./components/ui/Button";
import { Toaster } from "./components/ui/Sonner";
import { LogoLoader } from "./components/ui/LogoLoader";
import { Surface } from "./components/ui/Surface";

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <Navigate to="/" replace />
      </Unauthenticated>
    </>
  );
}

function RouteLoading() {
  return (
    <div className="min-h-[40vh] grid place-items-center py-8">
      <LogoLoader size="lg" />
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
    <main className="min-h-dvh bg-[var(--hero-gradient)] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
      <header className="mb-8 flex flex-col items-start gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src="/app_icon.svg" alt="UniGro Logo" className="h-12 w-12 sm:h-16 sm:w-16 drop-shadow-sm" />
          <div>
            <h1 className="text-3xl font-display font-bold sm:text-4xl">UniGro</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">Community savings made transparent.</p>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
          <SignInButton mode="modal">
            <Button variant="primary" size="md" className="w-full rounded-full sm:w-auto">
              Sign In
            </Button>
          </SignInButton>
        </div>
      </header>
      <section className="mx-auto mt-12 w-full max-w-4xl px-4 text-center sm:mt-16 sm:px-6">
        <h2 className="text-4xl font-display font-bold leading-tight sm:text-5xl md:text-6xl">
          Communal Finance,<br />Reimagined.
        </h2>
        <p className="mx-auto mb-8 mt-4 max-w-2xl text-base text-[var(--text-muted)] sm:text-lg md:text-xl">
          A verified, transparent, and beautiful way to manage your chit funds.
        </p>
        <div className="mx-auto flex max-w-xs justify-center gap-4 sm:max-w-none">
          <SignInButton mode="modal">
            <Button variant="primary" size="lg" className="w-full rounded-full sm:w-auto">
              Get Started
            </Button>
          </SignInButton>
        </div>
      </section>
    </main>
  );
}

function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));
  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center rounded-full px-3 py-2 min-w-[76px] text-center transition-colors ${active
      ? "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]"
      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    }`;
  const labelClass = "mt-1 text-[11px] font-semibold leading-none";

  if (location.pathname === "/create" || location.pathname.startsWith("/pot/")) return null;

  return (
    <>
      {/* Gradient Bottom Blur over scrolling content */}
      <div className="fixed bottom-0 inset-x-0 h-28 pointer-events-none z-30 md:hidden backdrop-blur-md [mask-image:linear-gradient(to_top,black_20%,transparent_100%)] bg-gradient-to-t from-[var(--bg-app)]/40 to-transparent" />

      {/* Floating Pill Navbar */}
      <Surface
        tier={3}
        rounded="full"
        className="fixed left-1/2 bottom-5 z-40 -translate-x-1/2 px-2 py-1.5 border border-[var(--border-subtle)] shadow-[0_12px_40px_rgba(0,0,0,0.4)] md:hidden w-fit min-w-[280px] glass-sticky"
      >
        <div className="flex items-center justify-between gap-1">
          <Link
            to="/"
            className={itemClass(isActive("/"))}
            aria-current={isActive("/") ? "page" : undefined}
          >
            <Home size={19} className={isActive("/") ? "scale-110" : ""} />
            <span className={labelClass}>Home</span>
          </Link>
          <Link
            to="/pots"
            className={itemClass(isActive("/pots"))}
            aria-current={isActive("/pots") ? "page" : undefined}
          >
            <WalletCards size={19} className={isActive("/pots") ? "scale-110" : ""} />
            <span className={labelClass}>My Pots</span>
          </Link>
          <Link
            to="/settings"
            className={itemClass(isActive("/settings"))}
            aria-current={isActive("/settings") ? "page" : undefined}
          >
            <Settings size={19} className={isActive("/settings") ? "scale-110" : ""} />
            <span className={labelClass}>Settings</span>
          </Link>
        </div>
      </Surface>
    </>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user: clerkUser } = useUser();
  const location = useLocation();
  const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "User";

  // Persistent sidebar logic: Hide on PotDetail pages to avoid overcrowding
  const hideSidebar = location.pathname.startsWith('/pot/') || location.pathname.startsWith('/create');

  return (
    <AppShell
      bottomNav={
        <Authenticated>
          <BottomNav />
        </Authenticated>
      }
    >
      <Toaster />
      <Authenticated>
        <UserSync />
        <AuthenticatedPrefetch />
        <Suspense fallback={null}>
          <ProfileModal />
        </Suspense>
      </Authenticated>

      <div className={hideSidebar ? "w-full" : "mx-auto w-full max-w-7xl px-4 md:px-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-5 lg:gap-6"}>
        {!hideSidebar && (
          <Authenticated>
            <AppSidebar firstName={firstName} imageUrl={clerkUser?.imageUrl} showAdmin={firstName === "Admin"} />
          </Authenticated>
        )}
        <div className="min-w-0">
          <Suspense fallback={<RouteLoading />}>
            {children}
          </Suspense>
        </div>
      </div>
    </AppShell>
  );
}

function ThemeVariantSync() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const themeVariant = params.get("variant");
    if (themeVariant === "ocean" || themeVariant === "clay" || themeVariant === "dusk") {
      document.documentElement.setAttribute("data-theme-variant", themeVariant);
    } else if (themeVariant === "default") {
      document.documentElement.removeAttribute("data-theme-variant");
    }
  }, [location.search]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PWAPrompt />
      <ThemeVariantSync />
      <AuthLoading>
        <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-app)]">
          <LogoLoader size="xl" />
        </div>
      </AuthLoading>

      <div className="text-[var(--text-primary)] font-[family-name:var(--font-body)]">
        <Routes>
          {/* The root route handles Landing vs Dashboard */}
          <Route
            path="/"
            element={
              <>
                <Unauthenticated>
                  <Landing />
                </Unauthenticated>
                <Authenticated>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </Authenticated>
              </>
            }
          />

          {/* Publicly accessible route */}
          <Route
            path="/pot/:potId"
            element={
              <MainLayout>
                <PotDetail />
              </MainLayout>
            }
          />

          {/* Protected routes */}
          <Route
            path="/pots"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Pots />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CreatePot />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* Default redirect for unauthenticated or unknown routes */}
          <Route
            path="*"
            element={
              <>
                <Unauthenticated>
                  <Navigate to="/" replace />
                </Unauthenticated>
                <Authenticated>
                  <Navigate to="/" replace />
                </Authenticated>
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
