'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TicketImport from '../../components/TicketImport';
import ImportStats from '../../components/ImportStats';
import AdminRoute from '../../components/AdminRoute';
import { Shield, Users, FileText, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
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
          </div>

          {/* Contenu principal */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <ImportStats />
            <div className="mt-8">
              <TicketImport />
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
} 