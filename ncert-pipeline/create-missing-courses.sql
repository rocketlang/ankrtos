-- Create missing NCERT courses (Classes 8, 11, 12)

INSERT INTO ankr_learning.courses (
  id,
  title,
  slug,
  description,
  category,
  difficulty,
  author_id,
  duration,
  status,
  metadata,
  updated_at
) VALUES

-- Class 8
('class-8-mathematics', 'Mathematics for Class 8', 'class-8-mathematics', 'NCERT Mathematics textbook for Class 8', 'Mathematics', 'intermediate', 'system', 90, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "8"}', NOW()),
('class-8-science', 'Science for Class 8', 'class-8-science', 'NCERT Science textbook for Class 8', 'Science', 'intermediate', 'system', 90, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "8"}', NOW()),
('class-8-social-science', 'Social Science for Class 8', 'class-8-social-science', 'NCERT Social Science textbook for Class 8', 'Social Science', 'intermediate', 'system', 90, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "8"}', NOW()),

-- Class 11
('class-11-mathematics', 'Mathematics for Class 11', 'class-11-mathematics', 'NCERT Mathematics textbook for Class 11', 'Mathematics', 'advanced', 'system', 120, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "11"}', NOW()),
('class-11-physics', 'Physics for Class 11', 'class-11-physics', 'NCERT Physics textbook for Class 11', 'Physics', 'advanced', 'system', 120, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "11"}', NOW()),
('class-11-chemistry', 'Chemistry for Class 11', 'class-11-chemistry', 'NCERT Chemistry textbook for Class 11', 'Chemistry', 'advanced', 'system', 120, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "11"}', NOW()),
('class-11-biology', 'Biology for Class 11', 'class-11-biology', 'NCERT Biology textbook for Class 11', 'Biology', 'advanced', 'system', 120, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "11"}', NOW()),

-- Class 12
('class-12-mathematics', 'Mathematics for Class 12', 'class-12-mathematics', 'NCERT Mathematics textbook for Class 12', 'Mathematics', 'advanced', 'system', 120, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "12"}', NOW()),
('class-12-physics', 'Physics for Class 12', 'class-12-physics', 'NCERT Physics textbook for Class 12', 'Physics', 'advanced', 'system', 120, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "12"}', NOW()),
('class-12-chemistry', 'Chemistry for Class 12', 'class-12-chemistry', 'NCERT Chemistry textbook for Class 12', 'Chemistry', 'advanced', 'system', 120, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "12"}', NOW()),
('class-12-biology', 'Biology for Class 12', 'class-12-biology', 'NCERT Biology textbook for Class 12', 'Biology', 'advanced', 'system', 120, 'PUBLISHED', '{"source": "NCERT", "language": "English", "board": "CBSE", "grade": "12"}', NOW())

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Verify
SELECT id, title, (metadata->>'grade') as grade
FROM ankr_learning.courses
WHERE id LIKE 'class-%' AND id ~ '(class-8|class-11|class-12)'
ORDER BY (metadata->>'grade')::int, title;
