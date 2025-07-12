'use client';

import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminRoute from '../../../../../components/AdminRoute';
import { Shield, ArrowLeft, Users, UserPlus, UserCheck, UserX, Plus, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../../../../components/LoadingSpinner';

interface Event {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  eventId?: string;
}

// roleIcons removed as it's not used

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800',
  ENTRY: 'bg-green-100 text-green-800',
  EXIT: 'bg-orange-100 text-orange-800',
  REENTRY: 'bg-blue-100 text-blue-800',
  VENDEUR: 'bg-purple-100 text-purple-800',
};

const roleLabels = {
  ADMIN: 'Administrateur',
  ENTRY: 'Contrôleur Entrées',
  EXIT: 'Contrôleur Sorties',
  REENTRY: 'Contrôleur Ré-entrées',
  VENDEUR: 'Vendeur',
};

export default function EventUsersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  // const { eventId } = useParams();
  
  const params = useParams();
  const eventId = params.eventId;
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ENTRY'
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const events = await response.json();
          const currentEvent = events.find((e: Event) => e.id === eventId);
          if (currentEvent) {
            setEvent(currentEvent);
          } else {
            router.push('/admin');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'événement:', error);
        router.push('/admin');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    if (isAuthenticated) {
      fetchEvent();
    }
  }, [eventId, isAuthenticated, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/users?eventId=${eventId}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (isAuthenticated && eventId) {
      fetchUsers();
    }
  }, [isAuthenticated, eventId]);

  if (isLoading || isLoadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" text="Chargement..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Événement non trouvé</h2>
          <p className="text-gray-600 mb-4">L&apos;événement demandé n&apos;existe pas.</p>
          <button
            onClick={() => router.push('/admin')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour à l&apos;administration
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Header avec navigation */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.push(`/admin/events/${event.id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la gestion de l&apos;événement
              </button>
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Mode Administrateur
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des utilisateurs pour : {event.name}
            </h1>
            <p className="text-gray-600">
              Connecté en tant que {user?.name} ({user?.email}) - Gestion des utilisateurs pour cet événement
            </p>
            {event.startDate && (
              <p className="text-sm text-gray-500 mt-1">
                Date : {new Date(event.startDate).toLocaleDateString()}
                {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
              </p>
            )}
          </div>

          {/* Statistiques des utilisateurs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Total Utilisateurs</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Administrateurs</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {users.filter(u => u.role === 'ADMIN').length}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Utilisateurs</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {users.filter(u => u.role === 'USER').length}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <UserX className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Vendeurs</h3>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {users.filter(u => u.role === 'VENDEUR').length}
              </p>
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Liste des utilisateurs pour : {event.name}
                </h2>
                <p className="text-gray-600">
                  Gérez les accès et permissions des utilisateurs pour cet événement.
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvel Utilisateur
              </button>
            </div>

            {/* Formulaire de création */}
            {showCreateForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
                </h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const url = editingUser 
                      ? `/api/users/${editingUser.id}`
                      : '/api/users';
                    
                    const method = editingUser ? 'PUT' : 'POST';
                    
                    const body = editingUser 
                      ? { ...formData } // Pour la modification, pas besoin d'eventId
                      : { ...formData, eventId: eventId }; // Pour la création
                    

                    
                    const response = await fetch(url, {
                      method,
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(body),
                    });

                    if (response.ok) {
                      const result = await response.json();
                      const newUser = result.user; // L'API retourne { success: true, user: newUser, message: '...' }
                      
                      if (editingUser) {
                        // Modification
                        setUsers(users.map(u => u.id === editingUser.id ? newUser : u));
                        setEditingUser(null);
                      } else {
                        // Création - vérifier que l'utilisateur a un ID
                        if (newUser && newUser.id) {
                          // Vérifier que l'utilisateur n'existe pas déjà dans la liste
                          const userExists = users.some(u => u.id === newUser.id);
                          if (!userExists) {
                            setUsers([newUser, ...users]);
                          } else {
                            console.log('Utilisateur déjà présent dans la liste');
                          }
                        } else {
                          console.error('Utilisateur créé sans ID:', newUser);
                          // Recharger la liste complète en cas de problème
                          const response = await fetch(`/api/users?eventId=${eventId}`);
                          if (response.ok) {
                            const data = await response.json();
                            setUsers(data);
                          }
                        }
                      }
                      
                      setShowCreateForm(false);
                      setFormData({ name: '', email: '', password: '', role: 'ENTRY' });
                      alert(editingUser ? 'Utilisateur modifié avec succès !' : 'Utilisateur créé avec succès !');
                    } else {
                      const error = await response.json();
                      alert(`Erreur lors de la création : ${error.error}`);
                    }
                  } catch (error) {
                    console.error('Erreur lors de la création de l\'utilisateur:', error);
                    alert('Erreur lors de la création de l\'utilisateur');
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet *
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
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe *
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle *
                      </label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="ENTRY">Contrôleur Entrées</option>
                        <option value="EXIT">Contrôleur Sorties</option>
                        <option value="REENTRY">Contrôleur Ré-entrées</option>
                        <option value="VENDEUR">Vendeur</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                                          <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {editingUser ? 'Modifier l\'utilisateur' : 'Créer l\'utilisateur'}
                      </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingUser(null);
                        setFormData({ name: '', email: '', password: '', role: 'ENTRY' });
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" text="Chargement des utilisateurs..." />
              </div>
            ) : (
              <div className="space-y-4">
                {users.filter(user => user && user.id).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Créé le {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          roleColors[user.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                        </span>
                        <button 
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          onClick={() => {
                            setEditingUser(user);
                            setFormData({
                              name: user.name,
                              email: user.email,
                              password: '',
                              role: user.role
                            });
                            setShowCreateForm(true);
                          }}
                        >
                          Modifier
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer l'utilisateur"
                          onClick={async () => {
                            if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
                            try {
                              const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
                              if (response.ok) {
                                setUsers(users.filter(u => u.id !== user.id));
                              } else {
                                const error = await response.json();
                                alert(error.error || 'Erreur lors de la suppression');
                              }
                            } catch {
                              alert('Erreur lors de la suppression');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
} 