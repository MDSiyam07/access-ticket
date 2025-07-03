'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';

interface Stats {
  totalTickets: number;
  scannedIn: number;
  scannedOut: number;
  currentlyInside: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTickets: 2500,
    scannedIn: 1847,
    scannedOut: 423,
    currentlyInside: 1424
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        scannedIn: prev.scannedIn + Math.floor(Math.random() * 3),
        scannedOut: prev.scannedOut + Math.floor(Math.random() * 2),
        currentlyInside: prev.scannedIn - prev.scannedOut
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Festival
        </h1>
        <p className="text-gray-600">
          Vue d&apos;ensemble en temps réel du contrôle d&apos;accès
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Billets vendus"
          value={stats.totalTickets}
          icon={Users}
          color="bg-festival-blue"
          description="Capacité totale"
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
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm font-medium">Entrée validée</span>
                </div>
                <span className="text-sm text-gray-500">Il y a 2 min</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm font-medium">Sortie validée</span>
                </div>
                <span className="text-sm text-gray-500">Il y a 5 min</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm font-medium">Entrée validée</span>
                </div>
                <span className="text-sm text-gray-500">Il y a 7 min</span>
              </div>
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
                <span className="text-sm text-gray-600">Taux de scan</span>
                <span className="text-sm font-medium">
                  {Math.round((stats.scannedIn / stats.totalTickets) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-festival-blue h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min((stats.scannedIn / stats.totalTickets) * 100, 100)}%` 
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