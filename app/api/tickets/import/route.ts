import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { tickets, eventId, ticketType = 'NORMAL' } = await request.json();

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Liste de tickets requise' },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'ID de l\'événement requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    let imported = 0;
    let duplicates = 0;

    for (const ticketNumber of tickets) {
      try {
        // Vérifier si le ticket existe déjà
        const existingTicket = await prisma.ticket.findUnique({
          where: { number: ticketNumber },
        });

        if (existingTicket) {
          duplicates++;
          continue;
        }

        // Créer le nouveau ticket avec le type spécifié
        await prisma.ticket.create({
          data: {
            number: ticketNumber,
            eventId: eventId,
            ticketType: ticketType, // Utiliser le type spécifié
          },
        });

        imported++;
      } catch (error) {
        console.error(`Erreur lors de l'import du ticket ${ticketNumber}:`, error);
        duplicates++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      eventName: event.name,
    });

  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 