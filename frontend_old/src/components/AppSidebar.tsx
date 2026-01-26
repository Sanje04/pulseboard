import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: Users,
  },
  {
    title: "Incidents",
    url: "/incidents",
    icon: AlertTriangle,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r bg-slate-50">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">PulseBoard</h1>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.url;
          
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
