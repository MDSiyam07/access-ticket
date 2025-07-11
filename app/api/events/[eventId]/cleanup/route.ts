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
    const eventWithCounts = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            tickets: true,
            users: true,
          },
        },
      },
    });

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

    // Supprimer l'événement
    await prisma.event.delete({ where: { id: eventId } });
    console.log('Événement supprimé');
    
    return NextResponse.json({ 
      success: true,
      message: `Événement supprimé avec ${eventWithCounts._count.tickets} tickets et leur historique de scan`
    });

  } catch (error) {
    console.error('Erreur lors du nettoyage de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 