import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <Header 
          user={user} 
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
      
      {/* Spacer to account for fixed header */}
      <div className="h-16"></div>
      
      <div className="flex flex-1">
        {/* Sidebar (Desktop) - fixed on the left */}
        <Sidebar currentPage={currentPage} role={user?.role} />
        
        {/* Mobile Sidebar */}
        <MobileNav 
          isOpen={isSidebarOpen} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentPage={currentPage}
          role={user?.role}
        />
        
        {/* Main Content - this is the only part that should scroll */}
        <div className="flex-1 lg:ml-64 overflow-auto focus:outline-none">
          <main className="flex-1 relative pb-8 z-0 h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation - fixed at bottom */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1 z-40">
        <div className="flex justify-around">
          <a href="/" className={`text-center py-2 px-2 rounded ${currentPage === 'dashboard' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="block text-xs">Dashboard</span>
          </a>
          
          <a href="/measurements" className={`text-center py-2 px-2 rounded ${currentPage === 'measurements' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="block text-xs">Misura</span>
          </a>
          
          <a href="/statistics" className={`text-center py-2 px-2 rounded ${currentPage === 'statistics' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="block text-xs">Statistiche</span>
          </a>
          
          <a href="/profile" className={`text-center py-2 px-2 rounded ${currentPage === 'profile' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="block text-xs">Profilo</span>
          </a>
        </div>
      </div>
    </div>
  );
}
