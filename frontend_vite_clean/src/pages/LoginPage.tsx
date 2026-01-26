import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

export function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>PulseBoard</CardTitle>
          <CardDescription>Sign in to your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setErr(null);
              setLoading(true);
              try {
                await onLogin(email, password);
              } catch (e: any) {
                setErr(e?.message ?? "Login failed");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            {err && <p className="text-sm text-red-500">{err}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
