'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock, TrendingUp, Shield, User, ShoppingCart, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';


interface Event {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

interface Stats {
  totalTickets: number;
  scannedIn: number;
  scannedOut: number;
  currentlyInside: number;
  pending: number;
  vendus: number;
}

interface OnlineUsers {
  onlineUsers: number;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
}

interface UserSalesStats {
  id: string;
  name: string;
  email: string;
  role: string;
  totalSales: number;
}

interface Activity {
  id: string;
  ticketNumber: string;
  action: 'ENTER' | 'EXIT' | 'SOLD';
  scannedAt: string;
  timeAgo: string;
}

export default function Dashboard() {
  const { isAdmin } = useAuth();

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    scannedIn: 0,
    scannedOut: 0,
    currentlyInside: 0,
    pending: 0,
    vendus: 0,
  });
  const [onlineUsers, setOnlineUsers] = useState<OnlineUsers>({
    onlineUsers: 0,
    usersByRole: [],
  });
  const [userSalesStats, setUserSalesStats] = useState<UserSalesStats[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Charger les événements au montage
  useEffect(() => {
    fetchEvents();
  }, []);

  // Charger les stats quand un événement est sélectionné
  useEffect(() => {
    if (selectedEventId) {
      fetchStats();
      fetchOnlineUsers();
      fetchUserSalesStats();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData);
        // Sélectionner automatiquement le premier événement actif
        const activeEvent = eventsData.find((event: Event) => event.isActive);
        if (activeEvent) {
          setSelectedEventId(activeEvent.id);
        } else if (eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  };

  const fetchStats = async () => {
    if (!selectedEventId) return;
    
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        fetch(`/api/tickets/stats?eventId=${selectedEventId}`),
        fetch(`/api/tickets/activity?eventId=${selectedEventId}`)
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalTickets: statsData.total,
          scannedIn: statsData.entered,
          scannedOut: statsData.exited,
          currentlyInside: Math.max(0, statsData.vendus - statsData.entered), // Personnes en route (vendus - entrées)
          pending: statsData.pending,
          vendus: statsData.vendus
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

  const fetchOnlineUsers = async () => {
    if (!selectedEventId) return;
    
    try {
      const response = await fetch(`/api/users/online?eventId=${selectedEventId}`);
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs connectés:', error);
    }
  };

  const fetchUserSalesStats = async () => {
    if (!selectedEventId) return;
    
    try {
      const response = await fetch(`/api/users/sales-stats?eventId=${selectedEventId}`);
      if (response.ok) {
        const data = await response.json();
        setUserSalesStats(data.userSalesStats || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques de ventes:', error);
    }
  };

  // Refresh data every 30 seconds
  useEffect(() => {
    if (selectedEventId) {
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedEventId]);

  const selectedEvent = events.find(event => event.id === selectedEventId);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
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
          
          {/* Dropdown de sélection d'événement */}
          <div className="relative">
            <button
              onClick={() => setShowEventDropdown(!showEventDropdown)}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {selectedEvent ? selectedEvent.name : 'Sélectionner un événement'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {showEventDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px]">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setShowEventDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                      selectedEventId === event.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{event.name}</div>
                    {event.startDate && (
                      <div className="text-xs text-gray-500">
                        {new Date(event.startDate).toLocaleDateString()}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <h1 className="text-4xl font-bold gradient-text mb-2">
          {isAdmin ? 'Tableau de Bord Administrateur' : 'Tableau de Bord Utilisateur'}
          {selectedEvent && (
            <span className="text-2xl font-normal text-gray-600 ml-4">
              - {selectedEvent.name}
            </span>
          )}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isAdmin 
            ? "Vue d'ensemble complète du contrôle d'accès avec toutes les fonctionnalités"
                          : "Vue d'ensemble simplifiée pour le contrôle d'accès"
          }
          {selectedEvent && (
            <span className="block text-sm text-gray-500 mt-1">
              Statistiques pour l&apos;événement sélectionné
            </span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets}
          icon={Users}
          description="Tickets importés"
          color="violet"
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
          value={stats.scannedIn - stats.scannedOut}
          icon={Users}
          description="Personnes dans l'événement"
          color="violet"
        />
        <StatCard
          title="En attente"
          value={stats.currentlyInside}
          icon={TrendingUp}
          description="Vendus mais pas encore entrés"
          color="violet"
        />
        <StatCard
          title="Tickets Vendus"
          value={stats.vendus}
          icon={ShoppingCart}
          description="Billets émis"
          color="gold"
        />
        <StatCard
          title="Utilisateurs connectés"
          value={onlineUsers.onlineUsers}
          icon={Users}
          description="Équipe active"
          color="violet"
        />
      </div>

      {/* Live Activity - seulement pour les admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-card lg:col-span-2">
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
                        item.action === 'ENTER' ? 'bg-green-50' : 
                        item.action === 'EXIT' ? 'bg-blue-50' : 
                        'bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-3 ${
                            item.action === 'ENTER' ? 'bg-green-500' : 
                            item.action === 'EXIT' ? 'bg-blue-500' : 
                            'bg-yellow-500'
                          }`}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            Ticket #{item.ticketNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.action === 'ENTER' ? 'Entrée' : 
                             item.action === 'EXIT' ? 'Sortie' : 
                             'Vente'} - {item.timeAgo}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          item.action === 'ENTER'
                            ? 'bg-green-100 text-green-800'
                            : item.action === 'EXIT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.action === 'ENTER' ? 'ENTRÉE' : 
                         item.action === 'EXIT' ? 'SORTIE' : 
                         'VENDU'}
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
                <Link href="/admin" className="w-full block text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Gérer les tickets</p>
                      <p className="text-sm text-gray-500">Import et gestion des billets</p>
                    </div>
                  </div>
                </Link>
                <Link href="/history" className="w-full block text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Voir l&apos;historique</p>
                      <p className="text-sm text-gray-500">Toutes les activités passées</p>
                    </div>
                  </div>
                </Link>
                <Link href="/admin" className="w-full block text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-3 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">Administration</p>
                      <p className="text-sm text-gray-500">Paramètres avancés</p>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques de ventes par utilisateur */}
          <Card className="glass-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-modern-gold-600" />
                Ventes par utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userSalesStats.length > 0 ? (
                  userSalesStats.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-modern-gold-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-modern-gold-600">
                          {user.totalSales}
                        </p>
                        <p className="text-xs text-gray-500">ventes</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun vendeur trouvé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}