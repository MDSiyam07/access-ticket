'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'entry' | 'exit' | 'reentry' | 'vendeur';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isEntryUser: boolean;
  isExitUser: boolean;
  isReentryUser: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: 'admin' | 'entry' | 'exit' | 'reentry' | 'vendeur' }>;
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

// Les utilisateurs sont maintenant gérés par la base de données

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    console.log('[AuthContext] useEffect start');
    // Check if user is already logged in (from localStorage)
    // Only run on client side
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('festival-user');
        console.log('[AuthContext] localStorage.getItem("festival-user") =', savedUser);
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          console.log('[AuthContext] Parsed user:', parsedUser);
          
          // Vérifier que l'utilisateur existe toujours dans la base de données
          const verifyUser = async () => {
            try {
              const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: parsedUser.id }),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  // Mettre à jour l'utilisateur avec les données fraîches de la DB
                  const roleMapping: Record<string, 'admin' | 'entry' | 'exit' | 'reentry' | 'vendeur'> = {
                    'ADMIN': 'admin',
                    'ENTRY': 'entry',
                    'EXIT': 'exit',
                    'REENTRY': 'reentry',
                    'VENDEUR': 'vendeur',
                  };

                  const updatedUser = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    role: roleMapping[data.user.role] || 'entry'
                  };
                  
                  setUser(updatedUser);
                  setIsAuthenticated(true);
                  localStorage.setItem('festival-user', JSON.stringify(updatedUser));
                  console.log('[AuthContext] User authenticated from DB');
                } else {
                  // Utilisateur supprimé de la DB, déconnecter
                  localStorage.removeItem('festival-user');
                  setUser(null);
                  setIsAuthenticated(false);
                  console.log('[AuthContext] User not found in DB, removed from localStorage');
                }
              } else {
                // Erreur API, déconnecter
                localStorage.removeItem('festival-user');
                setUser(null);
                setIsAuthenticated(false);
                console.log('[AuthContext] API error, removed from localStorage');
              }
            } catch (error) {
              console.error('[AuthContext] Error verifying user:', error);
              localStorage.removeItem('festival-user');
              setUser(null);
              setIsAuthenticated(false);
            } finally {
              setIsLoading(false);
              setHasCheckedAuth(true);
              console.log('[AuthContext] setIsLoading(false)');
            }
          };

          verifyUser();
        } else {
          console.log('[AuthContext] No user in localStorage');
          setIsLoading(false);
          setHasCheckedAuth(true);
        }
      } catch (error) {
        console.error('[AuthContext] Error parsing saved user:', error);
        localStorage.removeItem('festival-user');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        setHasCheckedAuth(true);
      }
    } else {
      setIsLoading(false);
      setHasCheckedAuth(true);
      console.log('[AuthContext] setIsLoading(false) (server)');
    }
  }, []);

  useEffect(() => {
    console.log('[AuthContext] isLoading changed:', isLoading);
  }, [isLoading]);

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: 'admin' | 'entry' | 'exit' | 'reentry' | 'vendeur' }> => {
    try {
      setIsLoading(true);
      
      // Appel de l'API d'authentification réelle
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Convertir le rôle de la base de données vers le format de l'interface
        const roleMapping: Record<string, 'admin' | 'entry' | 'exit' | 'reentry' | 'vendeur'> = {
          'ADMIN': 'admin',
          'ENTRY': 'entry',
          'EXIT': 'exit',
          'REENTRY': 'reentry',
          'VENDEUR': 'vendeur',
        };

        const newUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: roleMapping[data.user.role] || 'entry'
        };
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        // Safe localStorage access
        if (typeof window !== 'undefined') {
          localStorage.setItem('festival-user', JSON.stringify(newUser));
        }
        
        return { success: true, role: newUser.role };
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
        isLoading: isLoading || !hasCheckedAuth, 
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