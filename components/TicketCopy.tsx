'use client';

import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';

interface Event {
  id: string;
  name: string;
}

interface TicketCopyProps {
  eventId: string;
}

type TicketType = 'NORMAL' | 'VIP' | 'ARTISTE' | 'STAFF';

const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  NORMAL: 'Normaux',
  VIP: 'VIP',
  ARTISTE: 'Artiste',
  STAFF: 'Staff',
};

export default function TicketCopy({ eventId }: TicketCopyProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCopy, setShowCopy] = useState(false);
  const [selectedSourceEvent, setSelectedSourceEvent] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<TicketType[]>(['VIP', 'STAFF']);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
      }
    };

    fetchEvents();
  }, []);

  const toggleType = (type: TicketType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleCopy = async () => {
    if (!selectedSourceEvent || selectedTypes.length === 0) return;

    setIsCopying(true);

    try {
      const response = await fetch('/api/tickets/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceEventId: selectedSourceEvent,
          targetEventId: eventId,
          ticketTypes: selectedTypes,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Copie réussie ! ${result.message}`);
        setShowCopy(false);
        setSelectedSourceEvent('');
      } else {
        alert(`Erreur lors de la copie : ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la copie des tickets:', error);
      alert('Erreur lors de la copie des tickets');
    } finally {
      setIsCopying(false);
    }
  };

  const otherEvents = events.filter(e => e.id !== eventId);

  if (otherEvents.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowCopy(!showCopy)}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        <Copy className="w-4 h-4" />
        Copier des tickets depuis un autre événement
      </button>

      {showCopy && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Copier des tickets vers cet événement
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            De nouveaux numéros de ticket sont générés automatiquement : un billet ne peut jamais
            être réutilisé tel quel sur un autre événement.
          </p>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Événement source :
            </label>
            <select
              value={selectedSourceEvent}
              onChange={(e) => setSelectedSourceEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choisir un événement&hellip;</option>
              {otherEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Types de tickets à copier :
            </span>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(TICKET_TYPE_LABELS) as TicketType[]).map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  {TICKET_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </div>

          {selectedSourceEvent && selectedTypes.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={isCopying}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isCopying ? 'Copie en cours...' : 'Copier les tickets'}
              </button>
              <button
                onClick={() => {
                  setShowCopy(false);
                  setSelectedSourceEvent('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
