import { Link } from "wouter";
import { Role } from "@shared/schema";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  currentPage: string;
  role?: Role;
}

export default function Sidebar({ currentPage, role }: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { logoutMutation } = useAuth();

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            <Link href="/">
              <a 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 'dashboard' 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <svg 
                  className={`mr-3 h-6 w-6 ${currentPage === 'dashboard' ? 'text-primary' : 'text-gray-400 dark:text-gray-400'}`} 
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
            
            <Link href="/measurements">
              <a 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 'measurements' 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <svg 
                  className={`mr-3 h-6 w-6 ${currentPage === 'measurements' ? 'text-primary' : 'text-gray-400 dark:text-gray-400'}`} 
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
            
            <Link href="/statistics">
              <a 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 'statistics' 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <svg 
                  className={`mr-3 h-6 w-6 ${currentPage === 'statistics' ? 'text-primary' : 'text-gray-400 dark:text-gray-400'}`} 
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
            
            {(role === 'doctor' || role === 'admin') && (
              <Link href="/patients">
                <a 
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    currentPage === 'patients' 
                      ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <svg 
                    className={`mr-3 h-6 w-6 ${currentPage === 'patients' ? 'text-primary' : 'text-gray-400 dark:text-gray-400'}`} 
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
            
            <div>
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <svg className="mr-3 h-6 w-6 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Impostazioni
                <svg className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              {isSettingsOpen && (
                <div className="pl-8 space-y-1">
                  <Link href="/profile">
                    <a className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                      Profilo
                    </a>
                  </Link>
                  <Link href="/security">
                    <a className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                      Sicurezza
                    </a>
                  </Link>
                  <Link href="/preferences">
                    <a className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                      Preferenze
                    </a>
                  </Link>
                </div>
              )}
            </div>
            
            {role === 'admin' && (
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/users">
                  <a 
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      currentPage === 'users' 
                        ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <svg 
                      className={`mr-3 h-6 w-6 ${currentPage === 'users' ? 'text-primary' : 'text-gray-400 dark:text-gray-400'}`} 
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
              </div>
            )}
            
            <div className="pt-4 mt-4">
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
