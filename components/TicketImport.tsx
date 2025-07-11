'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Users, Crown, Music, UserCheck } from 'lucide-react';
// import toast from 'react-hot-toast';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TicketData {
  number: string;
}

interface TicketImportProps {
  eventId?: string;
}

type TicketType = 'NORMAL' | 'VIP' | 'ARTISTE' | 'STAFF';

interface ImportState {
  isUploading: boolean;
  uploadProgress: number;
  ticketCount: number;
}

export default function TicketImport({ eventId }: TicketImportProps) {
  const [importStates, setImportStates] = useState<Record<TicketType, ImportState>>({
    NORMAL: { isUploading: false, uploadProgress: 0, ticketCount: 0 },
    VIP: { isUploading: false, uploadProgress: 0, ticketCount: 0 },
    ARTISTE: { isUploading: false, uploadProgress: 0, ticketCount: 0 },
    STAFF: { isUploading: false, uploadProgress: 0, ticketCount: 0 },
  });

  const fileInputRefs = {
    NORMAL: useRef<HTMLInputElement>(null),
    VIP: useRef<HTMLInputElement>(null),
    ARTISTE: useRef<HTMLInputElement>(null),
    STAFF: useRef<HTMLInputElement>(null),
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, ticketType: TicketType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!eventId) {
      alert('Veuillez sélectionner un événement avant d\'importer des tickets.');
      return;
    }

    setImportStates(prev => ({
      ...prev,
      [ticketType]: { ...prev[ticketType], isUploading: true, uploadProgress: 0, ticketCount: 0 }
    }));

    try {
      const tickets = await readFile(file);
      
      if (tickets.length === 0) {
        return;
      }

      setImportStates(prev => ({
        ...prev,
        [ticketType]: { ...prev[ticketType], ticketCount: tickets.length, uploadProgress: 50 }
      }));

      // Envoyer les tickets à l'API avec l'eventId et le type
      const response = await fetch('/api/tickets/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tickets, eventId, ticketType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'import');
      }

      await response.json();
      setImportStates(prev => ({
        ...prev,
        [ticketType]: { ...prev[ticketType], uploadProgress: 100 }
      }));

      // Import réussi

      // Reset form
      if (fileInputRefs[ticketType].current) {
        fileInputRefs[ticketType].current.value = '';
      }

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      // Erreur lors de l'import
    } finally {
      setImportStates(prev => ({
        ...prev,
        [ticketType]: { isUploading: false, uploadProgress: 0, ticketCount: 0 }
      }));
    }
  };

  const readFile = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.toLowerCase().split('.').pop();

      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const tickets = extractTicketNumbers(results.data);
              resolve(tickets);
            } catch (error) {
              reject(error);
            }
          },
          error: (error) => {
            reject(new Error(`Erreur lors de la lecture du CSV: ${error.message}`));
          },
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            const tickets = extractTicketNumbers(jsonData);
            resolve(tickets);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            reject(new Error(`Erreur lors de la lecture du fichier Excel: ${errorMessage}`));
          }
        };
        reader.onerror = () => {
          reject(new Error('Erreur lors de la lecture du fichier'));
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Format de fichier non supporté. Utilisez CSV ou Excel.'));
      }
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractTicketNumbers = (data: unknown[]): string[] => {
    const tickets: string[] = [];
    
    for (const row of data) {
      if (typeof row === 'object' && row !== null) {
        // Chercher la colonne 'number' (insensible à la casse)
        const numberKey = Object.keys(row as Record<string, unknown>).find(key => 
          key.toLowerCase() === 'number' || 
          key.toLowerCase() === 'numero' ||
          key.toLowerCase() === 'ticket'
        );

        if (numberKey && (row as Record<string, unknown>)[numberKey]) {
          const ticketNumber = String((row as Record<string, unknown>)[numberKey]).trim();
          if (ticketNumber && ticketNumber !== '') {
            tickets.push(ticketNumber);
          }
        }
      }
    }

    return tickets;
  };

  const renderImportSection = (ticketType: TicketType, title: string, icon: React.ReactNode, color: string) => {
    const state = importStates[ticketType];
    const isUploading = state.isUploading;
    const uploadProgress = state.uploadProgress;
    const ticketCount = state.ticketCount;

    return (
      <div key={ticketType} className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Import de tickets {title.toLowerCase()}</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <div>
              <label htmlFor={`file-upload-${ticketType}`} className="cursor-pointer">
                <span className="mt-2 block text-sm font-semibold text-gray-900">
                  {isUploading ? 'Import en cours...' : 'Sélectionner un fichier'}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  CSV ou Excel (xlsx, xls)
                </span>
              </label>
              <input
                id={`file-upload-${ticketType}`}
                name={`file-upload-${ticketType}`}
                type="file"
                className="sr-only"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, ticketType)}
                disabled={isUploading}
                ref={fileInputRefs[ticketType]}
              />
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="space-y-4 mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              {uploadProgress < 50 ? 'Lecture du fichier...' : 'Import des tickets...'}
            </p>
            {ticketCount > 0 && (
              <p className="text-sm text-gray-600 text-center">
                {ticketCount} tickets trouvés
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!eventId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Veuillez sélectionner un événement pour importer des tickets
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderImportSection(
          'NORMAL',
          'Billets Normaux',
          <Users className="w-5 h-5 text-white" />,
          'bg-blue-500'
        )}
        {renderImportSection(
          'VIP',
          'Billets VIP',
          <Crown className="w-5 h-5 text-white" />,
          'bg-yellow-500'
        )}
        {renderImportSection(
          'ARTISTE',
          'Billets Artiste',
          <Music className="w-5 h-5 text-white" />,
          'bg-purple-500'
        )}
        {renderImportSection(
          'STAFF',
          'Billets Staff',
          <UserCheck className="w-5 h-5 text-white" />,
          'bg-green-500'
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Instructions d&apos;import
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Le fichier doit contenir une colonne nommée &quot;number&quot;, &quot;numero&quot; ou &quot;ticket&quot;</li>
          <li>• Seuls les numéros de ticket seront importés</li>
          <li>• Les tickets existants seront ignorés (pas de doublons)</li>
          <li>• Formats supportés : CSV, Excel (.xlsx, .xls)</li>
          <li>• Chaque type de billet a sa propre section d&apos;import</li>
        </ul>
      </div>
    </div>
  );
} 