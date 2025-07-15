import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Nettoyer et supprimer un événement avec toutes ses données
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    
    console.log('POST /api/events/[eventId]/cleanup - ID:', eventId);
    
    if (!eventId) {
      return NextResponse.json(
        { error: "L'identifiant de l'événement est requis" },
        { status: 400 }
      );
    }

    // Vérifier s'il y a des tickets ou utilisateurs liés
    const [ticketCount, userCount] = await Promise.all([
      prisma.ticket.count({
        where: { eventId: eventId },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "EventUser"
        WHERE "eventId" = ${eventId}
      `,
    ]);

    const eventWithCounts = {
      id: eventId,
      _count: {
        tickets: ticketCount,
        users: Number(userCount[0].count),
      },
    };

    if (!eventWithCounts) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    console.log('Événement trouvé:', eventWithCounts);
    console.log('Nettoyage des données de l\'événement');
    
    // Supprimer d'abord l'historique de scan des tickets de cet événement
    const deletedScanHistory = await prisma.scanHistory.deleteMany({
      where: {
        ticket: {
          eventId: eventId
        }
      }
    });
    console.log('Historique de scan supprimé:', deletedScanHistory);

    // Supprimer tous les tickets de cet événement
    const deletedTickets = await prisma.ticket.deleteMany({
      where: { eventId: eventId }
    });
    console.log('Tickets supprimés:', deletedTickets);

    // Supprimer les liens EventUser (mais pas les utilisateurs eux-mêmes)
    await prisma.$executeRaw`
      DELETE FROM "EventUser"
      WHERE "eventId" = ${eventId}
    `;
    console.log('Liens EventUser supprimés');

    // Supprimer l'événement
    await prisma.event.delete({ where: { id: eventId } });
    console.log('Événement supprimé');
    
    return NextResponse.json({ 
      success: true,
      message: `Événement supprimé avec ${eventWithCounts._count.tickets} tickets et leur historique de scan`
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 