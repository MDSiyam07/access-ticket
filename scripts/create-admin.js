import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@festival.com' }
    });

    if (existingAdmin) {
      console.log('✅ Le compte administrateur existe déjà');
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Créer le compte administrateur
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@festival.com',
        password: hashedPassword,
        name: 'Administrateur',
        role: 'ADMIN'
      }
    });

    console.log('✅ Compte administrateur créé avec succès:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Nom: ${adminUser.name}`);
    console.log(`   Rôle: ${adminUser.role}`);
    console.log('   Mot de passe: admin123');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 