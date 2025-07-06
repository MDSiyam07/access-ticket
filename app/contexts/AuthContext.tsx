'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'entry' | 'exit' | 'reentry';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isEntryUser: boolean;
  isExitUser: boolean;
  isReentryUser: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: 'admin' | 'entry' | 'exit' | 'reentry' }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configuration des utilisateurs spécialisés (en production, cela devrait être dans une base de données)
const USERS = {
  'admin@festival.com': {
    id: '1',
    email: 'admin@festival.com',
    name: 'Administrateur Festival',
    role: 'admin' as const,
    password: 'admin123' // En production, utiliser des hash bcrypt
  },
  'entry@festival.com': {
    id: '2',
    email: 'entry@festival.com',
    name: 'Contrôleur Entrées',
    role: 'entry' as const,
    password: 'entry123'
  },
  'exit@festival.com': {
    id: '3',
    email: 'exit@festival.com',
    name: 'Contrôleur Sorties',
    role: 'exit' as const,
    password: 'exit123'
  },
  'reentry@festival.com': {
    id: '4',
    email: 'reentry@festival.com',
    name: 'Contrôleur Ré-entrées',
    role: 'reentry' as const,
    password: 'reentry123'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    // Only run on client side
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('festival-user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Vérifier que l'utilisateur existe toujours dans la configuration
          if (USERS[parsedUser.email as keyof typeof USERS]) {
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Utilisateur supprimé de la configuration, déconnecter
            localStorage.removeItem('festival-user');
          }
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('festival-user');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: 'admin' | 'entry' | 'exit' | 'reentry' }> => {
    try {
      setIsLoading(true);
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userConfig = USERS[email as keyof typeof USERS];
      
      if (userConfig && userConfig.password === password) {
        const newUser = {
          id: userConfig.id,
          email: userConfig.email,
          name: userConfig.name,
          role: userConfig.role
        };
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        // Safe localStorage access
        if (typeof window !== 'undefined') {
          localStorage.setItem('festival-user', JSON.stringify(newUser));
        }
        
        return { success: true, role: userConfig.role };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Safe localStorage access
    if (typeof window !== 'undefined') {
      localStorage.removeItem('festival-user');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isEntryUser = user?.role === 'entry';
  const isExitUser = user?.role === 'exit';
  const isReentryUser = user?.role === 'reentry';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        isAdmin,
        isEntryUser,
        isExitUser,
        isReentryUser,
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};