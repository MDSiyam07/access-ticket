'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, UserCheck, UserX, ChevronDown } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

interface ScanRecord {
  id: string;
  ticketId: string;
  ticketNumber: string;
  action: 'ENTER' | 'EXIT';
  scannedAt: string;
  eventId: string;
  eventName: string;
  operator?: string;
}

export default function History() {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOperator, setFilterOperator] = useState('all');
  const [users, setUsers] = useState<{id: string, email: string, name?: string}[]>([]);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Charger les événements au montage
  useEffect(() => {
    fetchEvents();
  }, []);

  // Charger l'historique quand un événement est sélectionné
  useEffect(() => {
    if (selectedEventId) {
      fetchHistory();
    }
  }, [selectedEventId]);

  // Charger la liste des utilisateurs au montage
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.event-dropdown')) {
        setShowEventDropdown(false);
      }
    };

    if (showEventDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEventDropdown]);

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

  const fetchHistory = async () => {
    if (!selectedEventId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/activity?eventId=${selectedEventId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.activity || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const selectedEvent = events.find(event => event.id === selectedEventId);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || record.action.toLowerCase() === filterType;
    const matchesOperator = filterOperator === 'all' || (record.operator || '') === filterOperator;
    return matchesSearch && matchesType && matchesOperator;
  });

  const getStatusBadge = (action: string) => {
    switch (action) {
      case 'ENTER':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Entrée</Badge>;
      case 'EXIT':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sortie</Badge>;
      case 'SOLD':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Vendu</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getTypeIcon = (action: string) => {
    if (action === 'ENTER') return <UserCheck className="w-4 h-4 text-green-600" />;
    if (action === 'EXIT') return <UserX className="w-4 h-4 text-gray-600" />;
    if (action === 'SOLD') return <Download className="w-4 h-4 text-yellow-600" />;
    return null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days}j`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Historique des Scans
          </h1>
          <p className="text-gray-600">
            Consultez l&apos;historique complet des validations de billets
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {/* Dropdown de sélection d'événement */}
          <div className="relative event-dropdown">
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
              <div className="absolute right-0 top-full mt-1 bg-gray-200 border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px]">
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="festival-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-festival-blue" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Numéro de billet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="enter">Entrée</SelectItem>
                  <SelectItem value="exit">Sortie</SelectItem>
                  <SelectItem value="sold">Vendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Opérateur</label>
              <Select value={filterOperator} onValueChange={setFilterOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les opérateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les opérateurs</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.name ? `${user.name} (${user.email})` : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="festival-card">
        <CardHeader>
          <CardTitle>
            Résultats ({filteredRecords.length})
            {selectedEvent && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                pour {selectedEvent.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop view */}
              <div className="hidden md:block">
                <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                  <div>Billet</div>
                  <div>Type</div>
                  <div>Statut</div>
                  <div>Date/Heure</div>
                  <div>Il y a</div>
                </div>
                {filteredRecords.map((record) => (
                  <div key={record.id} className="grid grid-cols-5 gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="font-mono font-medium">{record.ticketNumber}</div>
                    <div className="flex items-center">
                      {getTypeIcon(record.action)}
                      <span className="ml-2 capitalize">
                        {record.action === 'ENTER' ? 'Entrée' : 'Sortie'}
                      </span>
                    </div>
                    <div>{getStatusBadge(record.action)}</div>
                    <div className="text-sm">
                      <div>{formatDate(record.scannedAt)}</div>
                      <div className="text-gray-500">{formatTime(record.scannedAt)}</div>
                    </div>
                    <div className="text-sm text-gray-600">{getTimeAgo(record.scannedAt)}</div>
                  </div>
                ))}
              </div>

              {/* Mobile view */}
              <div className="md:hidden space-y-3">
                {filteredRecords.map((record) => (
                  <Card key={record.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono font-bold text-lg">{record.ticketNumber}</div>
                      {getStatusBadge(record.action)}
                    </div>
                    <div className="flex items-center mb-2">
                      {getTypeIcon(record.action)}
                      <span className="ml-2 font-medium">
                        {record.action === 'ENTER' ? 'Entrée' : 'Sortie'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>{formatDate(record.scannedAt)} à {formatTime(record.scannedAt)}</div>
                      <div>{getTimeAgo(record.scannedAt)}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}