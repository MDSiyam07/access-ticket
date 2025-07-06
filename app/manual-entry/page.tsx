'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, CheckCircle, AlertCircle } from 'lucide-react';
import ManualEntryRoute from '@/components/ManualEntryRoute';
import toast from 'react-hot-toast';

export default function ManualEntry() {
  const [ticketId, setTicketId] = useState('');
  const [scanType, setScanType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    ticketId: string;
    type: string;
    status: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId.trim() || !scanType) {
      toast.error('Veuillez remplir tous les champs', {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticketId.trim(),
          action: scanType === 'entry' ? 'ENTER' : 'EXIT',
          entryType: 'MANUAL'
        }),
      });

      const result = {
        ticketId: ticketId.trim(),
        type: scanType === 'entry' ? 'Entrée' : 'Sortie',
        status: response.ok ? 'success' as const : 'error' as const,
        message: ''
      };

      if (response.ok) {
        const data = await response.json();
        result.message = data.message || `${scanType === 'entry' ? 'Entrée' : 'Sortie'} validée avec succès`;
      } else {
        const error = await response.json();
        result.message = error.message || `Erreur lors de la validation ${scanType === 'entry' ? "de l'entrée" : 'de la sortie'}`;
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
        setScanType('');
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
      console.error('Erreur lors de la validation:', error);
      const result = {
        ticketId: ticketId.trim(),
        type: scanType === 'entry' ? 'Entrée' : 'Sortie',
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
    <ManualEntryRoute>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Saisie Manuelle
          </h1>
          <p className="text-gray-600">
            Validez manuellement les billets en cas de problème technique
          </p>
        </div>

        {/* Main form */}
        <Card className="festival-card bg-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit3 className="w-5 h-5 mr-2 text-festival-blue" />
              Validation manuelle de billet
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Type de validation
                </Label>
                <Select value={scanType} onValueChange={setScanType} disabled={isProcessing}>
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder="Sélectionnez le type de scan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        Validation d&apos;entrée
                      </div>
                    </SelectItem>
                    <SelectItem value="exit">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-orange-600 mr-2" />
                        Validation de sortie
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isProcessing || !ticketId.trim() || !scanType}
                className="w-full h-14 text-lg font-semibold bg-festival-blue hover:bg-festival-blue-dark text-white rounded-2xl"
              >
                {isProcessing ? 'Validation en cours...' : 'Valider le billet'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Last result display */}
        {lastResult && (
          <Card className={`festival-card ${lastResult.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                {lastResult.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {lastResult.type} - {lastResult.ticketId}
                  </h3>
                  <p className={`text-sm ${lastResult.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {lastResult.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ManualEntryRoute>
  );
}