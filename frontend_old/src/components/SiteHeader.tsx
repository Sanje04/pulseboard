import { Button } from "./ui/button";

interface SiteHeaderProps {
  onLogout: () => void;
}

export function SiteHeader({ onLogout }: SiteHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <Button variant="outline" onClick={onLogout}>
        Logout
      </Button>
    </header>
  );
}
