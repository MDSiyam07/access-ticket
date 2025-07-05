import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { tickets } = await request.json();

    if (!tickets || !Array.isArray(tickets)) {
      return NextResponse.json(
        { error: 'Données invalides. Un tableau de numéros de tickets est requis.' },
        { status: 400 }
      );
    }

    if (tickets.length === 0) {
      return NextResponse.json(
        { error: 'Aucun ticket à importer.' },
        { status: 400 }
      );
    }

    // Nettoyer et valider les numéros de tickets
    const cleanTickets = tickets
      .map((ticket: unknown) => String(ticket).trim())
      .filter((ticket: string) => ticket.length > 0);

    if (cleanTickets.length === 0) {
      return NextResponse.json(
        { error: 'Aucun numéro de ticket valide trouvé.' },
        { status: 400 }
      );
    }

    let imported = 0;
    let duplicates = 0;

    // Traiter chaque ticket individuellement
    for (const ticketNumber of cleanTickets) {
      try {
        // Vérifier si le ticket existe déjà
        const existingTicket = await prisma.ticket.findUnique({
          where: { number: ticketNumber },
          include: {
            scanHistory: {
              orderBy: { scannedAt: 'desc' },
              take: 1,
            },
          },
        });

        if (existingTicket) {
          // Ticket existe déjà
          duplicates++;
          continue;
        }

        // Créer le nouveau ticket avec statut PENDING
        await prisma.ticket.create({
          data: {
            number: ticketNumber,
            status: 'PENDING',
          },
        });

        imported++;
      } catch (error) {
        console.error(`Erreur lors de l'import du ticket ${ticketNumber}:`, error);
        // Continuer avec les autres tickets même en cas d'erreur sur un ticket
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      total: cleanTickets.length,
    });

  } catch (error) {
    console.error('Erreur lors de l\'import des tickets:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 