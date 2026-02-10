-- Add exercises and examples to NCERT chapters
-- These will be linked to modules (chapters) in ankr_learning schema

-- Examples table (worked solutions from NCERT books)
CREATE TABLE IF NOT EXISTS ankr_learning.chapter_examples (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES ankr_learning.modules(id) ON DELETE CASCADE,
    example_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    solution TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exercises table (practice problems from NCERT books)
CREATE TABLE IF NOT EXISTS ankr_learning.chapter_exercises (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES ankr_learning.modules(id) ON DELETE CASCADE,
    exercise_number TEXT NOT NULL, -- e.g., "1.1", "1.2", "2.1"
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    solution TEXT,
    hints TEXT[],
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student exercise submissions
CREATE TABLE IF NOT EXISTS ankr_learning.exercise_submissions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL REFERENCES ankr_learning.chapter_exercises(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_correct BOOLEAN,
    attempts INTEGER DEFAULT 1,
    hint_used BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_examples_module ON ankr_learning.chapter_examples(module_id);
CREATE INDEX IF NOT EXISTS idx_exercises_module ON ankr_learning.chapter_exercises(module_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON ankr_learning.exercise_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exercise ON ankr_learning.exercise_submissions(exercise_id);

-- Comments
COMMENT ON TABLE ankr_learning.chapter_examples IS 'Worked examples from NCERT textbooks with solutions';
COMMENT ON TABLE ankr_learning.chapter_exercises IS 'Practice exercises from NCERT textbooks';
COMMENT ON TABLE ankr_learning.exercise_submissions IS 'Student submissions for exercises';
