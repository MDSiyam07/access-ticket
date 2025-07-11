'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Users, FileText, Edit, Trash2, Download } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    tickets: number;
    users: number;
  };
}

interface EventManagerProps {
  selectedEventId?: string;
  onEventSelect: (eventId: string) => void;
  redirectToEventPage?: boolean;
}

export default function EventManager({ selectedEventId, onEventSelect, redirectToEventPage = false }: EventManagerProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        
        // Sélectionner le premier événement si aucun n'est sélectionné
        if (!selectedEventId && data.length > 0) {
          onEventSelect(data[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents([newEvent, ...events]);
        setShowCreateForm(false);
        setFormData({ name: '', startDate: '', endDate: '' });
        
        // Sélectionner automatiquement le nouvel événement
        onEventSelect(newEvent.id);
      } else {
        const error = await response.json();
        console.error('Erreur lors de la création:', error);
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEvent) return;
    
    try {
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingEvent,
          ...editFormData,
        }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map(event => 
          event.id === editingEvent ? { ...event, ...updatedEvent } : event
        ));
        setEditingEvent(null);
        setEditFormData({ name: '', startDate: '', endDate: '', isActive: true });
      } else {
        const error = await response.json();
        console.error('Erreur lors de la modification:', error);
      }
    } catch (error) {
      console.error('Erreur lors de la modification de l\'événement:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Vérifier s'il y a des données associées
    const hasAssociatedData = (event._count?.tickets || 0) > 0 || (event._count?.users || 0) > 0;
    
    console.log('Événement à supprimer:', event);
    console.log('A des données associées:', hasAssociatedData);
    console.log('Nombre de tickets:', event._count?.tickets);
    console.log('Nombre d\'utilisateurs:', event._count?.users);
    
    if (hasAssociatedData) {
      const confirmDelete = confirm(
        `Cet événement contient ${event._count?.tickets || 0} tickets et ${event._count?.users || 0} utilisateurs.\n\n` +
        `Voulez-vous supprimer l'événement ET toutes ses données associées ?\n\n` +
        `⚠️ ATTENTION : Cette action supprimera définitivement tous les tickets et leur historique de scan.`
      );
      
      if (!confirmDelete) {
        console.log('Suppression annulée par l\'utilisateur');
        return;
      }
      
      console.log('Suppression complète confirmée - Utilisation de l\'endpoint cleanup');
      
      // Utiliser le nouvel endpoint de nettoyage
      try {
        const response = await fetch(`/api/events/${eventId}/cleanup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Status de la réponse cleanup:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Résultat du nettoyage:', result);
          
          setEvents(events.filter(event => event.id !== eventId));
          
          // Afficher un message de confirmation
          if (result.message) {
            alert(result.message);
          }
          
          // Si l'événement supprimé était sélectionné, sélectionner le premier disponible
          if (selectedEventId === eventId && events.length > 1) {
            const remainingEvents = events.filter(event => event.id !== eventId);
            if (remainingEvents.length > 0) {
              onEventSelect(remainingEvents[0].id);
            }
          }
        } else {
          let error;
          try {
            error = await response.json();
            console.error('Erreur lors du nettoyage:', error);
          } catch (parseError) {
            console.error('Impossible de parser la réponse JSON:', parseError);
            error = { error: 'Réponse invalide du serveur' };
          }
          
          alert(`Erreur lors du nettoyage : ${error.error || 'Erreur inconnue'}`);
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage de l\'événement:', error);
        alert('Erreur lors du nettoyage de l\'événement');
      }
    } else {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.')) {
        console.log('Suppression annulée par l\'utilisateur');
        return;
      }
      
      console.log('Suppression normale - Utilisation de l\'endpoint DELETE');
      
      // Utiliser l'endpoint DELETE normal
      try {
        const response = await fetch('/api/events', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: eventId }),
        });

        console.log('Status de la réponse DELETE:', response.status);

        if (response.ok) {
          setEvents(events.filter(event => event.id !== eventId));
          
          // Si l'événement supprimé était sélectionné, sélectionner le premier disponible
          if (selectedEventId === eventId && events.length > 1) {
            const remainingEvents = events.filter(event => event.id !== eventId);
            if (remainingEvents.length > 0) {
              onEventSelect(remainingEvents[0].id);
            }
          }
        } else {
          let error;
          try {
            error = await response.json();
            console.error('Erreur lors de la suppression:', error);
          } catch (parseError) {
            console.error('Impossible de parser la réponse JSON:', parseError);
            error = { error: 'Réponse invalide du serveur' };
          }
          
          if (error.details) {
            alert(`Impossible de supprimer cet événement : ${error.details}`);
          } else {
            alert(`Erreur lors de la suppression : ${error.error || 'Erreur inconnue'}`);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'événement:', error);
        alert('Erreur lors de la suppression de l\'événement');
      }
    }
  };

  const startEditEvent = (event: Event) => {
    setEditingEvent(event.id);
    setEditFormData({
      name: event.name,
      startDate: event.startDate ? event.startDate.slice(0, 10) : '',
      endDate: event.endDate ? event.endDate.slice(0, 10) : '',
      isActive: event.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setEditFormData({ name: '', startDate: '', endDate: '', isActive: true });
  };

  // const exportEventStats = async (eventId: string) => {
  //   try {
  //     const response = await fetch(`/api/events/${eventId}/export`);
  //     if (response.ok) {
  //       const blob = await response.blob();
  //       const url = window.URL.createObjectURL(blob);
  //       const a = document.createElement('a');
  //       a.href = url;
  //       a.download = `statistiques-evenement-${eventId}.csv`;
  //       document.body.appendChild(a);
  //       a.click();
  //       window.URL.revokeObjectURL(url);
  //       document.body.removeChild(a);
  //     }
  //   } catch (error) {
  //     console.error('Erreur lors de l\'export:', error);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des Événements</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel Événement
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un nouvel événement</h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;événement *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Créer l&apos;événement
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des événements */}
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className={`p-4 border rounded-lg transition-all ${
              selectedEventId === event.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {editingEvent === event.id ? (
              // Mode édition
              <form onSubmit={handleEditEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l&apos;événement *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`active-${event.id}`}
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`active-${event.id}`} className="text-sm font-medium text-gray-700">
                    Événement actif
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              // Mode affichage
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{event.name}</h3>
                      {event.isActive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Actif
                        </span>
                      )}
                      {selectedEventId === event.id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Sélectionné
                        </span>
                      )}
                    </div>

                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert('Fonctionnalité d\'export en cours de développement')}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Exporter les statistiques (bientôt disponible)"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEditEvent(event)}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                      title="Modifier l'événement"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Supprimer l'événement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{event._count?.tickets || 0} tickets</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{event._count?.users || 0} utilisateurs</span>
                  </div>
                  {event.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <button
                    onClick={() => {
                      if (redirectToEventPage) {
                        router.push(`/admin/events/${event.id}`);
                      } else {
                        onEventSelect(event.id);
                      }
                    }}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      selectedEventId === event.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedEventId === event.id ? 'Cliquer pour gérer cet événement' : redirectToEventPage ? 'Gérer cet événement' : 'Sélectionner cet événement'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun événement créé</p>
          <p className="text-sm">Créez votre premier événement pour commencer</p>
        </div>
      )}
    </div>
  );
} 