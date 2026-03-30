import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample people
  const person1 = await prisma.person.create({
    data: {
      name: 'Ahmed Hassan',
      displayName: 'Ahmed',
      fatherName: 'Hassan Mohamed',
      phone: '+1234567890',
      homeTown: 'Cairo',
      notes: 'Family patriarch',
    },
  });

  const person2 = await prisma.person.create({
    data: {
      name: 'Fatima Hassan',
      displayName: 'Fatima',
      fatherName: 'Hassan Mohamed',
      phone: '+1234567891',
      homeTown: 'Alexandria',
      notes: 'Family matriarch',
    },
  });

  const person3 = await prisma.person.create({
    data: {
      name: 'Mohamed Ahmed',
      displayName: 'Mohamed',
      fatherName: 'Ahmed Hassan',
      phone: '+1234567892',
      homeTown: 'Giza',
    },
  });

  const person4 = await prisma.person.create({
    data: {
      name: 'Aisha Mohamed',
      displayName: 'Aisha',
      fatherName: 'Ahmed Hassan',
      phone: '+1234567893',
      homeTown: 'Cairo',
    },
  });

  console.log('✓ Created 4 sample people');

  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      title: 'Family Wedding',
      description: 'Mohamed and Aisha wedding celebration',
      eventDate: new Date('2024-06-15'),
      location: 'Cairo Convention Center',
      hostPersonId: person1.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Eid Celebration',
      description: 'Family gathering for Eid al-Fitr',
      eventDate: new Date('2024-04-10'),
      location: 'Home of Ahmed Hassan',
      hostPersonId: person1.id,
    },
  });

  console.log('✓ Created 2 sample events');

  // Create sample contributions - CASH contributions
  await prisma.contribution.create({
    data: {
      eventId: event1.id,
      fromPersonId: person2.id,
      toPersonId: person3.id,
      type: 'GAVE',
      mode: 'CASH',
      amount: new Decimal('500'),
      currencyCode: 'EGP',
      notes: 'Wedding gift - cash',
      contributionDate: new Date('2024-06-15'),
    },
  });

  await prisma.contribution.create({
    data: {
      eventId: event1.id,
      fromPersonId: person4.id,
      toPersonId: person3.id,
      type: 'GAVE',
      mode: 'CASH',
      amount: new Decimal('300'),
      currencyCode: 'EGP',
      notes: 'Wedding gift - cash',
      contributionDate: new Date('2024-06-15'),
    },
  });

  // Create sample contributions - GOLD contributions
  await prisma.contribution.create({
    data: {
      eventId: event1.id,
      fromPersonId: person1.id,
      toPersonId: person3.id,
      type: 'GAVE',
      mode: 'GOLD',
      itemQuantity: 25,
      notes: 'Gold gift - 25 grams',
      contributionDate: new Date('2024-06-15'),
    },
  });

  // Create sample contributions - SILVER contributions
  await prisma.contribution.create({
    data: {
      eventId: event1.id,
      fromPersonId: person2.id,
      toPersonId: person3.id,
      type: 'GAVE',
      mode: 'SILVER',
      itemQuantity: 100,
      notes: 'Silver gift - 100 grams',
      contributionDate: new Date('2024-06-15'),
    },
  });

  // Create sample contributions - ITEM contributions
  await prisma.contribution.create({
    data: {
      eventId: event1.id,
      fromPersonId: person4.id,
      toPersonId: person3.id,
      type: 'GAVE',
      mode: 'ITEM',
      itemType: 'Fine China Set',
      itemQuantity: 1,
      notes: 'Luxury dinnerware set',
      contributionDate: new Date('2024-06-15'),
    },
  });

  // Eid celebration contributions
  await prisma.contribution.create({
    data: {
      eventId: event2.id,
      fromPersonId: person1.id,
      toPersonId: person3.id,
      type: 'RECEIVED',
      mode: 'CASH',
      amount: new Decimal('200'),
      currencyCode: 'EGP',
      notes: 'Eid gift from father',
      contributionDate: new Date('2024-04-10'),
    },
  });

  await prisma.contribution.create({
    data: {
      eventId: event2.id,
      fromPersonId: person1.id,
      toPersonId: person4.id,
      type: 'RECEIVED',
      mode: 'CASH',
      amount: new Decimal('150'),
      currencyCode: 'EGP',
      notes: 'Eid gift from father',
      contributionDate: new Date('2024-04-10'),
    },
  });

  console.log('✓ Created sample contributions (CASH, GOLD, SILVER, ITEM)');
  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
