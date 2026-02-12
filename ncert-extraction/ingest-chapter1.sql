-- Ingest Class 10 Mathematics Chapter 1 exercises into database
-- Total: 10 questions across 2 exercises

BEGIN;

-- Exercise 1.1, Question 1
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.1-q1',
  'ch1-real-numbers',
  '1.1',
  1,
  E'Express each number as a product of its prime factors:\n(i) 140\n(ii) 156\n(iii) 3825\n(iv) 5005\n(v) 7429',
  ARRAY['Use factor tree method', 'Divide by smallest prime repeatedly', 'Continue until you get 1'],
  'easy',
  ARRAY['prime factorization', 'factors'],
  1,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.1, Question 2
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.1-q2',
  'ch1-real-numbers',
  '1.1',
  2,
  E'Find the LCM and HCF of the following pairs of integers and verify that LCM × HCF = product of the two numbers.\n(i) 26 and 91\n(ii) 510 and 92\n(iii) 336 and 54',
  ARRAY['Find prime factorization of both numbers', 'HCF uses lowest powers', 'LCM uses highest powers'],
  'medium',
  ARRAY['LCM', 'HCF', 'prime factorization'],
  2,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.1, Question 3
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.1-q3',
  'ch1-real-numbers',
  '1.1',
  3,
  E'Find the LCM and HCF of the following integers by applying the prime factorisation method.\n(i) 12, 15 and 21\n(ii) 17, 23 and 29\n(iii) 8, 9 and 25',
  ARRAY['Find prime factorization for all three numbers', 'HCF is product of common factors with lowest powers', 'LCM is product of all factors with highest powers'],
  'medium',
  ARRAY['LCM', 'HCF', 'prime factorization', 'three numbers'],
  3,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.1, Question 4
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.1-q4',
  'ch1-real-numbers',
  '1.1',
  4,
  'Given that HCF (306, 657) = 9, find LCM (306, 657).',
  ARRAY['Use formula: HCF × LCM = Product of numbers', 'HCF(a,b) × LCM(a,b) = a × b'],
  'easy',
  ARRAY['HCF', 'LCM', 'formula'],
  4,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.1, Question 5
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.1-q5',
  'ch1-real-numbers',
  '1.1',
  5,
  'Check whether 6^n can end with the digit 0 for any natural number n.',
  ARRAY['For a number to end with 0, it must be divisible by 10', '10 = 2 × 5', 'Check prime factorization of 6'],
  'medium',
  ARRAY['divisibility', 'prime factorization', 'proof'],
  5,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.1, Question 6
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.1-q6',
  'ch1-real-numbers',
  '1.1',
  6,
  'Explain why 7 × 11 × 13 + 13 and 7 × 6 × 5 × 4 × 3 × 2 × 1 + 5 are composite numbers.',
  ARRAY['Factor out common terms', 'Composite numbers have factors other than 1 and itself'],
  'medium',
  ARRAY['composite numbers', 'factorization'],
  6,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.1, Question 7
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.1-q7',
  'ch1-real-numbers',
  '1.1',
  7,
  'There is a circular path around a sports field. Sonia takes 18 minutes to drive one round of the field, while Ravi takes 12 minutes for the same. Suppose they both start at the same point and at the same time, and go in the same direction. After how many minutes will they meet again at the starting point?',
  ARRAY['This is an LCM problem', 'Find LCM of 18 and 12', 'They meet when both complete whole rounds'],
  'easy',
  ARRAY['LCM', 'application', 'word problem'],
  7,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.2, Question 1
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.2-q1',
  'ch1-real-numbers',
  '1.2',
  1,
  'Prove that √5 is irrational.',
  ARRAY['Assume √5 is rational and write it as a/b', 'Use proof by contradiction', 'Use Fundamental Theorem of Arithmetic'],
  'medium',
  ARRAY['irrational numbers', 'proof', 'contradiction'],
  8,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.2, Question 2
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.2-q2',
  'ch1-real-numbers',
  '1.2',
  2,
  'Prove that 3 + 2√5 is irrational.',
  ARRAY['Assume it''s rational', 'Rearrange to isolate √5', 'Show contradiction since √5 is irrational'],
  'medium',
  ARRAY['irrational numbers', 'proof'],
  9,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exercise 1.2, Question 3
INSERT INTO ankr_learning.chapter_exercises
(id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, "order", is_optional, created_at, updated_at)
VALUES (
  'class10-ch1-ex1.2-q3',
  'ch1-real-numbers',
  '1.2',
  3,
  E'Prove that the following are irrationals:\n(i) 1/√2\n(ii) 7√5\n(iii) 6 + √2',
  ARRAY['Use proof by contradiction for each', 'Use fact that √2 and √5 are irrational', 'Product/sum of rational and irrational is irrational'],
  'hard',
  ARRAY['irrational numbers', 'proof', 'multiple parts'],
  10,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verify insertion
SELECT COUNT(*) as inserted_count FROM ankr_learning.chapter_exercises
WHERE module_id = 'ch1-real-numbers' AND id LIKE 'class10-ch1-%';
