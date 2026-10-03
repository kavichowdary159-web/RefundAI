"use client";

import React, { createContext, useContext, useState } from "react";
import { Sidebar } from "./Sidebar";

interface SidebarContextType {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  sidebarOpen: false,
  openSidebar: () => {},
  closeSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        openSidebar: () => setSidebarOpen(true),
        closeSidebar: () => setSidebarOpen(false),
      }}
    >
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        {/* Sidebar navigation */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main layout container with margin for lg sidebar */}
        <div className="flex flex-1 flex-col lg:pl-72 min-w-0">
          {/* Content area */}
          <main className="flex-1 flex flex-col min-w-0">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

