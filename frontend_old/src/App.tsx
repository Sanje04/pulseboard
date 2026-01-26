import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { login, logout, saveToken } from "./auth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { AppShell } from "./components/layout/AppShell";
import { AppSidebar } from "./components/AppSidebar";
import DashboardPage from "./pages/DashboardPage";

function hasToken() {
  return Boolean(localStorage.getItem("accessToken"));
}

function LoginPage({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>PulseBoard</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
            </div>
            <div>
              <input
                type="password"
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardLayout({ onLogout }: { onLogout: () => void }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppShell
            sidebar={<AppSidebar />}
            topbar={
              <>
                <h2 className="text-lg font-semibold">Dashboard</h2>
                <Button variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              </>
            }
            title="Dashboard"
            description="Welcome to your admin dashboard"
          >
            <Navigate to="/dashboard" replace />
          </AppShell>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AppShell
            sidebar={<AppSidebar />}
            topbar={
              <>
                <h2 className="text-lg font-semibold">Dashboard</h2>
                <Button variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              </>
            }
            title="Dashboard"
            description="Welcome to your admin dashboard"
          >
            <DashboardPage />
          </AppShell>
        }
      />
      <Route
        path="/projects"
        element={
          <AppShell
            sidebar={<AppSidebar />}
            topbar={
              <>
                <h2 className="text-lg font-semibold">Projects</h2>
                <Button variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              </>
            }
            title="Projects"
            description="Manage your projects"
          >
            <div className="px-4 lg:px-6">Projects coming soon...</div>
          </AppShell>
        }
      />
      <Route
        path="/incidents"
        element={
          <AppShell
            sidebar={<AppSidebar />}
            topbar={
              <>
                <h2 className="text-lg font-semibold">Incidents</h2>
                <Button variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              </>
            }
            title="Incidents"
            description="Track and manage incidents"
          >
            <div className="px-4 lg:px-6">Incidents coming soon...</div>
          </AppShell>
        }
      />
    </Routes>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [authed, setAuthed] = useState(hasToken());

  async function handleLogin(email: string, password: string) {
    const res = await login(email, password);
    saveToken(res.accessToken);
    setAuthed(true);
  }

  function handleLogout() {
    logout();
    setAuthed(false);
    queryClient.clear();
  }

  if (!authed) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <DashboardLayout onLogout={handleLogout} />
    </BrowserRouter>
  );
}
