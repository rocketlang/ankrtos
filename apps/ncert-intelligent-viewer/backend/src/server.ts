import Fastify from 'fastify';
import cors from '@fastify/cors';
import { promises as fs } from 'fs';
import path from 'path';
import { FermiGenerator } from './services/fermi-generator.js';
import { SocraticTutor } from './services/socratic-tutor.js';
import { LogicGenerator } from './services/logic-generator.js';
import { Translator } from './services/translator.js';

const fastify = Fastify({
  logger: {
    level: 'info',
  },
});

// Enable CORS
await fastify.register(cors, {
  origin: ['http://localhost:5174', 'https://ankr.in', 'http://ankr.in'],
  credentials: true,
});

// Initialize AI services
const fermiGenerator = new FermiGenerator();
const socraticTutor = new SocraticTutor();
const logicGenerator = new LogicGenerator();
const translator = new Translator();

interface NCERTBook {
  id: string;
  class: number;
  subject: string;
  title: string;
  language: string;
  chapterCount: number;
  thumbnail?: string;
}

interface NCERTChapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  content: string;
  metadata?: {
    readingTime?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
    exercises?: number;
  };
}

// Complete NCERT Book Catalog (Classes 1-12)
const MOCK_BOOKS: NCERTBook[] = [
  // Class 1
  { id: 'class1-math', class: 1, subject: 'Mathematics', title: 'Math-Magic', language: 'en', chapterCount: 13 },
  { id: 'class1-english', class: 1, subject: 'English', title: 'Marigold', language: 'en', chapterCount: 10 },
  { id: 'class1-hindi', class: 1, subject: 'Hindi', title: 'रिमझिम', language: 'hi', chapterCount: 12 },

  // Class 2
  { id: 'class2-math', class: 2, subject: 'Mathematics', title: 'Math-Magic', language: 'en', chapterCount: 15 },
  { id: 'class2-english', class: 2, subject: 'English', title: 'Marigold', language: 'en', chapterCount: 10 },
  { id: 'class2-hindi', class: 2, subject: 'Hindi', title: 'रिमझिम', language: 'hi', chapterCount: 14 },

  // Class 3
  { id: 'class3-math', class: 3, subject: 'Mathematics', title: 'Math-Magic', language: 'en', chapterCount: 14 },
  { id: 'class3-english', class: 3, subject: 'English', title: 'Marigold', language: 'en', chapterCount: 10 },
  { id: 'class3-hindi', class: 3, subject: 'Hindi', title: 'रिमझिम', language: 'hi', chapterCount: 14 },
  { id: 'class3-evs', class: 3, subject: 'EVS', title: 'Looking Around', language: 'en', chapterCount: 24 },

  // Class 4
  { id: 'class4-math', class: 4, subject: 'Mathematics', title: 'Math-Magic', language: 'en', chapterCount: 14 },
  { id: 'class4-english', class: 4, subject: 'English', title: 'Marigold', language: 'en', chapterCount: 10 },
  { id: 'class4-hindi', class: 4, subject: 'Hindi', title: 'रिमझिम', language: 'hi', chapterCount: 14 },
  { id: 'class4-evs', class: 4, subject: 'EVS', title: 'Looking Around', language: 'en', chapterCount: 27 },

  // Class 5
  { id: 'class5-math', class: 5, subject: 'Mathematics', title: 'Math-Magic', language: 'en', chapterCount: 14 },
  { id: 'class5-english', class: 5, subject: 'English', title: 'Marigold', language: 'en', chapterCount: 10 },
  { id: 'class5-hindi', class: 5, subject: 'Hindi', title: 'रिमझिम', language: 'hi', chapterCount: 18 },
  { id: 'class5-evs', class: 5, subject: 'EVS', title: 'Looking Around', language: 'en', chapterCount: 22 },

  // Class 6
  { id: 'class6-science', class: 6, subject: 'Science', title: 'Science', language: 'en', chapterCount: 16 },
  { id: 'class6-math', class: 6, subject: 'Mathematics', title: 'Mathematics', language: 'en', chapterCount: 14 },
  { id: 'class6-social', class: 6, subject: 'Social Science', title: 'Social Science', language: 'en', chapterCount: 28 },
  { id: 'class6-english', class: 6, subject: 'English', title: 'Honeysuckle', language: 'en', chapterCount: 10 },
  { id: 'class6-english-reader', class: 6, subject: 'English', title: 'A Pact with the Sun (Supplementary Reader)', language: 'en', chapterCount: 10 },
  { id: 'class6-hindi', class: 6, subject: 'Hindi', title: 'वसंत', language: 'hi', chapterCount: 17 },
  { id: 'class6-sanskrit', class: 6, subject: 'Sanskrit', title: 'रुचिरा भाग १ (Ruchira Part 1)', language: 'sa', chapterCount: 15 },

  // Class 7
  { id: 'class7-science', class: 7, subject: 'Science', title: 'Science', language: 'en', chapterCount: 18 },
  { id: 'class7-math', class: 7, subject: 'Mathematics', title: 'Mathematics', language: 'en', chapterCount: 15 },
  { id: 'class7-social', class: 7, subject: 'Social Science', title: 'Social Science', language: 'en', chapterCount: 30 },
  { id: 'class7-english', class: 7, subject: 'English', title: 'Honeycomb', language: 'en', chapterCount: 10 },
  { id: 'class7-english-reader', class: 7, subject: 'English', title: 'An Alien Hand (Supplementary Reader)', language: 'en', chapterCount: 10 },
  { id: 'class7-hindi', class: 7, subject: 'Hindi', title: 'वसंत', language: 'hi', chapterCount: 20 },
  { id: 'class7-sanskrit', class: 7, subject: 'Sanskrit', title: 'रुचिरा भाग २ (Ruchira Part 2)', language: 'sa', chapterCount: 15 },

  // Class 8
  { id: 'class8-science', class: 8, subject: 'Science', title: 'Science', language: 'en', chapterCount: 18 },
  { id: 'class8-math', class: 8, subject: 'Mathematics', title: 'Mathematics', language: 'en', chapterCount: 16 },
  { id: 'class8-social', class: 8, subject: 'Social Science', title: 'Social Science', language: 'en', chapterCount: 30 },
  { id: 'class8-english', class: 8, subject: 'English', title: 'Honeydew', language: 'en', chapterCount: 10 },
  { id: 'class8-english-reader', class: 8, subject: 'English', title: 'It So Happened (Supplementary Reader)', language: 'en', chapterCount: 10 },
  { id: 'class8-hindi', class: 8, subject: 'Hindi', title: 'वसंत', language: 'hi', chapterCount: 18 },
  { id: 'class8-sanskrit', class: 8, subject: 'Sanskrit', title: 'रुचिरा भाग ३ (Ruchira Part 3)', language: 'sa', chapterCount: 15 },

  // Class 9
  { id: 'class9-science', class: 9, subject: 'Science', title: 'Science', language: 'en', chapterCount: 15 },
  { id: 'class9-math', class: 9, subject: 'Mathematics', title: 'Mathematics', language: 'en', chapterCount: 15 },
  { id: 'class9-social', class: 9, subject: 'Social Science', title: 'Social Science', language: 'en', chapterCount: 28 },
  { id: 'class9-english', class: 9, subject: 'English', title: 'Beehive', language: 'en', chapterCount: 11 },
  { id: 'class9-english-reader', class: 9, subject: 'English', title: 'Moments (Supplementary Reader)', language: 'en', chapterCount: 10 },
  { id: 'class9-hindi', class: 9, subject: 'Hindi', title: 'क्षितिज', language: 'hi', chapterCount: 17 },
  { id: 'class9-sanskrit', class: 9, subject: 'Sanskrit', title: 'शेमुषी भाग १ (Shemushi Part 1)', language: 'sa', chapterCount: 12 },
  { id: 'class9-it', class: 9, subject: 'Information Technology', title: 'Information Technology', language: 'en', chapterCount: 10 },

  // Class 10
  { id: 'class10-science', class: 10, subject: 'Science', title: 'Science', language: 'en', chapterCount: 16 },
  { id: 'class10-math', class: 10, subject: 'Mathematics', title: 'Mathematics', language: 'en', chapterCount: 15 },
  { id: 'class10-social', class: 10, subject: 'Social Science', title: 'Social Science', language: 'en', chapterCount: 24 },
  { id: 'class10-english', class: 10, subject: 'English', title: 'First Flight', language: 'en', chapterCount: 11 },
  { id: 'class10-english-reader', class: 10, subject: 'English', title: 'Footprints Without Feet (Supplementary Reader)', language: 'en', chapterCount: 10 },
  { id: 'class10-hindi', class: 10, subject: 'Hindi', title: 'क्षितिज', language: 'hi', chapterCount: 17 },
  { id: 'class10-sanskrit', class: 10, subject: 'Sanskrit', title: 'शेमुषी भाग २ (Shemushi Part 2)', language: 'sa', chapterCount: 12 },
  { id: 'class10-it', class: 10, subject: 'Information Technology', title: 'Information Technology', language: 'en', chapterCount: 10 },

  // Class 11 - Science Stream
  { id: 'class11-physics-1', class: 11, subject: 'Physics', title: 'Physics Part 1', language: 'en', chapterCount: 8 },
  { id: 'class11-physics-2', class: 11, subject: 'Physics', title: 'Physics Part 2', language: 'en', chapterCount: 7 },
  { id: 'class11-chemistry-1', class: 11, subject: 'Chemistry', title: 'Chemistry Part 1', language: 'en', chapterCount: 7 },
  { id: 'class11-chemistry-2', class: 11, subject: 'Chemistry', title: 'Chemistry Part 2', language: 'en', chapterCount: 7 },
  { id: 'class11-math', class: 11, subject: 'Mathematics', title: 'Mathematics', language: 'en', chapterCount: 16 },
  { id: 'class11-biology', class: 11, subject: 'Biology', title: 'Biology', language: 'en', chapterCount: 22 },
  { id: 'class11-computer', class: 11, subject: 'Computer Science', title: 'Computer Science with Python', language: 'en', chapterCount: 10 },
  { id: 'class11-informatics', class: 11, subject: 'Informatics Practices', title: 'Informatics Practices', language: 'en', chapterCount: 12 },

  // Class 11 - Commerce/Humanities
  { id: 'class11-accountancy-1', class: 11, subject: 'Accountancy', title: 'Accountancy Part 1', language: 'en', chapterCount: 9 },
  { id: 'class11-accountancy-2', class: 11, subject: 'Accountancy', title: 'Accountancy Part 2', language: 'en', chapterCount: 7 },
  { id: 'class11-business', class: 11, subject: 'Business Studies', title: 'Business Studies', language: 'en', chapterCount: 10 },
  { id: 'class11-economics', class: 11, subject: 'Economics', title: 'Economics', language: 'en', chapterCount: 10 },
  { id: 'class11-history', class: 11, subject: 'History', title: 'Themes in World History', language: 'en', chapterCount: 11 },
  { id: 'class11-geography', class: 11, subject: 'Geography', title: 'Fundamentals of Physical Geography', language: 'en', chapterCount: 16 },
  { id: 'class11-political', class: 11, subject: 'Political Science', title: 'Political Theory', language: 'en', chapterCount: 10 },
  { id: 'class11-psychology', class: 11, subject: 'Psychology', title: 'Introduction to Psychology', language: 'en', chapterCount: 10 },
  { id: 'class11-sociology', class: 11, subject: 'Sociology', title: 'Introducing Sociology', language: 'en', chapterCount: 9 },
  { id: 'class11-sanskrit', class: 11, subject: 'Sanskrit', title: 'भास्वती (Bhaswati)', language: 'sa', chapterCount: 12 },
  { id: 'class11-english-reader', class: 11, subject: 'English', title: 'Snapshots (Supplementary Reader)', language: 'en', chapterCount: 8 },

  // Class 12 - Science Stream
  { id: 'class12-physics-1', class: 12, subject: 'Physics', title: 'Physics Part 1', language: 'en', chapterCount: 8 },
  { id: 'class12-physics-2', class: 12, subject: 'Physics', title: 'Physics Part 2', language: 'en', chapterCount: 7 },
  { id: 'class12-chemistry-1', class: 12, subject: 'Chemistry', title: 'Chemistry Part 1', language: 'en', chapterCount: 8 },
  { id: 'class12-chemistry-2', class: 12, subject: 'Chemistry', title: 'Chemistry Part 2', language: 'en', chapterCount: 8 },
  { id: 'class12-math', class: 12, subject: 'Mathematics', title: 'Mathematics', language: 'en', chapterCount: 13 },
  { id: 'class12-biology', class: 12, subject: 'Biology', title: 'Biology', language: 'en', chapterCount: 16 },
  { id: 'class12-computer', class: 12, subject: 'Computer Science', title: 'Computer Science with Python', language: 'en', chapterCount: 11 },
  { id: 'class12-informatics', class: 12, subject: 'Informatics Practices', title: 'Informatics Practices', language: 'en', chapterCount: 13 },

  // Class 12 - Commerce/Humanities
  { id: 'class12-accountancy-1', class: 12, subject: 'Accountancy', title: 'Accountancy Part 1', language: 'en', chapterCount: 6 },
  { id: 'class12-accountancy-2', class: 12, subject: 'Accountancy', title: 'Accountancy Part 2', language: 'en', chapterCount: 4 },
  { id: 'class12-business', class: 12, subject: 'Business Studies', title: 'Business Studies', language: 'en', chapterCount: 12 },
  { id: 'class12-economics-1', class: 12, subject: 'Economics', title: 'Introductory Microeconomics', language: 'en', chapterCount: 6 },
  { id: 'class12-economics-2', class: 12, subject: 'Economics', title: 'Introductory Macroeconomics', language: 'en', chapterCount: 6 },
  { id: 'class12-history-1', class: 12, subject: 'History', title: 'Themes in Indian History Part 1', language: 'en', chapterCount: 4 },
  { id: 'class12-history-2', class: 12, subject: 'History', title: 'Themes in Indian History Part 2', language: 'en', chapterCount: 5 },
  { id: 'class12-history-3', class: 12, subject: 'History', title: 'Themes in Indian History Part 3', language: 'en', chapterCount: 6 },
  { id: 'class12-geography-1', class: 12, subject: 'Geography', title: 'Fundamentals of Human Geography', language: 'en', chapterCount: 10 },
  { id: 'class12-geography-2', class: 12, subject: 'Geography', title: 'India - People and Economy', language: 'en', chapterCount: 12 },
  { id: 'class12-political-1', class: 12, subject: 'Political Science', title: 'Contemporary World Politics', language: 'en', chapterCount: 9 },
  { id: 'class12-political-2', class: 12, subject: 'Political Science', title: 'Politics in India Since Independence', language: 'en', chapterCount: 9 },
  { id: 'class12-psychology', class: 12, subject: 'Psychology', title: 'Psychology', language: 'en', chapterCount: 10 },
  { id: 'class12-sociology', class: 12, subject: 'Sociology', title: 'Indian Society', language: 'en', chapterCount: 8 },

  // Class 12 - English
  { id: 'class12-english', class: 12, subject: 'English', title: 'Flamingo', language: 'en', chapterCount: 8 },
  { id: 'class12-english-reader', class: 12, subject: 'English', title: 'Vistas (Supplementary Reader)', language: 'en', chapterCount: 8 },
  { id: 'class12-hindi', class: 12, subject: 'Hindi', title: 'आरोह', language: 'hi', chapterCount: 18 },
  { id: 'class12-sanskrit', class: 12, subject: 'Sanskrit', title: 'भास्वती भाग २ (Bhaswati Part 2)', language: 'sa', chapterCount: 14 },
];

const MOCK_CHAPTERS: Record<string, NCERTChapter[]> = {
  'class10-science': [
    {
      id: 'ch1',
      bookId: 'class10-science',
      chapterNumber: 1,
      title: 'Chemical Reactions and Equations',
      content: '',
      metadata: { readingTime: 45, difficulty: 'medium', tags: ['chemistry'] },
    },
    {
      id: 'ch2',
      bookId: 'class10-science',
      chapterNumber: 2,
      title: 'Acids, Bases and Salts',
      content: '',
      metadata: { readingTime: 40, difficulty: 'medium', tags: ['chemistry'] },
    },
    {
      id: 'ch12',
      bookId: 'class10-science',
      chapterNumber: 12,
      title: 'Electricity',
      content: '',
      metadata: { readingTime: 50, difficulty: 'medium', tags: ['physics'] },
    },
    {
      id: 'ch13',
      bookId: 'class10-science',
      chapterNumber: 13,
      title: 'Magnetic Effects of Electric Current',
      content: '',
      metadata: { readingTime: 40, difficulty: 'hard', tags: ['physics'] },
    },
  ],
};

// Routes
fastify.get('/api/ncert/books', async (request, reply) => {
  return { success: true, books: MOCK_BOOKS };
});

fastify.get<{ Params: { bookId: string } }>(
  '/api/ncert/books/:bookId/chapters',
  async (request, reply) => {
    const { bookId } = request.params;

    // Find the book to get chapter count
    const book = MOCK_BOOKS.find((b) => b.id === bookId);
    if (!book) {
      return reply.code(404).send({ success: false, error: 'Book not found' });
    }

    // Helper function to generate chapter title based on language
    const getChapterTitle = (chapterNum: number, language: string): string => {
      switch (language) {
        case 'hi':
          return `अध्याय ${chapterNum}`;
        case 'sa':
          return `पाठः ${chapterNum}`;
        default:
          return `Chapter ${chapterNum}`;
      }
    };

    // Generate chapters dynamically based on chapterCount
    const chapters: NCERTChapter[] = [];
    for (let i = 1; i <= book.chapterCount; i++) {
      chapters.push({
        id: `${bookId}-ch${i}`,
        bookId: bookId,
        chapterNumber: i,
        title: getChapterTitle(i, book.language),
        content: '',
        metadata: {
          readingTime: 30 + Math.floor(Math.random() * 30), // 30-60 min
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
          tags: [book.subject.toLowerCase()],
        },
      });
    }

    return { success: true, chapters };
  }
);

fastify.get<{ Params: { chapterId: string } }>(
  '/api/ncert/chapters/:chapterId',
  async (request, reply) => {
    const { chapterId } = request.params;

    // Load sample content for ch12
    let content = '';
    if (chapterId === 'ch12') {
      const contentPath = path.join(
        process.cwd(),
        '../content/class-10/science/chapters/ch12-electricity.md'
      );
      try {
        content = await fs.readFile(contentPath, 'utf-8');
      } catch {
        content = `# Chapter 12: Electricity\n\n(Sample content loading...)\n\nThis chapter covers the fundamentals of electricity.`;
      }
    }

    // Find chapter metadata
    let chapter: NCERTChapter | undefined;
    for (const chapters of Object.values(MOCK_CHAPTERS)) {
      chapter = chapters.find((c) => c.id === chapterId);
      if (chapter) break;
    }

    if (!chapter) {
      return reply.code(404).send({ success: false, error: 'Chapter not found' });
    }

    return { success: true, chapter: { ...chapter, content } };
  }
);

// AI-powered endpoints
fastify.post<{
  Body: {
    chapterId: string;
    section: string;
    content: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
  };
}>('/api/ncert/questions/fermi', async (request, reply) => {
  const { chapterId, section, content, difficulty = 'medium', count = 3 } = request.body;

  try {
    const questions = await fermiGenerator.generateQuestions(
      chapterId,
      section,
      content,
      difficulty,
      count
    );

    return {
      success: true,
      questions,
    };
  } catch (error) {
    fastify.log.error('Fermi generation error:', error);
    return reply.code(500).send({
      success: false,
      error: 'Failed to generate Fermi questions',
    });
  }
});

fastify.post<{
  Body: {
    sessionId: string;
    chapterId: string;
    concept: string;
    userMessage?: string;
    action?: 'start' | 'continue';
  };
}>('/api/ncert/questions/socratic', async (request, reply) => {
  const { sessionId, chapterId, concept, userMessage, action = 'continue' } = request.body;

  try {
    let response;

    if (action === 'start' || !userMessage) {
      response = await socraticTutor.startConversation(sessionId, concept, chapterId);
    } else {
      response = await socraticTutor.respond(sessionId, userMessage, concept, chapterId);
    }

    return {
      success: true,
      response,
    };
  } catch (error) {
    fastify.log.error('Socratic tutor error:', error);
    return reply.code(500).send({
      success: false,
      error: 'Failed to generate Socratic response',
    });
  }
});

fastify.post<{
  Body: {
    chapterId: string;
    concept: string;
    content: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
  };
}>('/api/ncert/questions/logic', async (request, reply) => {
  const { chapterId, concept, content, difficulty = 'medium', count = 3 } = request.body;

  try {
    const challenges = await logicGenerator.generateChallenges(
      chapterId,
      concept,
      content,
      difficulty,
      count
    );

    return {
      success: true,
      challenges,
    };
  } catch (error) {
    fastify.log.error('Logic generation error:', error);
    return reply.code(500).send({
      success: false,
      error: 'Failed to generate logic challenges',
    });
  }
});

fastify.post<{
  Body: {
    text: string;
    from: 'en' | 'hi';
    to: 'en' | 'hi';
  };
}>('/api/ncert/translate', async (request, reply) => {
  const { text, from, to } = request.body;

  try {
    const result = await translator.translate(text, from, to);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    fastify.log.error('Translation error:', error);
    return reply.code(500).send({
      success: false,
      error: 'Failed to translate',
    });
  }
});

fastify.get<{ Params: { chapterId: string } }>(
  '/api/ncert/similar/:chapterId',
  async (request, reply) => {
    const { chapterId } = request.params;

    // TODO: Implement semantic similarity search using embeddings
    return {
      success: true,
      similar: [
        {
          id: 'ch13',
          title: 'Magnetic Effects of Electric Current',
          similarity: 95,
          reason: 'Directly builds on electricity concepts',
        },
      ],
    };
  }
);

// Stats endpoint
fastify.get('/api/ncert/stats', async (request, reply) => {
  const totalChapters = MOCK_BOOKS.reduce((sum, book) => sum + book.chapterCount, 0);

  return {
    success: true,
    totalBooks: MOCK_BOOKS.length,
    totalChapters,
    questionsGenerated: totalChapters * 6, // Estimate: 3 Fermi + 3 Logic per chapter
    studentsHelped: 0,
    lastUpdated: new Date().toISOString(),
  };
});

// Health check
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    service: 'ncert-backend',
    port: 4090,
    aiServices: {
      fermi: '✓',
      socratic: '✓',
      logic: '✓',
      translation: '✓',
    },
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 4090, host: '0.0.0.0' });
    fastify.log.info(`✅ NCERT Backend listening on port 4090`);
    fastify.log.info(`📚 Serving ${MOCK_BOOKS.length} NCERT books`);
    fastify.log.info(`🤖 AI Services: Fermi, Socratic, Logic, Translation`);
    fastify.log.info(`🔗 AI Proxy: ${process.env.AI_PROXY_URL || 'http://localhost:4444'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
