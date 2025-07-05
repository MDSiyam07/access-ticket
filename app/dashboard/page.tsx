'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';

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
    color, 
    description 
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    description: string;
  }) => (
    <Card className="festival-card animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {value.toLocaleString()}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Statistiques Festival
          </h1>
          <p className="text-gray-600">
            Chargement des données...
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="festival-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Statistiques Festival
        </h1>
        <p className="text-gray-600">
          Vue d&apos;ensemble en temps réel du contrôle d&apos;accès
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets}
          icon={Users}
          color="bg-festival-blue"
          description="Tickets importés"
        />
        <StatCard
          title="En Attente"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-500"
          description="Tickets non utilisés"
        />
        <StatCard
          title="Entrées scannées"
          value={stats.scannedIn}
          icon={UserCheck}
          color="bg-festival-success"
          description="Billets validés à l'entrée"
        />
        <StatCard
          title="Sorties scannées"
          value={stats.scannedOut}
          icon={UserX}
          color="bg-festival-danger"
          description="Billets validés à la sortie"
        />
        <StatCard
          title="Présents actuellement"
          value={stats.currentlyInside}
          icon={TrendingUp}
          color="bg-purple-500"
          description="Différence entrées - sorties"
        />
      </div>

      {/* Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="festival-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-festival-blue" />
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
                        className={`w-3 h-3 rounded-full mr-3 animate-pulse ${
                          item.action === 'ENTER' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                      ></div>
                      <span className="text-sm font-medium">
                        {item.action === 'ENTER' ? 'Entrée validée' : 'Sortie validée'}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        #{item.ticketNumber}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{item.timeAgo}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Aucune activité récente
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="festival-card">
          <CardHeader>
            <CardTitle>Taux d&apos;occupation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taux d&apos;utilisation</span>
                <span className="text-sm font-medium">
                  {stats.totalTickets > 0 ? Math.round(((stats.scannedIn + stats.scannedOut) / stats.totalTickets) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-festival-blue h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalTickets > 0 ? Math.min(((stats.scannedIn + stats.scannedOut) / stats.totalTickets) * 100, 100) : 0}%` 
                  }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-festival-success">
                    {stats.scannedIn}
                  </div>
                  <div className="text-sm text-gray-500">Entrées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-festival-danger">
                    {stats.scannedOut}
                  </div>
                  <div className="text-sm text-gray-500">Sorties</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}