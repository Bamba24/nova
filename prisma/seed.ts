// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  // Créer un utilisateur admin
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Administrateur',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log('✅ Admin créé:', {
    email: admin.email,
    password: 'Admin123!',
  });

  // Créer un utilisateur de test
  const userPassword = await bcrypt.hash('User123!', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Utilisateur Test',
      password: userPassword,
      role: 'USER',
      emailVerified: true,
    },
  });

  console.log('✅ Utilisateur créé:', {
    email: user.email,
    password: 'User123!',
  });

  // Créer un planning de test
  const planning = await prisma.planning.create({
    data: {
      userId: user.id,
      name: 'Planning France - Février',
      country: 'FR',
      hours: ['10h', '13h', '16h', '19h'],
    },
  });


  // Créer quelques slots de test
  await prisma.slot.createMany({
    data: [
      {
        planningId: planning.id,
        city: 'Paris',
        postalCode: '75000',
        latitude: 48.8566,
        longitude: 2.3522,
        day: 'Lundi',
        date: new Date('2025-02-03'),
        hour: '10h',
        status: 'PLANNED',
      },
      {
        planningId: planning.id,
        city: 'Lyon',
        postalCode: '69000',
        latitude: 45.7640,
        longitude: 4.8357,
        day: 'Mardi',
        date: new Date('2025-02-04'),
        hour: '13h',
        status: 'PLANNED',
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });