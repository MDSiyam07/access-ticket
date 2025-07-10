import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { ticketNumber, userId } = await request.json();

    if (!ticketNumber) {
      return NextResponse.json(
        { error: 'Numéro de ticket requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe et a le bon rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (user.role !== 'VENDEUR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
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
        scannedAt: new Date(),
      },
    });

    // Créer une entrée dans l'historique
    await prisma.scanHistory.create({
      data: {
        ticketId: ticket.id,
        action: 'ENTER', // On utilise ENTER pour indiquer que le ticket a été vendu
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