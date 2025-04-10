import { useState } from "react";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import ThemeToggle from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeaderProps {
  user: User | null;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Header({ user, isSidebarOpen, toggleSidebar }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { logoutMutation } = useAuth();

  // Mock notifications for UI design
  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "Glicemia alta",
      description: "Valore 190 mg/dL alle 14:30 oggi",
      severity: "high"
    },
    {
      id: 2,
      type: "warning",
      title: "Pressione elevata",
      description: "Pressione 145/95 mmHg alle 08:15 ieri",
      severity: "medium"
    }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Menu Toggle */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <div className="flex-shrink-0 flex items-center ml-2 lg:ml-0">
              <Link href="/">
                <a className="text-primary font-bold text-xl">HealthTrack</a>
              </Link>
            </div>
          </div>
          
          {/* User Menu & Actions */}
          <div className="flex items-center">
            {/* Dark Mode Toggle */}
            <ThemeToggle />
            
            {/* Notifications */}
            <div className="relative" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
              <button className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>
              
              {isNotificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium">Notifiche</h3>
                    </div>
                    
                    {notifications.map(notification => (
                      <a key={notification.id} href="#" className="block px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <span className={`inline-block h-8 w-8 rounded-full flex items-center justify-center ${
                              notification.severity === 'high' 
                                ? 'bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-300' 
                                : 'bg-amber-100 dark:bg-amber-800 text-amber-500 dark:text-amber-300'
                            }`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                              </svg>
                            </span>
                          </div>
                          <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{notification.description}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                    
                    <div className="px-4 py-2 text-center">
                      <a href="#" className="text-sm font-medium text-primary hover:text-primary-dark">Vedi tutte le notifiche</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Menu */}
            <div className="ml-3 relative">
              <div>
                <Button 
                  variant="ghost"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                  className="flex items-center text-sm rounded-full"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-2">
                    <span className="font-medium">{user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                  </div>
                  <span className="hidden md:block">{user?.name}</span>
                  {user?.role && (
                    <span className="inline-block ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {user.role === 'admin' ? 'Admin' : user.role === 'doctor' ? 'Medico' : 'Utente'}
                    </span>
                  )}
                </Button>
              </div>
              
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Link href="/profile">
                      <a className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Profilo
                      </a>
                    </Link>
                    <Link href="/settings">
                      <a className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Impostazioni
                      </a>
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Esci
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
