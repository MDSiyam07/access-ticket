'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
// import toast from 'react-hot-toast';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TicketData {
  number: string;
}

export default function TicketImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setTicketCount(0);

    try {
      const tickets = await readFile(file);
      
      if (tickets.length === 0) {
        return;
      }

      setTicketCount(tickets.length);
      setUploadProgress(50);

      // Envoyer les tickets à l'API
      const response = await fetch('/api/tickets/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tickets }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'import');
      }

      await response.json();
      setUploadProgress(100);

      // Import réussi

      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      // Erreur lors de l'import
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setTicketCount(0);
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

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-semibold text-gray-900">
                {isUploading ? 'Import en cours...' : 'Sélectionner un fichier'}
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                CSV ou Excel (xlsx, xls)
              </span>
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              ref={fileInputRef}
            />
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="space-y-4">
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Instructions d&apos;import
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Le fichier doit contenir une colonne nommée &quot;number&quot;, &quot;numero&quot; ou &quot;ticket&quot;</li>
          <li>• Seuls les numéros de ticket seront importés</li>
          <li>• Les tickets existants seront ignorés (pas de doublons)</li>
          <li>• Les nouveaux tickets auront le statut &quot;PENDING&quot;</li>
          <li>• Formats supportés : CSV, Excel (.xlsx, .xls)</li>
        </ul>
      </div>
    </div>
  );
} 