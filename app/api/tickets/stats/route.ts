import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Compter les tickets par statut
    const [total, pending, entered, exited] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'PENDING' } }),
      prisma.ticket.count({ where: { status: 'ENTERED' } }),
      prisma.ticket.count({ where: { status: 'EXITED' } }),
    ]);

    return NextResponse.json({
      total,
      pending,
      entered,
      exited,
      imported: total, // Pour compatibilité avec l'interface
      duplicates: 0, // Cette valeur n'est pas disponible dans les stats générales
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 