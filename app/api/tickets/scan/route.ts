import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { ticketNumber, action, entryType = 'SCAN', userId } = await request.json();

    if (!ticketNumber || !action) {
      return NextResponse.json(
        { error: 'Numéro de ticket et action requis.' },
        { status: 400 }
      );
    }

    if (!['ENTER', 'EXIT', 'REENTER'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez ENTER, EXIT ou REENTER.' },
        { status: 400 }
      );
    }

    // Trouver le ticket
    const ticket = await prisma.ticket.findUnique({
      where: { number: ticketNumber },
      include: {
        scanHistory: {
          orderBy: { scannedAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé.' },
        { status: 404 }
      );
    }

    // Obtenir la dernière action (pour référence future si nécessaire)
    // const lastAction = ticket.scanHistory[0];

    // Logique de validation selon l'action
    if (action === 'ENTER') {
      if (ticket.status === 'ENTERED') {
        return NextResponse.json(
          { error: 'Ce ticket est déjà entré.' },
          { status: 400 }
        );
      }

      // N'autoriser l'entrée que si le ticket est en VENDU ou EXITED
      if (ticket.status !== 'VENDU' && ticket.status !== 'EXITED') {
        return NextResponse.json(
          { error: 'Ce ticket n\'a pas été vendu. Vente obligatoire avant l\'entrée.' },
          { status: 400 }
        );
      }

      // Permettre la première entrée ou la ré-entrée
      await prisma.$transaction([
        prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'ENTERED',
            scannedAt: new Date(),
            entryType: entryType as 'SCAN' | 'MANUAL',
          },
        }),
        prisma.scanHistory.create({
          data: {
            ticketId: ticket.id,
            eventId: ticket.eventId,
            action: 'ENTER', // On enregistre comme une entrée
            ...(userId ? { vendeurId: userId } : {}),
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Ticket validé pour entrée.',
        ticket: {
          number: ticket.number,
          status: 'ENTERED',
        },
      });

    } else if (action === 'EXIT') {
      // Vérifier si le ticket peut sortir
      if (ticket.status === 'EXITED') {
        return NextResponse.json(
          { error: 'Ce ticket est déjà sorti.' },
          { status: 400 }
        );
      }

      if (ticket.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Ce ticket n\'a pas encore été validé pour entrée.' },
          { status: 400 }
        );
      }

      if (ticket.status === 'VENDU') {
        return NextResponse.json(
          { error: 'Ce ticket vendu n\'a pas encore été validé pour entrée.' },
          { status: 400 }
        );
      }

      // Valider la sortie (pour les tickets ENTERED)
      await prisma.$transaction([
        prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'EXITED',
            scannedAt: new Date(),
          },
        }),
        prisma.scanHistory.create({
          data: {
            ticketId: ticket.id,
            eventId: ticket.eventId,
            action: 'EXIT',
            ...(userId ? { vendeurId: userId } : {}),
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Ticket validé pour sortie.',
        ticket: {
          number: ticket.number,
          status: 'EXITED',
        },
      });
    } else if (action === 'REENTER') {
      // Gestion spéciale pour la ré-entrée
      // 1. Vérifier qu'il y a au moins une action EXIT dans l'historique
      const hasExited = ticket.scanHistory.some((h) => h.action === 'EXIT');
      if (!hasExited) {
        return NextResponse.json(
          { error: "Ce ticket n'a jamais été sorti. Ré-entrée refusée." },
          { status: 400 }
        );
      }
      // 2. Refuser si le ticket est déjà entré
      if (ticket.status === 'ENTERED') {
        return NextResponse.json(
          { error: 'Ce ticket est déjà entré.' },
          { status: 400 }
        );
      }
      // 3. Valider la ré-entrée
      await prisma.$transaction([
        prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'ENTERED',
            scannedAt: new Date(),
            entryType: entryType as 'SCAN' | 'MANUAL',
          },
        }),
        prisma.scanHistory.create({
          data: {
            ticketId: ticket.id,
            eventId: ticket.eventId,
            action: 'ENTER', // On enregistre comme une entrée
            ...(userId ? { vendeurId: userId } : {}),
          },
        }),
      ]);
      // Récupérer l'historique mis à jour
      const updatedHistory = await prisma.scanHistory.findMany({
        where: { ticketId: ticket.id },
        orderBy: { scannedAt: 'desc' },
      });
      return NextResponse.json({
        success: true,
        message: 'Ticket validé pour ré-entrée.',
        ticket: {
          number: ticket.number,
          status: 'ENTERED',
        },
        ticketHistory: updatedHistory,
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erreur lors du scan du ticket:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 