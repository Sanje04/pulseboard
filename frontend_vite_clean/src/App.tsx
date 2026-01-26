import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AppShell } from "./components/layout/AppShell";
import { Button } from "./components/ui/button";

function hasToken() {
  return Boolean(localStorage.getItem("accessToken"));
}

function AppInner() {
  const [authed, setAuthed] = useState(hasToken());

  // Temporary: we’ll replace this with your real login() from old frontend
  async function fakeLogin(email: string, password: string) {
    // placeholder — you’ll swap this with your real API login call
    localStorage.setItem("accessToken", "demo");
    setAuthed(true);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    setAuthed(false);
  }

  const topbar = (
    <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl border border-[hsl(var(--border))] grid place-items-center font-semibold">
          PB
        </div>
        <div>
          <div className="font-semibold">PulseBoard</div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Incident tracking dashboard</div>
        </div>
      </div>
      {authed && (
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      )}
    </div>
  );

  const sidebar = (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="text-sm font-semibold mb-2">Navigation</div>
      <div className="text-sm text-[hsl(var(--muted-foreground))]">
        Projects will go here next.
      </div>
    </div>
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={authed ? <Navigate to="/" replace /> : <LoginPage onLogin={fakeLogin} />}
      />
      <Route
        path="/"
        element={
          authed ? (
            <AppShell sidebar={sidebar} topbar={topbar}>
              <DashboardPage />
            </AppShell>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
