import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Création des données de test...');

    // Créer des événements de test
    const event1 = await prisma.event.create({
      data: {
        name: 'Festival d\'Été 2024',
        description: 'Le grand festival de l\'été avec tous les artistes',
        startDate: new Date('2024-07-15T18:00:00Z'),
        endDate: new Date('2024-07-15T23:00:00Z'),
        isActive: true,
      }
    });

    const event2 = await prisma.event.create({
      data: {
        name: 'Festival d\'Hiver 2025',
        description: 'Festival en préparation pour l\'hiver prochain',
        startDate: new Date('2025-01-20T19:00:00Z'),
        endDate: new Date('2025-01-20T00:00:00Z'),
        isActive: true,
      }
    });

    console.log('✅ Événements créés:');
    console.log(`   - ${event1.name} (${event1.id})`);
    console.log(`   - ${event2.name} (${event2.id})`);

    // Créer des utilisateurs de test
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        email: 'entry@festival.com',
        password: hashedPassword,
        name: 'Contrôleur Entrée',
        role: 'ENTRY',
        eventId: event1.id
      },
      {
        email: 'exit@festival.com',
        password: hashedPassword,
        name: 'Contrôleur Sortie',
        role: 'EXIT',
        eventId: event1.id
      },
      {
        email: 'vendeur@festival.com',
        password: hashedPassword,
        name: 'Vendeur Tickets',
        role: 'VENDEUR',
        eventId: event1.id
      },
      {
        email: 'reentry@festival.com',
        password: hashedPassword,
        name: 'Contrôleur Ré-entrée',
        role: 'REENTRY',
        eventId: event1.id
      }
    ];

    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData
      });
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    }

    console.log('\n🎉 Données de test créées avec succès !');
    console.log('\n📋 Comptes de test disponibles:');
    console.log('   • admin@festival.com / admin123 (ADMIN)');
    console.log('   • entry@festival.com / password123 (ENTRY)');
    console.log('   • exit@festival.com / password123 (EXIT)');
    console.log('   • vendeur@festival.com / password123 (VENDEUR)');
    console.log('   • reentry@festival.com / password123 (REENTRY)');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData(); 