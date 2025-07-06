'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, UserCheck, UserX } from 'lucide-react';

interface ScanRecord {
  id: string;
  ticketId: string;
  type: 'entry' | 'exit';
  status: 'success' | 'failed' | 'duplicate';
  timestamp: Date;
  operator: string;
}

export default function History() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data
  const [records] = useState<ScanRecord[]>([
    {
      id: '1',
      ticketId: 'TK1234',
      type: 'entry',
      status: 'success',
      timestamp: new Date(Date.now() - 30000),
      operator: 'admin@festival.com'
    },
    {
      id: '2',
      ticketId: 'TK5678',
      type: 'exit',
      status: 'success',
      timestamp: new Date(Date.now() - 120000),
      operator: 'admin@festival.com'
    },
    {
      id: '3',
      ticketId: 'TK9012',
      type: 'entry',
      status: 'duplicate',
      timestamp: new Date(Date.now() - 300000),
      operator: 'admin@festival.com'
    },
    {
      id: '4',
      ticketId: 'TK3456',
      type: 'entry',
      status: 'failed',
      timestamp: new Date(Date.now() - 600000),
      operator: 'admin@festival.com'
    },
    {
      id: '5',
      ticketId: 'TK7890',
      type: 'entry',
      status: 'success',
      timestamp: new Date(Date.now() - 900000),
      operator: 'admin@festival.com'
    }
  ]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Succès</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Échec</Badge>;
      case 'duplicate':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Déjà utilisé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'entry' ? (
      <UserCheck className="w-4 h-4 text-green-600" />
    ) : (
      <UserX className="w-4 h-4 text-gray-600" />
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
        <Button variant="outline" className="mt-4 sm:mt-0">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
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
                  <SelectItem value="entry">Entrée</SelectItem>
                  <SelectItem value="exit">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Statut</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="failed">Échec</SelectItem>
                  <SelectItem value="duplicate">Déjà utilisé</SelectItem>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
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
                  <div>Opérateur</div>
                </div>
                {filteredRecords.map((record) => (
                  <div key={record.id} className="grid grid-cols-5 gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="font-mono font-medium">{record.ticketId}</div>
                    <div className="flex items-center">
                      {getTypeIcon(record.type)}
                      <span className="ml-2 capitalize">
                        {record.type === 'entry' ? 'Entrée' : 'Sortie'}
                      </span>
                    </div>
                    <div>{getStatusBadge(record.status)}</div>
                    <div className="text-sm">
                      <div>{formatDate(record.timestamp)}</div>
                      <div className="text-gray-500">{formatTime(record.timestamp)}</div>
                    </div>
                    <div className="text-sm text-gray-600">{record.operator}</div>
                  </div>
                ))}
              </div>

              {/* Mobile view */}
              <div className="md:hidden space-y-3">
                {filteredRecords.map((record) => (
                  <Card key={record.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono font-bold text-lg">{record.ticketId}</div>
                      {getStatusBadge(record.status)}
                    </div>
                    <div className="flex items-center mb-2">
                      {getTypeIcon(record.type)}
                      <span className="ml-2 font-medium">
                        {record.type === 'entry' ? 'Entrée' : 'Sortie'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>{formatDate(record.timestamp)} à {formatTime(record.timestamp)}</div>
                      <div>Par: {record.operator}</div>
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