import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { UserSync } from "./components/UserSync";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { CreatePot } from "./pages/CreatePot";
import { PotDetail } from "./pages/PotDetail";
import { ProfileModal } from "./components/ProfileModal";
import { PWAPrompt } from "./components/PWAPrompt";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminRoute } from "./components/AdminRoute";

function Landing() {
  return (
    <section className="max-w-4xl mx-auto text-center mt-20 px-4">
      <h2 className="text-6xl font-[family-name:var(--font-display)] font-bold mb-6 leading-tight">
        Communal Finance,<br />Reimagined.
      </h2>
      <p className="text-xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">
        A verified, transparent, and beautiful way to manage your chit funds.
      </p>
      <div className="flex justify-center gap-4">
        <SignInButton mode="modal">
          <button className="bg-[var(--accent-vivid)] text-[var(--bg-app)] font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity cursor-pointer text-lg">
            Get Started
          </button>
        </SignInButton>
      </div>
    </section>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-[family-name:var(--font-body)]">
      <nav className="border-b border-white/5 bg-[#232931]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-[family-name:var(--font-display)] font-bold">GrowPot</h1>
          </Link>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>
      {children}
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PWAPrompt />
      <AuthLoading>
        <div className="min-h-screen grid place-items-center bg-[#1B3022]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C1FF72]"></div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] p-8 font-[family-name:var(--font-body)]">
          <header className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-[family-name:var(--font-display)] font-bold">GrowPot</h1>
            <div className="flex gap-4 items-center">
              <SignInButton mode="modal">
                <button className="bg-[var(--accent-vivid)] text-[var(--bg-app)] font-bold px-6 py-2 rounded-full hover:opacity-90 transition-opacity cursor-pointer">
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
