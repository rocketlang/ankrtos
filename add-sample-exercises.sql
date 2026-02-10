-- Sample Examples and Exercises for Class 10 Mathematics
-- Chapter 1: Real Numbers

-- Examples for Real Numbers
INSERT INTO ankr_learning.chapter_examples (id, module_id, example_number, title, question, solution, explanation, difficulty, tags, "order") VALUES
('ex-real-1', 'ch1-real-numbers', 1, 'HCF by Euclid''s Algorithm',
'Find the HCF of 135 and 225 using Euclid''s division algorithm.',
'Step 1: 225 = 135 × 1 + 90
Step 2: 135 = 90 × 1 + 45
Step 3: 90 = 45 × 2 + 0
Therefore, HCF(135, 225) = 45',
'Euclid''s algorithm repeatedly applies the division algorithm: a = bq + r, where 0 ≤ r < b. The HCF is the last non-zero remainder.',
'easy', ARRAY['HCF', 'Euclid', 'Division'], 1),

('ex-real-2', 'ch1-real-numbers', 2, 'Prove Irrationality',
'Prove that √2 is irrational.',
'Proof by contradiction:
Assume √2 is rational, so √2 = p/q where p, q are coprime integers.
Squaring both sides: 2 = p²/q²
Therefore: p² = 2q²

This means p² is even, so p is even. Let p = 2m.
Then (2m)² = 2q²
4m² = 2q²
2m² = q²

This means q² is even, so q is even.
But if both p and q are even, they have a common factor 2, contradicting our assumption that they are coprime.
Therefore, √2 must be irrational.',
'Use proof by contradiction. Assume √2 is rational and derive a contradiction.',
'medium', ARRAY['irrational', 'proof', 'contradiction'], 2),

('ex-real-3', 'ch1-real-numbers', 3, 'Decimal Expansion',
'Express 1/7 as a decimal and state what kind of decimal expansion it has.',
'1/7 = 0.142857142857... = 0.1̅4̅2̅8̅5̅7̅

This is a non-terminating recurring decimal.
The period (repeating block) is 142857 with length 6.',
'When dividing 1 by 7, the remainders repeat after 6 steps, creating a recurring decimal with period 6.',
'easy', ARRAY['decimal', 'rational', 'recurring'], 3);

-- Exercises for Real Numbers
INSERT INTO ankr_learning.chapter_exercises (id, module_id, exercise_number, question_number, question_text, solution, hints, difficulty, tags, "order") VALUES
('exe-real-1-1', 'ch1-real-numbers', '1.1', 1,
'Use Euclid''s division algorithm to find the HCF of 96 and 404.',
'404 = 96 × 4 + 20
96 = 20 × 4 + 16
20 = 16 × 1 + 4
16 = 4 × 4 + 0
HCF(96, 404) = 4',
ARRAY['Apply division algorithm repeatedly', 'Last non-zero remainder is the HCF'],
'easy', ARRAY['HCF', 'Euclid'], 1),

('exe-real-1-2', 'ch1-real-numbers', '1.1', 2,
'Show that any positive odd integer is of the form 6q + 1, or 6q + 3, or 6q + 5, where q is some integer.',
'By Euclid''s division lemma, any positive integer n can be written as:
n = 6q + r, where 0 ≤ r < 6

So r can be 0, 1, 2, 3, 4, or 5.

If n is odd, then n cannot be 6q (divisible by 2), 6q + 2 (divisible by 2), or 6q + 4 (divisible by 2).

Therefore, n must be of the form 6q + 1, 6q + 3, or 6q + 5.',
ARRAY['Use Euclid''s division lemma', 'Odd numbers cannot be divisible by 2', 'Eliminate even forms'],
'medium', ARRAY['odd numbers', 'proof', 'division lemma'], 2),

('exe-real-1-3', 'ch1-real-numbers', '1.1', 3,
'An army contingent of 616 members is to march behind an army band of 32 members in a parade. The two groups are to march in the same number of columns. What is the maximum number of columns in which they can march?',
'Maximum number of columns = HCF(616, 32)

Using Euclid''s algorithm:
616 = 32 × 19 + 8
32 = 8 × 4 + 0

HCF = 8

Therefore, the maximum number of columns is 8.',
ARRAY['This is an HCF problem', 'Find HCF of 616 and 32', 'Use Euclid''s algorithm'],
'easy', ARRAY['HCF', 'application', 'word problem'], 3),

('exe-real-2-1', 'ch1-real-numbers', '1.2', 1,
'Express each number as a product of its prime factors: (i) 140 (ii) 156 (iii) 3825',
'(i) 140 = 2² × 5 × 7
(ii) 156 = 2² × 3 × 13
(iii) 3825 = 3 × 5² × 51 = 3 × 5² × 3 × 17 = 3² × 5² × 17',
ARRAY['Use factor tree method', 'Divide by smallest prime repeatedly', 'Continue until you get 1'],
'easy', ARRAY['prime factorization', 'factors'], 4),

('exe-real-2-2', 'ch1-real-numbers', '1.2', 2,
'Find the LCM and HCF of 6 and 20 by the prime factorisation method.',
'6 = 2 × 3
20 = 2² × 5

HCF = product of smallest powers of common primes = 2¹ = 2
LCM = product of greatest powers of all primes = 2² × 3 × 5 = 60',
ARRAY['Find prime factorization of both numbers', 'HCF uses lowest powers', 'LCM uses highest powers'],
'medium', ARRAY['LCM', 'HCF', 'prime factorization'], 5);

-- Examples for Polynomials (Chapter 2)
INSERT INTO ankr_learning.chapter_examples (id, module_id, example_number, title, question, solution, explanation, difficulty, tags, "order") VALUES
('ex-poly-1', 'ch2-polynomials', 1, 'Degree of Polynomial',
'Find the degree of the polynomial 3x⁴ - 5x³ + 2x² + x - 7.',
'The degree is 4 (the highest power of x).',
'The degree of a polynomial is the highest power of the variable in the polynomial.',
'easy', ARRAY['polynomial', 'degree'], 1),

('ex-poly-2', 'ch2-polynomials', 2, 'Find Zeros of Polynomial',
'Find the zeros of the polynomial p(x) = x² - 3x + 2.',
'To find zeros, set p(x) = 0:
x² - 3x + 2 = 0
(x - 1)(x - 2) = 0
x = 1 or x = 2

Therefore, the zeros are 1 and 2.

Verification:
p(1) = 1² - 3(1) + 2 = 1 - 3 + 2 = 0 ✓
p(2) = 2² - 3(2) + 2 = 4 - 6 + 2 = 0 ✓',
'Zeros of a polynomial are the values of x where p(x) = 0. Factorize and solve.',
'easy', ARRAY['polynomial', 'zeros', 'factorization'], 2);

-- Exercises for Polynomials
INSERT INTO ankr_learning.chapter_exercises (id, module_id, exercise_number, question_number, question_text, solution, hints, difficulty, tags, "order") VALUES
('exe-poly-1-1', 'ch2-polynomials', '2.1', 1,
'Find the zeros of the polynomial p(x) = x² + 7x + 10.',
'x² + 7x + 10 = 0
(x + 2)(x + 5) = 0
x = -2 or x = -5

The zeros are -2 and -5.',
ARRAY['Factorize the quadratic', 'Find values where each factor equals zero'],
'easy', ARRAY['polynomial', 'zeros'], 1),

('exe-poly-1-2', 'ch2-polynomials', '2.1', 2,
'Verify that 3, -1, -1/3 are the zeros of the cubic polynomial p(x) = 3x³ - 5x² - 11x - 3.',
'p(3) = 3(3)³ - 5(3)² - 11(3) - 3 = 81 - 45 - 33 - 3 = 0 ✓
p(-1) = 3(-1)³ - 5(-1)² - 11(-1) - 3 = -3 - 5 + 11 - 3 = 0 ✓
p(-1/3) = 3(-1/3)³ - 5(-1/3)² - 11(-1/3) - 3 = -1/9 - 5/9 + 11/3 - 3 = 0 ✓

All three are zeros of the polynomial.',
ARRAY['Substitute each value into p(x)', 'If p(a) = 0, then a is a zero'],
'medium', ARRAY['polynomial', 'verification', 'zeros'], 2);

-- Examples for Linear Equations (Chapter 3)
INSERT INTO ankr_learning.chapter_examples (id, module_id, example_number, title, question, solution, explanation, difficulty, tags, "order") VALUES
('ex-linear-1', 'ch3-linear-equations', 1, 'Solve by Substitution',
'Solve the pair of equations: x + y = 14 and x - y = 4.',
'From equation 2: x = y + 4
Substitute in equation 1: (y + 4) + y = 14
2y + 4 = 14
2y = 10
y = 5

Substitute y = 5 in x = y + 4:
x = 5 + 4 = 9

Solution: x = 9, y = 5',
'Use substitution method: express one variable in terms of the other, then substitute.',
'easy', ARRAY['linear equations', 'substitution'], 1);

-- Exercises for Linear Equations
INSERT INTO ankr_learning.chapter_exercises (id, module_id, exercise_number, question_number, question_text, solution, hints, difficulty, tags, "order") VALUES
('exe-linear-1-1', 'ch3-linear-equations', '3.1', 1,
'Solve the pair of equations by substitution method: x + y = 14 and x - y = 4.',
'From equation 2: x = y + 4
Substitute in equation 1: (y + 4) + y = 14
2y = 10
y = 5
x = 9

Solution: (9, 5)',
ARRAY['Express x in terms of y from one equation', 'Substitute in the other equation'],
'easy', ARRAY['linear equations', 'substitution'], 1);

COMMENT ON TABLE ankr_learning.chapter_examples IS 'Contains ' || (SELECT COUNT(*) FROM ankr_learning.chapter_examples) || ' worked examples';
COMMENT ON TABLE ankr_learning.chapter_exercises IS 'Contains ' || (SELECT COUNT(*) FROM ankr_learning.chapter_exercises) || ' practice exercises';
