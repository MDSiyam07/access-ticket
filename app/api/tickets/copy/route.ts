import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TicketType } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_TICKET_TYPES: TicketType[] = ['NORMAL', 'VIP', 'ARTISTE', 'STAFF'];

// Génère un numéro de ticket unique dérivé du numéro source, scopé à l'événement cible
async function generateUniqueNumber(baseNumber: string, targetEventId: string): Promise<string> {
  const suffix = targetEventId.slice(-4);
  let candidate = `${baseNumber}-${suffix}`;
  let attempt = 0;

  while (await prisma.ticket.findUnique({ where: { number: candidate } })) {
    attempt++;
    candidate = `${baseNumber}-${suffix}-${attempt}`;
  }

  return candidate;
}

// POST - Copier les tickets (VIP/STAFF/...) d'un événement vers un autre en générant de nouveaux numéros
export async function POST(request: NextRequest) {
  try {
    const { sourceEventId, targetEventId, ticketTypes } = await request.json();

    if (!sourceEventId || !targetEventId) {
      return NextResponse.json(
        { error: 'Les IDs des événements source et cible sont requis' },
        { status: 400 }
      );
    }

    if (sourceEventId === targetEventId) {
      return NextResponse.json(
        { error: 'L\'événement source et l\'événement cible doivent être différents' },
        { status: 400 }
      );
    }

    const types: TicketType[] = Array.isArray(ticketTypes) && ticketTypes.length > 0
      ? ticketTypes.filter((t: string): t is TicketType => VALID_TICKET_TYPES.includes(t as TicketType))
      : ['VIP', 'STAFF'];

    if (types.length === 0) {
      return NextResponse.json(
        { error: 'Aucun type de ticket valide sélectionné' },
        { status: 400 }
      );
    }

    const [sourceEvent, targetEvent] = await Promise.all([
      prisma.event.findUnique({ where: { id: sourceEventId } }),
      prisma.event.findUnique({ where: { id: targetEventId } }),
    ]);

    if (!sourceEvent || !targetEvent) {
      return NextResponse.json(
        { error: 'Un ou les deux événements n\'existent pas' },
        { status: 404 }
      );
    }

    const sourceTickets = await prisma.ticket.findMany({
      where: { eventId: sourceEventId, ticketType: { in: types } },
    });

    if (sourceTickets.length === 0) {
      return NextResponse.json(
        { error: 'Aucun ticket correspondant trouvé dans l\'événement source' },
        { status: 404 }
      );
    }

    let copied = 0;
    let skipped = 0;

    for (const ticket of sourceTickets) {
      try {
        const newNumber = await generateUniqueNumber(ticket.number, targetEventId);

        await prisma.ticket.create({
          data: {
            number: newNumber,
            eventId: targetEventId,
            ticketType: ticket.ticketType,
          },
        });

        copied++;
      } catch (error) {
        console.error(`Erreur lors de la copie du ticket ${ticket.number}:`, error);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${copied} ticket(s) copié(s) vers ${targetEvent.name}`,
      copied,
      skipped,
      totalSourceTickets: sourceTickets.length,
      eventName: targetEvent.name,
    });

  } catch (error) {
    console.error('Erreur lors de la copie des tickets:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
