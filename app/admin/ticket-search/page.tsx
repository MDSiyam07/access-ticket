'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import EventManager from '../../../components/EventManager';
import TicketSearch from '../../../components/TicketSearch';
import AdminRoute from '../../../components/AdminRoute';
import { Shield, ArrowLeft, Search } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function TicketSearchPage() {
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
          {/* Header avec navigation */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l&apos;administration
              </button>
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Mode Administrateur
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Recherche de Tickets
            </h1>
            <p className="text-gray-600">
              Connecté en tant que {user?.name} ({user?.email}) - Recherche de tickets par numéro
            </p>
          </div>

          {/* Gestion des événements */}
          <div className="mb-8">
            <EventManager 
              selectedEventId={selectedEventId}
              onEventSelect={setSelectedEventId}
              redirectToEventPage={false}
            />
          </div>

          {/* Recherche de tickets */}
          {selectedEventId ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <TicketSearch eventId={selectedEventId} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sélectionnez un événement
                </h3>
                <p className="text-gray-600">
                  Veuillez sélectionner un événement ci-dessus pour commencer la recherche de tickets.
                </p>
              </div>
            </div>
          )}

          {/* Message d'information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900">
                  Recherche de tickets
                </h3>
                <p className="text-blue-700 mt-1">
                  Cette fonctionnalité vous permet de rechercher un ticket par son numéro pour vérifier s&apos;il existe dans la base de données de l&apos;événement sélectionné. 
                  Utile pour vérifier si un ticket a été correctement importé ou pour diagnostiquer des problèmes de scan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
} 