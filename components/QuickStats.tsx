'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface QuickStatsProps {
  type: 'entry' | 'exit';
  refreshTrigger?: number;
}

interface Stats {
  total: number;
  entered: number;
  exited: number;
  pending: number;
}

export default function QuickStats({ type, refreshTrigger }: QuickStatsProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    entered: 0,
    exited: 0,
    pending: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/tickets/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchStats();
    }
  }, [refreshTrigger, fetchStats]);

  if (type === 'entry') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card className="festival-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.entered}</div>
            <div className="text-sm text-gray-500">Entrées validées aujourd&apos;hui</div>
          </CardContent>
        </Card>
        <Card className="festival-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Billets en attente</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === 'exit') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card className="festival-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.exited}</div>
            <div className="text-sm text-gray-500">Sorties validées aujourd&apos;hui</div>
          </CardContent>
        </Card>
        <Card className="festival-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.entered - stats.exited}</div>
            <div className="text-sm text-gray-500">Personnes présentes</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
} 