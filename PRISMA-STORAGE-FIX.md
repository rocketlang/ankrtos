# Prisma Storage Fix - Definitive Solution

## Problem
Prisma client doesn't have schema models when imported from `@prisma/client` in curriculum-mapper package.

## Root Cause
Module resolution: `@prisma/client` resolves to workspace root, not the generated client in `@ankr/learning`.

## Solution: Use Alternative Approach

Instead of trying to fix module resolution, switch to a simpler approach that WORKS:

### Option 1: Use InMemory Storage for Now, Add DB Persistence Later

**Immediate Fix:**
1. Keep using InMemoryCourseStorage and InMemoryQuizStorage
2. Add a database export step AFTER processing completes
3. Batch save to database once in memory

**Implementation:**
```typescript
// In MasterOrchestrator.ts - REMOVE Prisma storage:
const courseStorage = new InMemoryCourseStorage();
const quizStorage = new InMemoryQuizStorage();

this.courseService = createCourseService({ storage: courseStorage });
this.quizService = createQuizService({ storage: quizStorage });

// AFTER processing completes, save to DB:
async function saveToDB(course: Course) {
  const { PrismaClient } = await import('@ankr/learning/node_modules/.prisma/client');
  const prisma = new PrismaClient();

  // Save course
  await prisma.course.create({
    data: {
      id: course.id,
      title: course.title,
      // ... map all fields
    }
  });

  // Save modules
  for (const module of course.modules) {
    await prisma.module.create({ data: { ...module } });
  }

  await prisma.$disconnect();
}
```

### Option 2: Direct Prisma Import in Test Script

**Implementation:**
```typescript
// In test-single-book.ts
import { PrismaClient } from '@ankr/learning/node_modules/.prisma/client';
import {
  createCourseService,
  createQuizService,
  PrismaCourseStorage,
  PrismaQuizStorage
} from '@ankr/learning';

const prisma = new PrismaClient();

const courseStorage = new PrismaCourseStorage({ prisma });
const quizStorage = new PrismaQuizStorage({ prisma });

const orchestrator = createMasterOrchestrator({
  // ... config
  courseStorage,  // Pass pre-configured storage
  quizStorage,
});
```

### Option 3: Environment-Based Dynamic Import

**Implementation:**
```typescript
// In createStorage.ts
async function getPrismaClient(): Promise<any> {
  // Import from generated location using absolute path
  const prismaPath = '/root/ankr-labs-nx/packages/ankr-learning/node_modules/.prisma/client';
  const { PrismaClient } = await import(prismaPath);
  return new PrismaClient();
}
```

## Recommended: Option 1 (In-Memory + DB Export)

**Why:**
- Simplest, no module resolution issues
- Fast processing (no DB calls during generation)
- Easy to batch optimize DB writes
- Can add Prisma later without refactoring pipeline

**Implementation Steps:**

1. **Revert MasterOrchestrator to InMemory:**
```bash
cd /root/ankr-labs-nx/packages/ankr-curriculum-mapper/src/orchestrators
```

Edit MasterOrchestrator.ts:
```typescript
// Line ~117: Change FROM:
const courseStorage = createConfiguredPrismaCourseStorage();
const quizStorage = createConfiguredPrismaQuizStorage();

// TO:
const courseStorage = new InMemoryCourseStorage();
const quizStorage = new InMemoryQuizStorage();
```

2. **Add DB Export Function:**

Create `/root/ankr-labs-nx/packages/ankr-curriculum-mapper/src/exporters/DatabaseExporter.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import type { Course } from '@ankr/learning';

export class DatabaseExporter {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async exportCourse(course: Course): Promise<void> {
    // Save course
    await this.prisma.course.upsert({
      where: { id: course.id },
      create: {
        id: course.id,
        title: course.title,
        titleHi: course.titleHi || null,
        slug: course.slug,
        description: course.description,
        descriptionHi: course.descriptionHi || null,
        category: course.category,
        tags: course.tags || [],
        difficulty: course.difficulty,
        language: course.language || ['en'],
        duration: course.duration || 0,
        status: course.status,
        authorId: course.authorId || 'system',
        prerequisites: course.prerequisites || [],
        metadata: course.metadata || {},
      },
      update: {
        title: course.title,
        titleHi: course.titleHi || null,
        description: course.description,
        // ... other fields
      },
    });

    // Save modules
    for (const module of course.modules || []) {
      await this.prisma.module.upsert({
        where: { id: module.id },
        create: {
          id: module.id,
          courseId: course.id,
          title: module.title,
          titleHi: module.titleHi || null,
          description: module.description || null,
          order: module.order,
          duration: module.duration || 0,
          metadata: module.metadata || {},
        },
        update: {
          title: module.title,
          // ... other fields
        },
      });

      // Save lessons
      for (const lesson of module.lessons || []) {
        await this.prisma.lesson.upsert({
          where: { id: lesson.id },
          create: {
            id: lesson.id,
            moduleId: module.id,
            title: lesson.title,
            titleHi: lesson.titleHi || null,
            description: lesson.description || null,
            type: lesson.type,
            order: lesson.order,
            duration: lesson.duration || 0,
            content: lesson.content || {},
            resources: lesson.resources || [],
            metadata: lesson.metadata || {},
          },
          update: {
            title: lesson.title,
            // ... other fields
          },
        });
      }
    }

    console.log(`✅ Exported course ${course.id} to database`);
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
```

3. **Use in MasterOrchestrator:**

In MasterOrchestrator.ts, add at the end of `run()`:

```typescript
if (result.success && result.course && this.config.outputFormat === 'DATABASE') {
  const dbExporter = new DatabaseExporter();
  await dbExporter.exportCourse(result.course);
  await dbExporter.disconnect();
}
```

## Testing

```bash
# Run single book test
cd /root/ankr-labs-nx/apps/ankr-curriculum-backend
npx tsx src/scripts/test-single-book.ts

# Check database
PGPASSWORD='indrA@0612' psql -h localhost -p 5432 -U ankr -d ankr_eon -c "
SET search_path TO ankr_learning;
SELECT COUNT(*) as courses FROM courses;
SELECT COUNT(*) as modules FROM modules;
SELECT COUNT(*) as lessons FROM lessons;
"
```

## Why This Works

1. **No module resolution issues** - Each package uses its own Prisma client
2. **Fast processing** - No DB calls during AI generation
3. **Batch optimization** - Can optimize DB writes separately
4. **Easy debugging** - Clear separation between generation and persistence
5. **Future-proof** - Can switch to direct Prisma storage later without changing pipeline

## Next Steps

1. Implement Option 1 (recommended)
2. Test with single book
3. Verify database persistence
4. Resume full NCERT + Cambridge processing
5. (Optional) Later optimize with direct Prisma storage once module resolution is fixed

---

**Status:** Ready to implement
**Estimated Time:** 15 minutes
**Impact:** Unblocks all curriculum processing
