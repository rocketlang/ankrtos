-- Add all chapters for Class 10 Mathematics
-- NCERT Class 10 Math has 15 chapters

INSERT INTO ankr_learning.modules (id, course_id, title, description, "order", duration, created_at, updated_at) VALUES
-- Chapters 4-15 (1-3 already exist)
('ch4-quadratic-equations', 'class-10-mathematics', 'Quadratic Equations', 'Standard form, solutions, and applications of quadratic equations', 4, 45, NOW(), NOW()),
('ch5-arithmetic-progressions', 'class-10-mathematics', 'Arithmetic Progressions', 'AP sequences, nth term, sum of n terms', 5, 40, NOW(), NOW()),
('ch6-triangles', 'class-10-mathematics', 'Triangles', 'Similarity, Pythagoras theorem, and triangle properties', 6, 50, NOW(), NOW()),
('ch7-coordinate-geometry', 'class-10-mathematics', 'Coordinate Geometry', 'Distance formula, section formula, area of triangle', 7, 45, NOW(), NOW()),
('ch8-trigonometry', 'class-10-mathematics', 'Introduction to Trigonometry', 'Trigonometric ratios and identities', 8, 55, NOW(), NOW()),
('ch9-applications-trigonometry', 'class-10-mathematics', 'Some Applications of Trigonometry', 'Heights and distances problems', 9, 35, NOW(), NOW()),
('ch10-circles', 'class-10-mathematics', 'Circles', 'Tangent to a circle and related theorems', 10, 40, NOW(), NOW()),
('ch11-constructions', 'class-10-mathematics', 'Constructions', 'Division of line segment and tangent construction', 11, 30, NOW(), NOW()),
('ch12-area-related-circles', 'class-10-mathematics', 'Areas Related to Circles', 'Area and perimeter of circle sectors and segments', 12, 40, NOW(), NOW()),
('ch13-surface-areas-volumes', 'class-10-mathematics', 'Surface Areas and Volumes', 'Volume and surface area of combined solids', 13, 45, NOW(), NOW()),
('ch14-statistics', 'class-10-mathematics', 'Statistics', 'Mean, median, mode of grouped data', 14, 40, NOW(), NOW()),
('ch15-probability', 'class-10-mathematics', 'Probability', 'Theoretical probability and simple problems', 15, 35, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add sample content structure for these chapters
INSERT INTO ankr_learning.chapter_content (id, module_id, content, word_count, reading_time_minutes, source) VALUES
('content-ch2', 'ch2-polynomials',
'# Chapter 2: Polynomials

## Introduction
A polynomial is an algebraic expression with variables and coefficients.

## Key Topics
- Degree of polynomial
- Zeros of polynomial
- Relationship between zeros and coefficients
- Division algorithm for polynomials

**Note**: Complete content should be obtained from official NCERT sources.',
100, 5, 'Sample structure'),

('content-ch3', 'ch3-linear-equations',
'# Chapter 3: Pair of Linear Equations in Two Variables

## Introduction
Systems of linear equations and their solutions.

## Key Topics
- Graphical method
- Algebraic methods (substitution, elimination, cross-multiplication)
- Applications

**Note**: Complete content should be obtained from official NCERT sources.',
100, 5, 'Sample structure')
ON CONFLICT (id) DO NOTHING;

-- Update chapter count
UPDATE ankr_learning.courses
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{chapterCount}',
  '15'
)
WHERE id = 'class-10-mathematics';

SELECT 'Added ' || COUNT(*) || ' new chapters' as result
FROM ankr_learning.modules
WHERE course_id = 'class-10-mathematics';
