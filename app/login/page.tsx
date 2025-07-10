'use client';

import React, { useState } from 'react';

import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine, Eye, EyeOff, Shield, LogIn, LogOut, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Déterminer la page de redirection selon le rôle
        let redirectPath = '/dashboard';
        if (result.role === 'admin') {
          redirectPath = '/admin';
        } else if (result.role === 'entry') {
          redirectPath = '/scan-entry';
        } else if (result.role === 'exit') {
          redirectPath = '/scan-exit';
        } else if (result.role === 'reentry') {
          redirectPath = '/scan-entry'; // Pour les ré-entrées, on utilise la page d'entrée avec titre adapté
        } else if (result.role === 'vendeur') {
          redirectPath = '/scan-selling';
        }
        
        toast.success("Connexion réussie - Bienvenue dans le système de contrôle d'accès !");
        
        // Forcer la redirection immédiatement
        window.location.href = redirectPath;
      } else {
        toast.error("Email ou mot de passe incorrect");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (type: 'admin' | 'entry' | 'exit' | 'reentry' | 'vendeur') => {
    if (type === 'admin') {
      setEmail('admin@festival.com');
      setPassword('admin123');
    } else if (type === 'entry') {
      setEmail('entry@festival.com');
      setPassword('entry123');
    } else if (type === 'exit') {
      setEmail('exit@festival.com');
      setPassword('exit123');
    } else if (type === 'reentry') {
      setEmail('reentry@festival.com');
      setPassword('reentry123');
    } else if (type === 'vendeur') {
      setEmail('vendeur@festival.com');
      setPassword('vendeur123');
    }
  };

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

          {/* Comptes spécialisés */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Comptes spécialisés :</h3>
            
            {/* Compte Admin */}
            <div className="glass-card p-6 border-l-4 border-l-modern-violet-500">
              <div className="flex items-center mb-3">
                <Shield className="w-5 h-5 text-modern-violet-600 mr-2" />
                <span className="font-medium text-modern-violet-800">Administrateur</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Accès complet : import, statistiques, historique, administration
              </p>
              <div className="space-y-1 text-sm text-modern-violet-600">
                <p>Email: admin@festival.com</p>
                <p>Mot de passe: admin123</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('admin')}
                className="mt-3 w-full border-modern-violet-300 text-modern-violet-700 hover:bg-modern-violet-50 rounded-2xl"
              >
                Utiliser ce compte
              </Button>
            </div>

            {/* Compte Entrées */}
            <div className="glass-card p-6 border-l-4 border-l-modern-cyan-500">
              <div className="flex items-center mb-3">
                <LogIn className="w-5 h-5 text-modern-cyan-600 mr-2" />
                <span className="font-medium text-modern-cyan-800">Contrôleur Entrées</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Accès : scan d&apos;entrée uniquement
              </p>
              <div className="space-y-1 text-sm text-modern-cyan-600">
                <p>Email: entry@festival.com</p>
                <p>Mot de passe: entry123</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('entry')}
                className="mt-3 w-full border-modern-cyan-300 text-modern-cyan-700 hover:bg-modern-cyan-50 rounded-2xl"
              >
                Utiliser ce compte
              </Button>
            </div>

            {/* Compte Sorties */}
            <div className="glass-card p-6 border-l-4 border-l-modern-gold-500">
              <div className="flex items-center mb-3">
                <LogOut className="w-5 h-5 text-modern-gold-600 mr-2" />
                <span className="font-medium text-modern-gold-800">Contrôleur Sorties</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Accès : scan de sortie uniquement
              </p>
              <div className="space-y-1 text-sm text-modern-gold-600">
                <p>Email: exit@festival.com</p>
                <p>Mot de passe: exit123</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('exit')}
                className="mt-3 w-full border-modern-gold-300 text-modern-gold-700 hover:bg-modern-gold-50 rounded-2xl"
              >
                Utiliser ce compte
              </Button>
            </div>

            {/* Compte Ré-entrées */}
            <div className="glass-card p-6 border-l-4 border-l-modern-green-500">
              <div className="flex items-center mb-3">
                <RefreshCw className="w-5 h-5 text-modern-green-600 mr-2" />
                <span className="font-medium text-modern-green-800">Contrôleur Ré-entrées</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Accès : gestion des ré-entrées (sorties et ré-entrées)
              </p>
              <div className="space-y-1 text-sm text-modern-green-600">
                <p>Email: reentry@festival.com</p>
                <p>Mot de passe: reentry123</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('reentry')}
                className="mt-3 w-full border-modern-green-300 text-modern-green-700 hover:bg-modern-green-50 rounded-2xl"
              >
                Utiliser ce compte
              </Button>
            </div>

            {/* Compte Vendeur */}
            <div className="glass-card p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center mb-3">
                <ScanLine className="w-5 h-5 text-orange-600 mr-2" />
                <span className="font-medium text-orange-800">Vendeur de Tickets</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Accès : scan de vente et statistiques
              </p>
              <div className="space-y-1 text-sm text-orange-600">
                <p>Email: vendeur@festival.com</p>
                <p>Mot de passe: vendeur123</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('vendeur')}
                className="mt-3 w-full border-orange-300 text-orange-700 hover:bg-orange-50 rounded-2xl"
              >
                Utiliser ce compte
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}