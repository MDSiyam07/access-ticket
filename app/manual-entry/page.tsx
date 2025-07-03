'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, CheckCircle, AlertCircle } from 'lucide-react';
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

    // Simulate processing
    setTimeout(() => {
      const random = Math.random();
      const success = random > 0.2; // 80% success rate

      const result = {
        ticketId: ticketId.trim(),
        type: scanType === 'entry' ? 'Entrée' : 'Sortie',
        status: success ? 'success' as const : 'error' as const,
        message: success 
          ? `${scanType === 'entry' ? 'Entrée' : 'Sortie'} validée avec succès`
          : `Erreur lors de la validation ${scanType === 'entry' ? "de l'entrée" : 'de la sortie'}`
      };

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
    }, 1500);
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
          Saisie Manuelle
        </h1>
        <p className="text-gray-600">
          Validez manuellement les billets en cas de problème technique
        </p>
      </div>

      {/* Main form */}
      <Card className="festival-card">
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
                      <CheckCircle className="w-4 h-4 text-orange-600 mr-2" />
                      Validation de sortie
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isProcessing || !ticketId.trim() || !scanType}
              className="w-full h-14 text-lg festival-button"
            >
              {isProcessing ? 'Validation en cours...' : 'Valider le billet'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Last result */}
      {lastResult && (
        <Card className={`festival-card border-l-4 ${
          lastResult.status === 'success' 
            ? 'border-l-green-500 bg-green-50' 
            : 'border-l-red-500 bg-red-50'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center">
              {lastResult.status === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              )}
              <div>
                <h3 className={`font-medium ${
                  lastResult.status === 'success' ? 'text-green-900' : 'text-red-900'
                }`}>
                  Dernière validation
                </h3>
                <p className={`text-sm ${
                  lastResult.status === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  Billet {lastResult.ticketId} - {lastResult.type}: {lastResult.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="festival-card bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-medium text-blue-900 mb-3">Instructions d&apos;utilisation</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Utilisez cette fonction uniquement en cas de problème technique avec les scanners</li>
            <li>• Vérifiez toujours l&apos;authenticité du billet avant validation</li>
            <li>• Les validations manuelles sont tracées et auditées</li>
            <li>• En cas de doute, contactez un superviseur</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}