'use client';

import React, { useState } from 'react';

import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine, Eye, EyeOff, Shield, User } from 'lucide-react';
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
        const redirectPath = result.role === 'admin' ? '/admin' : '/dashboard';
        
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

  const fillCredentials = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@festival.com');
      setPassword('admin123');
    } else {
      setEmail('user@festival.com');
      setPassword('user123');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 festival-gradient relative overflow-hidden">
        <div className="flex flex-col justify-center items-center text-white p-12 relative z-10">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6">
            <ScanLine className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">AccessTicket</h1>
          <p className="text-xl text-center opacity-90 max-w-md">
            Système de contrôle d&apos;accès professionnel pour votre événement
          </p>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-festival-blue rounded-xl flex items-center justify-center mb-4">
              <ScanLine className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AccessTicket</h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
            <p className="text-gray-600 mb-8">
              Connectez-vous à votre compte
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="h-12 text-base"
                placeholder="admin@festival.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="h-12 text-base pr-12"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base festival-button"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </div>
          </form>

          {/* Comptes de démonstration */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comptes de démonstration :</h3>
            
            {/* Compte Admin */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center mb-2">
                <Shield className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">Administrateur</span>
              </div>
              <p className="text-sm text-red-700 mb-3">
                Accès complet : import, statistiques, historique, administration
              </p>
              <div className="space-y-1 text-sm text-red-600">
                <p>Email: admin@festival.com</p>
                <p>Mot de passe: admin123</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('admin')}
                className="mt-3 w-full border-red-300 text-red-700 hover:bg-red-100"
              >
                Utiliser ce compte
              </Button>
            </div>

            {/* Compte User */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">Utilisateur</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Accès limité : scan d&apos;entrée et de sortie uniquement
              </p>
              <div className="space-y-1 text-sm text-blue-600">
                <p>Email: user@festival.com</p>
                <p>Mot de passe: user123</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('user')}
                className="mt-3 w-full border-blue-300 text-blue-700 hover:bg-blue-100"
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