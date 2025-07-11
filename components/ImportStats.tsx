'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, CheckCircle, XCircle, Clock, ShoppingCart, Download } from 'lucide-react';

interface ImportStats {
  total: number;
  imported: number;
  duplicates: number;
  pending: number;
  entered: number;
  exited: number;
  vendus: number;
}

interface ImportStatsProps {
  eventId?: string;
}

export default function ImportStats({ eventId }: ImportStatsProps) {
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchStats();
    }
  }, [eventId]);

  const fetchStats = async () => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`/api/tickets/stats?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!eventId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Veuillez sélectionner un événement pour voir les statistiques
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        Impossible de charger les statistiques
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Tous les tickets importés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Tickets non utilisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendus</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.vendus}</div>
            <p className="text-xs text-muted-foreground">
              Tickets vendus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.entered}</div>
            <p className="text-xs text-muted-foreground">
              Tickets validés en entrée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sortis</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.exited}</div>
            <p className="text-xs text-muted-foreground">
              Tickets validés en sortie
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lien d'export des statistiques */}
      <div className="text-center">
        <button
          onClick={async () => {
            if (!eventId) return;
            try {
              const response = await fetch(`/api/events/${eventId}/export`);
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `statistiques-evenement-${new Date().toISOString().split('T')[0]}.csv`;
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
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Cliquer ici pour exporter les statistiques
        </button>
      </div>
    </div>
  );
} 