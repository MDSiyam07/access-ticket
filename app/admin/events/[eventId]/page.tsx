'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TicketImport from '../../../../components/TicketImport';
import ImportStats from '../../../../components/ImportStats';
import AdminRoute from '../../../../components/AdminRoute';
import { Shield, ArrowLeft, FileText, BarChart3, Users, Download } from 'lucide-react';
import LoadingSpinner from '../../../../components/LoadingSpinner';

interface Event {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export default function EventManagementPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const { eventId } = useParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const events = await response.json();
          const currentEvent = events.find((e: Event) => e.id === eventId);
          if (currentEvent) {
            setEvent(currentEvent);
          } else {
            // Événement non trouvé, rediriger vers la page admin
            router.push('/admin');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'événement:', error);
        router.push('/admin');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    if (isAuthenticated) {
      fetchEvent();
    }
  }, [eventId, isAuthenticated, router]);

  if (isLoading || isLoadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" text="Chargement..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Événement non trouvé</h2>
          <p className="text-gray-600 mb-4">L&apos;événement demandé n&apos;existe pas.</p>
          <button
            onClick={() => router.push('/admin')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour à l&apos;administration
          </button>
        </div>
      </div>
    );
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
              Gestion de l&apos;événement : {event.name}
            </h1>
            <p className="text-gray-600">
              Connecté en tant que {user?.name} ({user?.email}) - Gestion complète de l&apos;événement
            </p>
            {event.startDate && (
              <p className="text-sm text-gray-500 mt-1">
                Date : {new Date(event.startDate).toLocaleDateString()}
                {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
              </p>
            )}
          </div>

          {/* Grille des fonctionnalités pour cet événement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Import de Tickets</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Importez des fichiers CSV contenant les tickets pour cet événement
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Visualisez les statistiques détaillées pour cet événement
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/events/${event.id}/export`);
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `statistiques-${event.name}-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } else {
                      alert('Erreur lors de l\'export des statistiques');
                    }
                  } catch (error) {
                    console.error('Erreur lors de l\'export:', error);
                    alert('Erreur lors de l\'export des statistiques');
                  }
                }}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter les statistiques
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push(`/admin/events/${event.id}/users`)}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Gestion des Utilisateurs</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Gérez les accès et permissions des utilisateurs pour cet événement
              </p>
              <div className="text-purple-600 text-sm font-medium">
                Cliquer pour accéder →
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Gestion de l&apos;événement : {event.name}
                </h2>
                <p className="text-gray-600">
                  Toutes les opérations ci-dessous concernent cet événement spécifique. 
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/events/${event.id}/export`);
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `statistiques-${event.name}-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } else {
                      alert('Erreur lors de l\'export des statistiques');
                    }
                  } catch (error) {
                    console.error('Erreur lors de l\'export:', error);
                    alert('Erreur lors de l\'export des statistiques');
                  }
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter les statistiques
              </button>
            </div>
            
            <ImportStats eventId={event.id} />
            <div className="mt-8">
              <TicketImport eventId={event.id} />
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
} 