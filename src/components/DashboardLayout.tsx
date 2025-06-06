import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

const DashboardLayout = ({ children, activePage = 'campaigns' }: DashboardLayoutProps) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isExpanded={sidebarExpanded} 
        onToggle={setSidebarExpanded}
        activePage={activePage} 
      />
      <main className={`flex-1 overflow-auto bg-gradient-to-br from-purple-50 via-white to-blue-50`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;