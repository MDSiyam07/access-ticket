'use client';

import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, User, Calendar } from 'lucide-react';

interface TicketSearchProps {
  eventId: string;
}

interface Ticket {
  id: string;
  number: string;
  status: string;
  ticketType: string;
  scannedAt?: string;
  soldAt?: string;
  entryType?: string;
  createdAt: string;
  lastAction?: {
    action: string;
    scannedAt: string;
    vendeurId?: string;
  };
}

export default function TicketSearch({ eventId }: TicketSearchProps) {
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    ticket?: Ticket;
    message?: string;
  } | null>(null);

  const handleSearch = async () => {
    if (!ticketNumber.trim()) {
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const response = await fetch('/api/tickets/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticketNumber.trim(),
          eventId: eventId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResult(data);
      } else {
        setSearchResult({
          found: false,
          message: data.error || 'Erreur lors de la recherche'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResult({
        found: false,
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ENTERED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'EXITED':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'VENDU':
        return <User className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ENTERED':
        return 'Entré';
      case 'EXITED':
        return 'Sorti';
      case 'VENDU':
        return 'Vendu';
      case 'MANUAL':
        return 'Saisie manuelle';
      default:
        return 'En attente';
    }
  };

  const getTicketTypeText = (type: string) => {
    switch (type) {
      case 'VIP':
        return 'VIP';
      case 'ARTISTE':
        return 'Artiste';
      case 'STAFF':
        return 'Staff';
      default:
        return 'Normal';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'ENTER':
        return 'Entrée';
      case 'EXIT':
        return 'Sortie';
      case 'SOLD':
        return 'Vendu';
      default:
        return action;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Recherche de Tickets
        </h3>
        <p className="text-gray-600 text-sm">
          Entrez le numéro d&apos;un ticket pour vérifier s&apos;il existe dans la base de données de cet événement.
        </p>
      </div>

      {/* Formulaire de recherche */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Entrez le numéro du ticket..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSearching}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !ticketNumber.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {isSearching ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>

      {/* Résultat de la recherche */}
      {searchResult && (
        <div className="border rounded-lg p-4">
          {searchResult.found ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Ticket trouvé !</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Numéro de ticket:</span>
                  <span className="font-mono text-lg font-bold">{searchResult.ticket!.number}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {getTicketTypeText(searchResult.ticket!.ticketType)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Statut:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(searchResult.ticket!.status)}
                    <span className="text-sm">{getStatusText(searchResult.ticket!.status)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Créé le:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(searchResult.ticket!.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {searchResult.ticket!.lastAction && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Dernière action:</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {getActionText(searchResult.ticket!.lastAction.action)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Date:</span>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(searchResult.ticket!.lastAction.scannedAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">{searchResult.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 