import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Récupérer l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les statistiques de l'événement
    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      include: {
        scanHistory: {
          orderBy: { scannedAt: 'asc' }
        }
      }
    });

    // Calculer les statistiques
    const totalTickets = tickets.length;
    const enteredTickets = tickets.filter(t => t.status === 'ENTERED').length;
    const exitedTickets = tickets.filter(t => t.status === 'EXITED').length;
    const soldTickets = tickets.filter(t => t.status === 'VENDU').length;
    const pendingTickets = tickets.filter(t => t.status === 'PENDING').length;

    // Créer le contenu CSV
    const csvContent = [
      // En-têtes
      ['Statistiques de l\'événement', event.name],
      ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
      [''],
      ['Statistiques générales'],
      ['Total des tickets', totalTickets],
      ['Tickets scannés (entrées)', enteredTickets],
      ['Tickets scannés (sorties)', exitedTickets],
      ['Tickets vendus', soldTickets],
      ['Tickets en attente', pendingTickets],
      ['Taux de scan', totalTickets > 0 ? `${((enteredTickets / totalTickets) * 100).toFixed(2)}%` : '0%']
    ];

    // Convertir en CSV
    const csv = csvContent.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Retourner le fichier CSV
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="statistiques-${event.name}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 