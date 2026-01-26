import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Content } from "./Content";

interface AppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AppShell({ sidebar, topbar, children, title, description }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar>{sidebar}</Sidebar>
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Navigation Bar */}
        <Topbar>{topbar}</Topbar>
        
        {/* Page Content */}
        <Content title={title} description={description}>
          {children}
        </Content>
      </div>
    </div>
  );
}
