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
  Settings,
  LogIn,
  LogOut,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';

interface NavbarProps {
  children: React.ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  const { user, logout, isAuthenticated, isLoading, isAdmin, isEntryUser, isExitUser, isReentryUser } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Calculer si l'utilisateur est vendeur
  const isVendeurUser = user?.role === 'vendeur';

  // Redirect to login if not authenticated (except for login page)
  useEffect(() => {
    // Éviter les redirections multiples
    if (redirecting) return;

    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      setRedirecting(true);
      // Utiliser un délai pour éviter les conflits sur Android
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }, [isAuthenticated, isLoading, pathname, redirecting]);

  // Vérification de sécurité pour éviter les boucles infinies
  useEffect(() => {
    if (!isLoading && !redirecting) {
      const safetyTimer = setTimeout(() => {
        if (isLoading) {
          console.warn('Navbar loading state stuck - forcing reset');
          setRedirecting(false);
        }
      }, 3000);

      return () => clearTimeout(safetyTimer);
    }
  }, [isLoading, redirecting]);

  // Don't render navbar on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-modern-violet-50 via-modern-cyan-50 to-modern-violet-100">
        <LoadingSpinner size="md" text="Chargement..." />
      </div>
    );
  }

  // Don't render if not authenticated or redirecting
  if (!isAuthenticated || redirecting) {
    return null;
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (isAdmin) {
      return [
        { name: 'Statistiques', href: '/dashboard', icon: BarChart3 },
        { name: 'Scan Entrée', href: '/scan-entry', icon: LogIn },
        { name: 'Scan Sortie', href: '/scan-exit', icon: LogOut },
        { name: 'Scan Vente', href: '/scan-selling', icon: ScanLine },
        { name: 'Scan Re-Entrée', href: '/scan-reentry', icon: LogIn },
        { name: 'Historique', href: '/history', icon: History },
        { name: 'Saisie Manuelle', href: '/manual-entry', icon: Edit3 },
        { name: 'Gestion administrateur', href: '/admin', icon: Settings },
      ];
    } else if (isVendeurUser) {
      return [
        { name: 'Statistiques', href: '/dashboard', icon: BarChart3 },
        { name: 'Scan Vente', href: '/scan-selling', icon: ScanLine },
        { name: 'Saisie Manuelle', href: '/manual-selling', icon: Edit3 },
      ];
    } else if (isEntryUser) {
      return [
        { name: 'Statistiques', href: '/dashboard', icon: BarChart3 },
        { name: 'Scan Entrée', href: '/scan-entry', icon: LogIn },
        { name: 'Saisie Manuelle', href: '/manual-entry', icon: Edit3 },
      ];
    } else if (isExitUser) {
      return [
        { name: 'Statistiques', href: '/dashboard', icon: BarChart3 },
        { name: 'Scan Sortie', href: '/scan-exit', icon: LogOut },
        { name: 'Saisie Manuelle', href: '/manual-entry', icon: Edit3 },
      ];
    } else if (isReentryUser) {
      return [
        { name: 'Statistiques', href: '/dashboard', icon: BarChart3 },
        { name: 'Scan Re-Entrée', href: '/scan-reentry', icon: LogIn },
      ];
    }

    return [];
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

  const getUserRoleDisplay = () => {
    if (isAdmin) return 'Administrateur';
    if (isVendeurUser) return 'Vendeur';
    if (isEntryUser) return 'Contrôleur Entrées';
    if (isExitUser) return 'Contrôleur Sorties';
    if (isReentryUser) return 'Contrôleur Ré-entrées';
    return 'Utilisateur';
  };

  const getRoleColor = () => {
    if (isAdmin) return 'text-modern-violet-600';
    if (isVendeurUser) return 'text-modern-orange-600';
    if (isEntryUser) return 'text-modern-cyan-600';
    if (isExitUser) return 'text-modern-gold-600';
    if (isReentryUser) return 'text-modern-green-600';
    return 'text-gray-600';
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
            <div className="ml-3 flex items-center gap-1 bg-modern-violet-100 text-modern-violet-800 px-3 py-1 rounded-2xl text-xs font-medium border border-modern-violet-200">
              <span className={`w-2 h-2 rounded-full ${getRoleColor().replace('text-', 'bg-')}`}></span>
              {getUserRoleDisplay()}
            </div>
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
          className="lg:hidden fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-2xl" 
          onClick={handleOverlayClick}
        >
          <div className="fixed inset-y-0 left-0 w-72 bg-gray-900/60 backdrop-blur-2xl shadow-2xl rounded-r-3xl" onClick={handleMenuClick}>
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
                {isVendeurUser && (
                  <div className="ml-3 flex items-center gap-1 bg-modern-orange-100 text-modern-orange-800 px-3 py-1 rounded-2xl text-xs font-medium border border-modern-orange-200">
                    <ScanLine className="w-3 h-3" />
                    Vendeur
                  </div>
                )}
                {isEntryUser && (
                  <div className="ml-3 flex items-center gap-1 bg-modern-cyan-100 text-modern-cyan-800 px-3 py-1 rounded-2xl text-xs font-medium border border-modern-cyan-200">
                    <LogIn className="w-3 h-3" />
                    Entrée
                  </div>
                )}
                {isExitUser && (
                  <div className="ml-3 flex items-center gap-1 bg-modern-gold-100 text-modern-gold-800 px-3 py-1 rounded-2xl text-xs font-medium border border-modern-gold-200">
                    <LogOut className="w-3 h-3" />
                    Sortie
                  </div>
                )}
                {isReentryUser && (
                  <div className="ml-3 flex items-center gap-1 bg-modern-green-100 text-modern-green-800 px-3 py-1 rounded-2xl text-xs font-medium border border-modern-green-200">
                    <LogIn className="w-3 h-3" />
                    Ré-entrée
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
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 text-white ${
                        isActive
                          ? 'bg-modern-violet-500 shadow-lg'
                          : 'hover:bg-modern-violet-50 hover:scale-105'
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
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-white">{user?.email}</p>
                    {isAdmin && (
                      <p className="text-xs text-modern-violet-600 font-medium">Administrateur</p>
                    )}
                    {isVendeurUser && (
                      <p className="text-xs text-modern-orange-600 font-medium">Vendeur</p>
                    )}
                    {isEntryUser && (
                      <p className="text-xs text-modern-cyan-600 font-medium">Contrôleur Entrées</p>
                    )}
                    {isExitUser && (
                      <p className="text-xs text-modern-gold-600 font-medium">Contrôleur Sorties</p>
                    )}
                    {isReentryUser && (
                      <p className="text-xs text-modern-green-600 font-medium">Contrôleur Ré-entrées</p>
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
              <div className="flex items-center px-8 py-4 border-b border-border/50 min-h-[64px]">
                <div className="bg-black/40 rounded-2xl w-10 h-10 flex items-center justify-center">
                  <ScanLine className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-lg font-semibold text-gray-900 whitespace-nowrap">AccessTicket</span>
                {isAdmin && (
                  <div className="ml-3 flex items-center gap-1 bg-purple-700/80 text-white px-3 py-1 rounded-2xl text-sm font-medium border border-purple-400">
                    <Shield className="w-4 h-4" />
                    Admin
                  </div>
                )}
                {isVendeurUser && (
                  <div className="ml-3 flex items-center gap-1 bg-orange-700/80 text-white px-3 py-1 rounded-2xl text-sm font-medium border border-orange-400">
                    <ScanLine className="w-4 h-4" />
                    Vendeur
                  </div>
                )}
                {isEntryUser && (
                  <div className="ml-3 flex items-center gap-1 bg-cyan-700/80 text-white px-3 py-1 rounded-2xl text-sm font-medium border border-cyan-400">
                    <LogIn className="w-4 h-4" />
                    Entrée
                  </div>
                )}
                {isExitUser && (
                  <div className="ml-3 flex items-center gap-1 bg-yellow-700/80 text-white px-3 py-1 rounded-2xl text-sm font-medium border border-yellow-400">
                    <LogOut className="w-4 h-4" />
                    Sortie
                  </div>
                )}
                {isReentryUser && (
                  <div className="ml-3 flex items-center gap-1 bg-green-700/80 text-white px-3 py-1 rounded-2xl text-sm font-medium border border-green-400">
                    <LogIn className="w-4 h-4" />
                    Ré-entrée
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
              </div>

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
                    <p className={`text-xs font-medium ${getRoleColor()}`}>{getUserRoleDisplay()}</p>
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