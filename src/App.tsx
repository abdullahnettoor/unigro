import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useUser } from "@clerk/clerk-react";

import { AdminRoute } from "./components/auth/AdminRoute";
import { UserSync } from "./components/auth/UserSync";
import { AppShell } from "./components/layout/AppShell";
import { BottomNav } from "./components/layout/BottomNav";
import { DesktopRail } from "./components/layout/DesktopRail";
import { OfflineFallback } from "./components/shared/OfflineFallback";
import { PWAPrompt } from "./components/shared/PWAPrompt";
import { Toaster } from "./components/ui/sonner";
import { LogoLoader } from "./components/ui/LogoLoader";
import { useNetworkStatus } from "./hooks/useNetworkStatus";

// Lazy page imports
const loadDashboard = () => import("./pages/Dashboard");
const loadPools = () => import("./pages/Pools");           // file still called Pots.tsx
const loadCreatePool = () => import("./pages/CreatePool");
const loadCreateSuccess = () => import("./pages/CreateSuccess");
const loadPoolDetail = () => import("./pages/PoolDetail");
const loadSettings = () => import("./pages/Settings");
const loadAdminDashboard = () => import("./pages/AdminDashboard");
const loadDesign = () => import("./pages/Design");
const loadLanding = () => import("./pages/Landing");

const Dashboard = lazy(() => loadDashboard().then((m) => ({ default: m.Dashboard })));
const Pools = lazy(() => loadPools().then((m) => ({ default: m.Pools })));
const CreatePool = lazy(() => loadCreatePool().then((m) => ({ default: m.CreatePool })));
const CreateSuccess = lazy(() => loadCreateSuccess().then((m) => ({ default: m.CreateSuccess })));
const PoolDetail = lazy(() => loadPoolDetail().then((m) => ({ default: m.PoolDetail })));
const SettingsPage = lazy(() => loadSettings().then((m) => ({ default: m.Settings })));
const AdminDashboard = lazy(() => loadAdminDashboard().then((m) => ({ default: m.AdminDashboard })));
const DesignPage = lazy(() => loadDesign().then((m) => ({ default: m.Design })));
const LandingPage = lazy(() => loadLanding().then((m) => ({ default: m.Landing })));

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
    <div className="min-h-[50vh] grid place-items-center">
      <LogoLoader size="lg" />
    </div>
  );
}

function AuthenticatedPrefetch() {
  useEffect(() => {
    let idleId: number | null = null;
    const prefetch = () => {
      void loadPools();
      void loadCreatePool();
      void loadSettings();
    };
    if ("requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(prefetch, { timeout: 1200 });
    } else {
      globalThis.setTimeout(prefetch, 400);
    }
    return () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, []);
  return null;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user: clerkUser } = useUser();
  const location = useLocation();
  const firstName = clerkUser?.firstName || clerkUser?.fullName?.split(" ")[0] || "User";

  const hideNav = location.pathname.startsWith("/pools/") || location.pathname.startsWith("/create");

  return (
    <div className="flex min-h-dvh bg-[var(--bg-app)]">
      {/* Desktop collapsible rail — only for authenticated users */}
      <Authenticated>
        <DesktopRail
          showAdmin={firstName === "Admin"}
          userImageUrl={clerkUser?.imageUrl}
          userName={firstName}
        />
      </Authenticated>

      {/* Main content — offset for desktop rail */}
      <div className={`flex-1 min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 ${
        !hideNav ? "lg:pl-[236px]" : ""
      }`}>
        <Suspense fallback={<RouteLoading />}>
          {children}
        </Suspense>
      </div>

      {/* Mobile + tablet floating bottom nav */}
      <Authenticated>
        {!hideNav ? <BottomNav /> : null}
      </Authenticated>
    </div>
  );
}

function AppContent({ showDesign }: { showDesign: boolean }) {
  const location = useLocation();
  const { isOnline } = useNetworkStatus();
  const isPublicRoute =
    location.pathname === "/" ||
    /^\/pools\/[^/]+$/.test(location.pathname) ||
    location.pathname === "/design";

  return (
    <AppShell>
      <PWAPrompt />
      <Toaster />

      <AuthLoading>
        {isOnline ? (
          <div className="min-h-dvh flex items-center justify-center">
            <LogoLoader size="xl" />
          </div>
        ) : isPublicRoute ? null : (
          <OfflineFallback
            title="Connection needed to restore your session"
            message="Reconnect once so the app can restore your signed-in session. Cached public screens can still open offline."
          />
        )}
      </AuthLoading>

      <Routes>
        {/* Root — Landing vs Dashboard */}
        <Route
          path="/"
          element={
            <>
              <Unauthenticated>
                <Suspense fallback={<RouteLoading />}>
                  <LandingPage />
                </Suspense>
              </Unauthenticated>
              <Authenticated>
                <UserSync />
                <AuthenticatedPrefetch />
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </Authenticated>
            </>
          }
        />

        {/* Pool Detail — publicly accessible */}
        <Route
          path="/pools/:poolId"
          element={
            <MainLayout>
              <PoolDetail />
            </MainLayout>
          }
        />

        {/* Protected routes */}
        <Route
          path="/pools"
          element={
            <ProtectedRoute>
              <Authenticated>
                <UserSync />
              </Authenticated>
              <MainLayout>
                <Pools />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Authenticated>
                <UserSync />
              </Authenticated>
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
              <Authenticated>
                <UserSync />
              </Authenticated>
              <MainLayout>
                <CreatePool />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create/success"
          element={
            <ProtectedRoute>
              <Authenticated>
                <UserSync />
              </Authenticated>
              <MainLayout>
                <CreateSuccess />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Authenticated>
                  <UserSync />
                </Authenticated>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        {/* Legacy redirect */}
        <Route path="/pots" element={<Navigate to="/pools" replace />} />
        <Route path="/pot/:potId" element={<Navigate to="/" replace />} />

        {showDesign && (
          <Route
            path="/design"
            element={
              <MainLayout>
                <DesignPage />
              </MainLayout>
            }
          />
        )}

        {/* Fallback */}
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
    </AppShell>
  );
}

function App() {
  const showDesign = import.meta.env.DEV || import.meta.env.VITE_SHOW_DESIGN === "true";
  return (
    <BrowserRouter>
      <AppContent showDesign={showDesign} />
    </BrowserRouter>
  );
}

export default App;
