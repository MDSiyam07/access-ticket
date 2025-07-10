'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine, Eye, EyeOff, Shield } from 'lucide-react';
// import toast from 'react-hot-toast';

export default function Login() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirection automatique si déjà connecté
  useEffect(() => {
    console.log('[Login] useEffect - user:', user);
    if (user) {
      let redirectPath = '/dashboard';
      if (user.role === 'admin') {
        redirectPath = '/admin';
      } else if (user.role === 'entry') {
        redirectPath = '/scan-entry';
      } else if (user.role === 'exit') {
        redirectPath = '/scan-exit';
      } else if (user.role === 'reentry') {
        redirectPath = '/scan-entry';
      } else if (user.role === 'vendeur') {
        redirectPath = '/scan-selling';
      }
      console.log('[Login] Redirecting to:', redirectPath);
      router.push(redirectPath);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // La redirection sera gérée par le useEffect quand l'utilisateur sera mis à jour
        console.log('Connexion réussie, redirection en cours...');
      } else {
        // Email ou mot de passe incorrect
        console.log('Échec de connexion');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Les comptes tests ont été supprimés - les utilisateurs sont maintenant gérés via la page admin

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-modern-violet-50 via-modern-cyan-50 to-modern-violet-100">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-modern-violet-600 via-modern-violet-500 to-modern-cyan-500"></div>
        <div className="flex flex-col justify-center items-center text-white p-12 relative z-10">
          <div className="glassmorphism w-24 h-24 flex items-center justify-center mb-8 floating-animation">
            <ScanLine className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-6 text-center gradient-text">AccessTicket</h1>
          <p className="text-xl text-center opacity-90 max-w-md leading-relaxed">
            Système de contrôle d&apos;accès professionnel pour votre événement
          </p>
          <div className="mt-8 flex space-x-4">
            <div className="w-3 h-3 bg-modern-cyan-300 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-modern-gold-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-3 h-3 bg-modern-violet-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="glassmorphism w-20 h-20 flex items-center justify-center mb-6">
              <ScanLine className="w-10 h-10 text-modern-violet-600" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">AccessTicket</h1>
          </div>

          <div className="glass-card p-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Connexion</h2>
              <p className="text-muted-foreground mb-8">
                Connectez-vous à votre compte spécialisé
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base rounded-2xl border-modern-violet-200 focus:border-modern-violet-500 focus:ring-modern-violet-500"
                  placeholder="admin@festival.com"
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base pr-12 rounded-2xl border-modern-violet-200 focus:border-modern-violet-500 focus:ring-modern-violet-500"
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base glass-button"
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </div>
            </form>
          </div>

          {/* Information sur la gestion des utilisateurs */}
          <div className="mt-8">
            <div className="glass-card p-6 border-l-4 border-l-modern-violet-500">
              <div className="flex items-center mb-3">
                <Shield className="w-5 h-5 text-modern-violet-600 mr-2" />
                <span className="font-medium text-modern-violet-800">Gestion des utilisateurs</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Les utilisateurs sont gérés par l&apos;administrateur via la page d&apos;administration.
              </p>
              <p className="text-sm text-modern-violet-600">
                Contactez votre administrateur pour obtenir vos identifiants de connexion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}