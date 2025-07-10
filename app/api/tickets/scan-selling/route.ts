import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { ticketNumber } = await request.json();

    if (!ticketNumber) {
      return NextResponse.json(
        { error: 'Numéro de ticket requis' },
        { status: 400 }
      );
    }

    // Trouver le ticket
    const ticket = await prisma.ticket.findUnique({
      where: { number: ticketNumber },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le ticket n'est pas déjà vendu
    if (ticket.status === 'VENDU') {
      return NextResponse.json(
        { error: 'Ce ticket est déjà vendu' },
        { status: 400 }
      );
    }

    // Marquer le ticket comme vendu
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'VENDU',
        soldAt: new Date(),
      },
    });

    // Créer une entrée dans l'historique
    await prisma.scanHistory.create({
      data: {
        ticketId: ticket.id,
        action: 'ENTER', // ou 'SELL' si tu veux une action spéciale
      },
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: `Ticket ${ticketNumber} marqué comme vendu avec succès`,
    });

  } catch (error) {
    console.error('Erreur lors du scan-selling:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 