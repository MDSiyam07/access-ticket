'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import EventManager from '../../components/EventManager';
import AdminRoute from '../../components/AdminRoute';
import { Shield, Users, FileText, BarChart3, Calendar, Search } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" text="Chargement..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Header avec badge admin */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Mode Administrateur
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Administration - Contrôle d&apos;Accès
            </h1>
            <p className="text-gray-600">
              Connecté en tant que {user?.name} ({user?.email}) - Accès complet au système
            </p>
          </div>

          {/* Grille des fonctionnalités admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Import de Tickets</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Importez des fichiers CSV contenant les tickets du festival
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Statistiques Avancées</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Visualisez les statistiques détaillées et les rapports
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push('/admin/users')}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Gestion des Utilisateurs</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Gérez les accès et permissions des utilisateurs
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Gestion des Événements</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Créez et gérez vos festivals et événements
              </p>
            </div>
          </div>

          {/* Deuxième ligne de fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push('/admin/ticket-search')}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <Search className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recherche de Tickets</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Recherchez un ticket par son numéro pour vérifier son existence
              </p>
              <div className="text-indigo-600 text-sm font-medium">
                Cliquer pour accéder →
              </div>
            </div>
          </div>

          {/* Gestion des événements */}
          <div className="mb-8">
            <EventManager 
              selectedEventId={selectedEventId}
              onEventSelect={setSelectedEventId}
              redirectToEventPage={true}
            />
          </div>

          {/* Message d'information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900">
                  Gestion des événements
                </h3>
                <p className="text-blue-700 mt-1">
                  Cliquez sur un événement ci-dessus pour accéder à sa page de gestion dédiée. 
                  Chaque événement a sa propre page avec import de tickets, statistiques et gestion des utilisateurs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
} 