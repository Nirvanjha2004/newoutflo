import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
// import { useLocation } from 'react-router-dom'; // Only needed if you have specific logic based on location that might be causing issues

const DashboardLayout = ({ children, activePage }: { children: React.ReactNode, activePage: string }) => {
  // Initialize state from localStorage, defaulting to true (expanded) if not found
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarExpanded');
      return savedState !== null ? JSON.parse(savedState) : true;
    }
    return true; // Default for server-side rendering or if window is not available
  });

  // This useEffect was potentially problematic if it reset the state on navigation.
  // If you have a useEffect that depends on `location.pathname` and sets `isSidebarExpanded`
  // to true, you should remove or modify it. For example:
  //
  // const location = useLocation();
  // useEffect(() => {
  //   // This kind of logic would cause the sidebar to always expand on navigation:
  //   // setIsSidebarExpanded(true);
  // }, [location.pathname]); // This dependency would trigger on route change

  // Update localStorage whenever the isSidebarExpanded state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarExpanded', JSON.stringify(isSidebarExpanded));
    }
  }, [isSidebarExpanded]);

  const handleToggleSidebar = (expanded: boolean) => {
    setIsSidebarExpanded(expanded);
  };

  return (
    <div className="flex h-screen bg-gray-100"> {/* Added a default background color */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={handleToggleSidebar}
        activePage={activePage}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;