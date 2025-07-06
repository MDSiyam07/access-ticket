'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  BarChart3, 
  ScanLine, 
  LogOut as LogOutIcon, 
  History, 
  Edit3, 
  Menu, 
  X,
  Users,
  Settings,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  children: React.ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  const { user, logout, isAuthenticated, isLoading, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect to login if not authenticated (except for login page)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading, pathname]);

  // Don't render navbar on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-modern-violet-50 via-modern-cyan-50 to-modern-violet-100">
        <div className="glass-card p-8 text-center floating-animation">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-modern-violet-200 border-t-modern-violet-600 mx-auto pulse-glow"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-modern-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-semibold gradient-text">Chargement...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Statistiques', href: '/dashboard', icon: BarChart3 },
      { name: 'Scan Entrée', href: '/scan-entry', icon: ScanLine },
      { name: 'Scan Sortie', href: '/scan-exit', icon: Users },
    ];

    if (isAdmin) {
      return [
        ...baseItems,
        { name: 'Historique', href: '/history', icon: History },
        { name: 'Saisie Manuelle', href: '/manual-entry', icon: Edit3 },
        { name: 'Administration', href: '/admin', icon: Settings },
      ];
    }

    return baseItems;
  };

  const navigation = getNavigationItems();

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    window.location.href = '/login';
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-modern-violet-50 via-modern-cyan-50 to-modern-violet-100">
      {/* Mobile menu button */}
      <div className="lg:hidden glass-card border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <div className="glassmorphism w-10 h-10 flex items-center justify-center">
              <ScanLine className="w-6 h-6 text-modern-violet-600" />
            </div>
            <span className="ml-3 text-lg font-semibold gradient-text">AccessTicket</span>
            {isAdmin && (
              <div className="ml-3 flex items-center gap-1 bg-modern-violet-100 text-modern-violet-800 px-3 py-1 rounded-2xl text-xs font-medium border border-modern-violet-200">
                <Shield className="w-3 h-3" />
                Admin
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-modern-violet-50 rounded-2xl"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" 
          onClick={handleOverlayClick}
        >
          <div className="fixed inset-y-0 left-0 w-72 glass-card shadow-2xl" onClick={handleMenuClick}>
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center px-6 py-4 border-b border-border/50">
                <div className="glassmorphism w-10 h-10 flex items-center justify-center">
                  <ScanLine className="w-6 h-6 text-modern-violet-600" />
                </div>
                <span className="ml-3 text-lg font-semibold gradient-text">AccessTicket</span>
                {isAdmin && (
                  <div className="ml-3 flex items-center gap-1 bg-modern-violet-100 text-modern-violet-800 px-3 py-1 rounded-2xl text-xs font-medium border border-modern-violet-200">
                    <Shield className="w-3 h-3" />
                    Admin
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
                        isActive
                          ? 'bg-modern-violet-500 text-white shadow-lg'
                          : 'text-foreground hover:bg-modern-violet-50 hover:scale-105'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* User info and logout */}
              <div className="border-t border-border/50 p-4">
                <div className="flex items-center mb-3">
                  <div className="glassmorphism w-10 h-10 rounded-2xl flex items-center justify-center">
                    <span className="text-sm font-medium text-modern-violet-600">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {isAdmin && (
                      <p className="text-xs text-modern-violet-600 font-medium">Administrateur</p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-modern-violet-200 text-modern-violet-700 hover:bg-modern-violet-50 rounded-2xl"
                >
                  <LogOutIcon className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64">
          <div className="flex flex-col w-full">
            <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
                <div className="w-8 h-8 bg-festival-blue rounded-lg flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">AccessTicket</span>
                {isAdmin && (
                  <div className="ml-2 flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Admin
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex-1 flex flex-col overflow-y-auto">
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-festival-blue text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                {/* User info and logout */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user?.name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      {isAdmin && (
                        <p className="text-xs text-red-600 font-medium">Administrateur</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}