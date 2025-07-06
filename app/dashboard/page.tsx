'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, TrendingUp, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalTickets: number;
  scannedIn: number;
  scannedOut: number;
  currentlyInside: number;
  pending: number;
}

interface Activity {
  id: string;
  ticketNumber: string;
  action: 'ENTER' | 'EXIT';
  scannedAt: string;
  timeAgo: string;
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    scannedIn: 0,
    scannedOut: 0,
    currentlyInside: 0,
    pending: 0
  });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from API
  useEffect(() => {
    fetchStats();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/tickets/stats'),
        fetch('/api/tickets/activity')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalTickets: statsData.total,
          scannedIn: statsData.entered,
          scannedOut: statsData.exited,
          currentlyInside: statsData.entered - statsData.exited,
          pending: statsData.pending
        });
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivity(activityData.activity || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    color = 'violet'
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    description: string;
    color?: 'violet' | 'cyan' | 'gold';
  }) => {
    const colorClasses = {
      violet: 'bg-modern-violet-500 text-white',
      cyan: 'bg-modern-cyan-500 text-white',
      gold: 'bg-modern-gold-500 text-white'
    };

    return (
      <Card className="glass-card animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
          <div className={`p-3 rounded-2xl ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-1">
            {value.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Statistiques Festival
          </h1>
          <p className="text-muted-foreground">
            Chargement des données...
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded-2xl w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded-2xl w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec badge de rôle */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {isAdmin ? (
            <div className="flex items-center gap-2 bg-modern-violet-100 text-modern-violet-800 px-4 py-2 rounded-2xl text-sm font-medium border border-modern-violet-200">
              <Shield className="w-4 h-4" />
              Mode Administrateur
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-modern-cyan-100 text-modern-cyan-800 px-4 py-2 rounded-2xl text-sm font-medium border border-modern-cyan-200">
              <User className="w-4 h-4" />
              Mode Utilisateur
            </div>
          )}
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-2">
          {isAdmin ? 'Tableau de Bord Administrateur' : 'Tableau de Bord Utilisateur'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isAdmin 
            ? "Vue d'ensemble complète du contrôle d'accès avec toutes les fonctionnalités"
            : "Vue d'ensemble simplifiée pour le contrôle d'accès"
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets}
          icon={Users}
          description="Tickets importés"
          color="violet"
        />
        <StatCard
          title="En Attente"
          value={stats.pending}
          icon={Clock}
          description="Tickets non utilisés"
          color="gold"
        />
        <StatCard
          title="Entrées scannées"
          value={stats.scannedIn}
          icon={UserCheck}
          description="Billets validés à l'entrée"
          color="cyan"
        />
        <StatCard
          title="Sorties scannées"
          value={stats.scannedOut}
          icon={UserX}
          description="Billets validés à la sortie"
          color="cyan"
        />
        <StatCard
          title="Présents actuellement"
          value={stats.currentlyInside}
          icon={TrendingUp}
          description="Différence entrées - sorties"
          color="violet"
        />
      </div>

      {/* Live Activity - seulement pour les admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-modern-cyan-600" />
                Activité en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.length > 0 ? (
                  activity.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        item.action === 'ENTER' ? 'bg-green-50' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-3 ${
                            item.action === 'ENTER' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            Ticket #{item.ticketNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.action === 'ENTER' ? 'Entrée' : 'Sortie'} - {item.timeAgo}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          item.action === 'ENTER'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.action === 'ENTER' ? 'ENTRÉE' : 'SORTIE'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-modern-cyan-600" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Gérer les tickets</p>
                      <p className="text-sm text-gray-500">Import et gestion des billets</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Voir l&apos;historique</p>
                      <p className="text-sm text-gray-500">Toutes les activités passées</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-3 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">Administration</p>
                      <p className="text-sm text-gray-500">Paramètres avancés</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}