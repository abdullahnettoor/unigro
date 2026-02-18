import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { UserSync } from "./components/UserSync";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, User } from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { CreatePot } from "./pages/CreatePot";
import { PotDetail } from "./pages/PotDetail";
import { Profile } from "./pages/Profile";
import { ProfileModal } from "./components/ProfileModal";
import { PWAPrompt } from "./components/PWAPrompt";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminRoute } from "./components/AdminRoute";
import { UserMenu } from "./components/UserMenu";

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
  const { user } = useUser();
  const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/95 p-2 shadow-2xl backdrop-blur-md sm:hidden">
      <div className="grid grid-cols-3 gap-2">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 font-semibold transition-colors ${isActive("/") ? "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
          aria-current={isActive("/") ? "page" : undefined}
        >
          <Home size={18} />
          <span className="text-xs leading-none mt-1">Dashboard</span>
        </Link>
        <Link
          to="/create"
          className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 font-semibold transition-colors ${isActive("/create") ? "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
          aria-current={isActive("/create") ? "page" : undefined}
        >
          <PlusCircle size={18} />
          <span className="text-xs leading-none mt-1">New Pot</span>
        </Link>

        <UserMenu
          placement="top-end"
          trigger={
            <div className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 font-semibold transition-colors ${isActive("/profile") ? "bg-[var(--accent-vivid)]/15 text-[var(--accent-vivid)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className={`w-[18px] h-[18px] rounded-full object-cover ${isActive("/profile") ? "ring-2 ring-[var(--accent-vivid)]" : ""}`}
                />
              ) : (
                <User size={18} />
              )}
              <span className="text-xs leading-none mt-1">Profile</span>
            </div>
          }
        />
      </div>
    </nav>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-[family-name:var(--font-body)] pb-24 sm:pb-0">
      <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-center sm:justify-between px-4 py-3 sm:px-6 relative">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <h1 className="text-xl font-[family-name:var(--font-display)] font-bold sm:text-2xl">GrowPot</h1>
          </Link>
          <div className="hidden sm:flex items-center gap-3 sm:gap-4 absolute right-4 sm:static">
            <UserMenu />
          </div>
        </div>
      </nav>
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
        <ProfileModal />
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
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
        </MainLayout>
      </Authenticated>
    </BrowserRouter>
  );
}

export default App;
