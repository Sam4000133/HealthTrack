import { Link } from "wouter";
import { Role } from "@shared/schema";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  currentPage: string;
  role?: Role;
}

export default function Sidebar({ currentPage, role }: SidebarProps) {
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const { logoutMutation } = useAuth();
  const { user } = useAuth();

  return (
    <div className="hidden lg:flex lg:flex-shrink-0 fixed top-16 left-0 h-[calc(100vh-4rem)]">
      <div className="flex flex-col w-64 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto">
          <nav className="mt-2 flex-1 px-2 space-y-1 flex flex-col h-full justify-between">
            <div className="space-y-1">
              {/* Dashboard */}
            <Link href="/">
              <a 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 'dashboard' 
                    ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <svg 
                  className={`mr-3 h-6 w-6 ${currentPage === 'dashboard' ? 'text-primary dark:text-primary-400' : 'text-gray-400 dark:text-gray-400'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                Dashboard
              </a>
            </Link>
            
            {/* Measurements */}
            <Link href="/measurements">
              <a 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 'measurements' 
                    ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <svg 
                  className={`mr-3 h-6 w-6 ${currentPage === 'measurements' ? 'text-primary dark:text-primary-400' : 'text-gray-400 dark:text-gray-400'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Misurazioni
              </a>
            </Link>
            
            {/* Statistics */}
            <Link href="/statistics">
              <a 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 'statistics' 
                    ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <svg 
                  className={`mr-3 h-6 w-6 ${currentPage === 'statistics' ? 'text-primary dark:text-primary-400' : 'text-gray-400 dark:text-gray-400'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Statistiche
              </a>
            </Link>
            
            {/* Patients (only for doctor or admin) */}
            {(role === 'doctor' || role === 'admin') && (
              <Link href="/patients">
                <a 
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    currentPage === 'patients' 
                      ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <svg 
                    className={`mr-3 h-6 w-6 ${currentPage === 'patients' ? 'text-primary dark:text-primary-400' : 'text-gray-400 dark:text-gray-400'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  Pazienti
                </a>
              </Link>
            )}
            
            {/* System dropdown */}
            <div>
              <button 
                onClick={() => setIsSystemOpen(!isSystemOpen)}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 'settings' || currentPage === 'roles' || 
                  currentPage === 'integrations' || currentPage === 'security' || 
                  currentPage === 'privacy' || currentPage === 'backup'
                    ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <svg 
                  className={`mr-3 h-6 w-6 ${
                    currentPage === 'settings' || currentPage === 'roles' || 
                    currentPage === 'integrations' || currentPage === 'security' || 
                    currentPage === 'privacy' || currentPage === 'backup'
                      ? 'text-primary dark:text-primary-400' 
                      : 'text-gray-400 dark:text-gray-400'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Sistema
                <svg className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${isSystemOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              {isSystemOpen && (
                <div className="pl-8 space-y-1">
                  <Link href="/settings">
                    <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      currentPage === 'settings' 
                        ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                        : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      Impostazioni
                    </a>
                  </Link>
                  {role === 'admin' && (
                    <Link href="/roles">
                      <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        currentPage === 'roles' 
                          ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                          : 'text-gray-700 dark:text-gray-200'
                      }`}>
                        Ruoli
                      </a>
                    </Link>
                  )}
                  <Link href="/integrations">
                    <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      currentPage === 'integrations' 
                        ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                        : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      Integrazioni
                    </a>
                  </Link>
                  <Link href="/security">
                    <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      currentPage === 'security' 
                        ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                        : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      Sicurezza
                    </a>
                  </Link>
                  <Link href="/privacy">
                    <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      currentPage === 'privacy' 
                        ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                        : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      Privacy
                    </a>
                  </Link>
                  <Link href="/backup">
                    <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      currentPage === 'backup' 
                        ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                        : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      Backup
                    </a>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Admin user management section */}
            {role === 'admin' && (
              <Link href="/users">
                <a 
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    currentPage === 'users' 
                      ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <svg 
                    className={`mr-3 h-6 w-6 ${currentPage === 'users' ? 'text-primary dark:text-primary-400' : 'text-gray-400 dark:text-gray-400'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  Gestione Utenti
                </a>
              </Link>
            )}
            </div>

            {/* Footer with profile and logout */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* Profile Link */}
              <Link href="/profile">
                <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 'profile' 
                    ? 'bg-primary/10 text-primary dark:text-primary-400 dark:bg-primary-400 dark:bg-primary/30' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}>
                  <svg 
                    className={`mr-3 h-6 w-6 ${currentPage === 'profile' ? 'text-primary dark:text-primary-400' : 'text-gray-400 dark:text-gray-400'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <span>Profilo</span>
                </a>
              </Link>
              
              {/* Logout Button */}
              <button
                onClick={() => logoutMutation.mutate()}
                className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Logout
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
