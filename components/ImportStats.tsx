'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, CheckCircle, XCircle, Clock, ShoppingCart, Download, Crown, Music, UserCheck } from 'lucide-react';

interface ImportStats {
  total: number;
  imported: number;
  duplicates: number;
  pending: number;
  entered: number;
  exited: number;
  vendus: number;
  byType?: {
    normal: TypeStats;
    vip: TypeStats;
    artiste: TypeStats;
    staff: TypeStats;
  };
}

interface TypeStats {
  type: string;
  total: number;
  entered: number;
  exited: number;
  pending: number;
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

  const renderTypeStats = (typeStats: TypeStats, typeName: string, icon: React.ReactNode) => (
    <div key={typeName} className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {icon}
        Statistiques {typeName}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Tous les tickets {typeName}
            </p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{typeStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Tickets non utilisés
            </p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendus</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{typeStats.vendus}</div>
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
            <div className="text-2xl font-bold text-green-600">{typeStats.entered}</div>
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
            <div className="text-2xl font-bold text-red-600">{typeStats.exited}</div>
            <p className="text-xs text-muted-foreground">
              Tickets validés en sortie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Route</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{Math.max(0, typeStats.vendus - typeStats.entered)}</div>
            <p className="text-xs text-muted-foreground">
              Vendus - Entrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présents</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{typeStats.entered - typeStats.exited}</div>
            <p className="text-xs text-muted-foreground">
              Entrés - Sortis
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

      {/* Statistiques par type de ticket */}
      {stats.byType && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistiques par type de ticket</h2>
          
          {renderTypeStats(stats.byType.normal, 'Normal', <Users className="w-5 h-5 text-blue-600" />)}
          {renderTypeStats(stats.byType.vip, 'VIP', <Crown className="w-5 h-5 text-yellow-600" />)}
          {renderTypeStats(stats.byType.artiste, 'Artiste', <Music className="w-5 h-5 text-purple-600" />)}
          {renderTypeStats(stats.byType.staff, 'Staff', <UserCheck className="w-5 h-5 text-green-600" />)}
        </div>
      )}

      {/* Lien d'export des statistiques */}
      <div className="text-center mt-8">
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