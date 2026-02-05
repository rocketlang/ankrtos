import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@coralsastrology.com' },
    update: {},
    create: {
      email: 'admin@coralsastrology.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isPremium: true,
      sunSign: 'LEO',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Skip Tarot Cards for now (model not in main schema yet)
  console.log('⏭️  Skipping Tarot cards (not in schema yet)');

  /*
  // Seed Tarot Cards (Major Arcana)
  const majorArcana = [
    { number: 0, name: 'The Fool', keywords: ['beginnings', 'innocence', 'spontaneity', 'free spirit'] },
    { number: 1, name: 'The Magician', keywords: ['manifestation', 'resourcefulness', 'power', 'inspired action'] },
    { number: 2, name: 'The High Priestess', keywords: ['intuition', 'sacred knowledge', 'divine feminine', 'subconscious'] },
    { number: 3, name: 'The Empress', keywords: ['femininity', 'beauty', 'nature', 'nurturing', 'abundance'] },
    { number: 4, name: 'The Emperor', keywords: ['authority', 'structure', 'control', 'fatherhood'] },
    { number: 5, name: 'The Hierophant', keywords: ['spiritual wisdom', 'tradition', 'conformity', 'education'] },
    { number: 6, name: 'The Lovers', keywords: ['love', 'harmony', 'relationships', 'values alignment'] },
    { number: 7, name: 'The Chariot', keywords: ['control', 'willpower', 'success', 'determination'] },
    { number: 8, name: 'Strength', keywords: ['courage', 'persuasion', 'influence', 'compassion'] },
    { number: 9, name: 'The Hermit', keywords: ['soul searching', 'introspection', 'inner guidance'] },
    { number: 10, name: 'Wheel of Fortune', keywords: ['change', 'cycles', 'fate', 'destiny'] },
    { number: 11, name: 'Justice', keywords: ['fairness', 'truth', 'cause and effect', 'law'] },
    { number: 12, name: 'The Hanged Man', keywords: ['pause', 'surrender', 'letting go', 'new perspective'] },
    { number: 13, name: 'Death', keywords: ['endings', 'transformation', 'transition', 'rebirth'] },
    { number: 14, name: 'Temperance', keywords: ['balance', 'moderation', 'patience', 'purpose'] },
    { number: 15, name: 'The Devil', keywords: ['shadow self', 'attachment', 'addiction', 'restriction'] },
    { number: 16, name: 'The Tower', keywords: ['sudden change', 'upheaval', 'revelation', 'awakening'] },
    { number: 17, name: 'The Star', keywords: ['hope', 'faith', 'purpose', 'renewal', 'spirituality'] },
    { number: 18, name: 'The Moon', keywords: ['illusion', 'fear', 'anxiety', 'subconscious', 'intuition'] },
    { number: 19, name: 'The Sun', keywords: ['positivity', 'fun', 'warmth', 'success', 'vitality'] },
    { number: 20, name: 'Judgement', keywords: ['reflection', 'reckoning', 'inner calling', 'absolution'] },
    { number: 21, name: 'The World', keywords: ['completion', 'accomplishment', 'travel', 'fulfilment'] },
  ];

  for (const card of majorArcana) {
    await prisma.tarotCard.upsert({
      where: { name: card.name },
      update: {},
      create: {
        name: card.name,
        number: card.number,
        arcana: 'MAJOR',
        keywords: card.keywords,
        uprightMeaning: `${card.name} represents ${card.keywords.join(', ')}.`,
        reversedMeaning: `Reversed ${card.name} indicates blocked or excessive energy.`,
        imageUrl: `/tarot/major/${card.number}.jpg`,
        symbolism: `Traditional symbolism of ${card.name}`,
      },
    });
  }

  console.log('✅ Seeded 22 Major Arcana cards');
  */

  // Seed sample horoscope
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.horoscope.upsert({
    where: {
      zodiacSign_period_date: {
        zodiacSign: 'LEO',
        period: 'DAILY',
        date: today,
      },
    },
    update: {},
    create: {
      zodiacSign: 'LEO',
      period: 'DAILY',
      date: today,
      overview: 'Today brings positive energy and opportunities for growth.',
      love: 'Romance is in the air. Express your feelings openly.',
      career: 'A good day for professional advancement.',
      finance: 'Be cautious with spending but open to investments.',
      health: 'Focus on physical activity and healthy eating.',
      lucky: { color: 'Gold', number: 7, time: '2:00 PM' },
      loveRating: 4,
      careerRating: 5,
      financeRating: 3,
      healthRating: 4,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  console.log('✅ Seeded sample horoscope');

  // Seed main astrologer - Jyotish Acharya Rakesh Sharma (Founder & Chief Astrologer)
  const astrologerPassword = await bcrypt.hash('rakesh@2026', 10);
  const astrologer = await prisma.astrologer.upsert({
    where: { email: 'acharya.rakesh@coralsastrology.com' },
    update: {},
    create: {
      email: 'acharya.rakesh@coralsastrology.com',
      password: astrologerPassword,
      firstName: 'Rakesh',
      lastName: 'Sharma',
      displayName: 'Jyotish Acharya Rakesh Sharma',
      bio: 'Founder & Chief Astrologer of CoralsAstrology. Renowned Vedic astrologer with 25+ years of experience in Jyotish Shastra, Lal Kitab, and Prashna Kundali. Expert in combining traditional Vedic wisdom with modern AI-powered insights for accurate predictions and remedies. Guided thousands of clients worldwide on life, career, relationships, and spiritual growth.',
      specializations: ['Vedic Astrology', 'Lal Kitab', 'KP System', 'Prashna Kundali', 'Numerology', 'Vastu Shastra', 'Gemstone Consultation'],
      languages: ['Hindi', 'English', 'Sanskrit'],
      experience: 25,
      rating: 4.9,
      reviewCount: 1500,
      isAvailable: true,
      hourlyRate: 2499,
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  console.log('✅ Seeded Jyotish Acharya Rakesh Sharma (Founder):', astrologer.email);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
