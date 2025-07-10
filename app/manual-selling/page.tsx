'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function ManualSelling() {
  const { user } = useAuth();
  const [ticketId, setTicketId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    ticketId: string;
    status: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId.trim()) {
      toast.error('Veuillez saisir un numéro de ticket', {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/tickets/scan-selling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticketId.trim(),
          userId: user?.id,
        }),
      });

      const result = {
        ticketId: ticketId.trim(),
        status: response.ok ? 'success' as const : 'error' as const,
        message: ''
      };

      if (response.ok) {
        const data = await response.json();
        result.message = data.message || 'Ticket marqué comme vendu avec succès';
      } else {
        const error = await response.json();
        result.message = error.error || 'Erreur lors de la vente';
      }

      setLastResult(result);
      setIsProcessing(false);

      if (result.status === 'success') {
        toast.success(result.message, {
          duration: 4000,
          icon: '✅',
          style: {
            background: '#10b981',
            color: 'white',
          },
        });
        setTicketId('');
      } else {
        toast.error(result.message, {
          duration: 4000,
          icon: '❌',
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vente:', error);
      const result = {
        ticketId: ticketId.trim(),
        status: 'error' as const,
        message: 'Erreur de connexion au serveur'
      };
      setLastResult(result);
      setIsProcessing(false);
      toast.error('Erreur de connexion au serveur', {
        duration: 4000,
        icon: '❌',
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    }
  };

  const quickFillTicket = (prefix: string) => {
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setTicketId(`${prefix}${randomNum}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicketId(e.target.value.toUpperCase());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Saisie Manuelle - Vente
        </h1>
        <p className="text-gray-600">
          Marquez manuellement les tickets comme vendus
        </p>
      </div>

      {/* Main form */}
      <Card className="festival-card bg-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-orange-600" />
            Vente manuelle de ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ticketId" className="text-sm font-medium text-gray-700">
                Numéro de billet
              </Label>
              <Input
                id="ticketId"
                type="text"
                placeholder="ex: TK1234, VIP5678, STD9012"
                value={ticketId}
                onChange={handleInputChange}
                className="h-14 text-lg font-mono text-center"
                disabled={isProcessing}
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickFillTicket('TK')}
                  disabled={isProcessing}
                >
                  Billet Standard (TK)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickFillTicket('VIP')}
                  disabled={isProcessing}
                >
                  Billet VIP
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickFillTicket('STF')}
                  disabled={isProcessing}
                >
                  Staff
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!ticketId.trim() || isProcessing}
              className="w-full h-14 text-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-2xl"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Traitement...
                </div>
              ) : (
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Marquer comme vendu
                </div>
              )}
            </Button>
          </form>

          {/* Last result */}
          {lastResult && (
            <div className={`mt-6 p-4 rounded-lg border ${
              lastResult.status === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                {lastResult.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <div>
                  <p className={`font-medium ${
                    lastResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {lastResult.status === 'success' ? 'Succès' : 'Erreur'}
                  </p>
                  <p className={`text-sm ${
                    lastResult.status === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Ticket: {lastResult.ticketId}
                  </p>
                  <p className={`text-sm ${
                    lastResult.status === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {lastResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="festival-card bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 text-lg">
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-700">
            <p>• Saisissez le numéro exact du ticket à vendre</p>
            <p>• Utilisez les boutons de remplissage rapide pour tester</p>
            <p>• Le ticket sera marqué comme vendu et pourra être utilisé pour l&apos;entrée</p>
            <p>• Seuls les tickets non vendus peuvent être marqués comme vendus</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 