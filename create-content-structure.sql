-- Add chapter content to database
-- This creates a table to store full chapter markdown content

-- Create chapter content table
CREATE TABLE IF NOT EXISTS ankr_learning.chapter_content (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES ankr_learning.modules(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_format TEXT DEFAULT 'markdown',
    word_count INTEGER,
    reading_time_minutes INTEGER,
    last_updated TIMESTAMP DEFAULT NOW(),
    source TEXT,
    UNIQUE(module_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_content_module ON ankr_learning.chapter_content(module_id);

COMMENT ON TABLE ankr_learning.chapter_content IS 'Stores full chapter content in markdown format';

-- Sample content structure (this is a template, not actual NCERT content)
-- You should obtain actual content from legitimate NCERT sources

INSERT INTO ankr_learning.chapter_content (id, module_id, content, word_count, reading_time_minutes, source) VALUES
('content-ch1', 'ch1-real-numbers',
'# Chapter 1: Real Numbers

## 1.1 Introduction

This chapter introduces the concept of real numbers and their properties.

### What are Real Numbers?

Real numbers include:
- Natural numbers (1, 2, 3, ...)
- Whole numbers (0, 1, 2, 3, ...)
- Integers (..., -2, -1, 0, 1, 2, ...)
- Rational numbers (fractions like 1/2, 3/4)
- Irrational numbers (√2, π, e)

## 1.2 Euclid''s Division Algorithm

**Euclid''s Division Lemma**: Given positive integers a and b, there exist unique integers q and r satisfying:

```
a = bq + r, where 0 ≤ r < b
```

### Application: Finding HCF

The Highest Common Factor (HCF) of two numbers can be found using repeated application of the division algorithm.

**Steps:**
1. Apply division algorithm: a = bq + r
2. If r = 0, HCF is b
3. If r ≠ 0, apply algorithm to b and r
4. Continue until remainder is 0

## 1.3 The Fundamental Theorem of Arithmetic

**Theorem**: Every composite number can be expressed as a product of primes, and this factorization is unique (except for the order of factors).

### Prime Factorization

To find prime factorization:
1. Divide by smallest prime that divides the number
2. Continue with the quotient
3. Repeat until quotient is 1

Example: 60 = 2 × 2 × 3 × 5 = 2² × 3 × 5

## 1.4 Rational Numbers and Their Decimal Expansions

**Theorem**: Let p/q be a rational number where q ≠ 0 and p, q are coprime.

The decimal expansion of p/q:
- **Terminates** if q = 2ⁿ × 5ᵐ (for some n, m ≥ 0)
- **Non-terminating repeating** otherwise

### Examples

- 1/8 = 0.125 (terminates, since 8 = 2³)
- 1/7 = 0.142857... (repeats, since 7 has factors other than 2 and 5)

## 1.5 Irrational Numbers

**Definition**: Numbers that cannot be expressed as p/q where p, q are integers.

**Proof that √2 is irrational** (by contradiction):
- Assume √2 = p/q (in lowest terms)
- Then 2q² = p²
- This means p is even, so p = 2m
- Then 4m² = 2q², so q² = 2m²
- This means q is also even
- But this contradicts our assumption that p/q is in lowest terms

## Summary

Key concepts covered:
1. Euclid''s Division Algorithm
2. HCF and LCM
3. Fundamental Theorem of Arithmetic
4. Rational and irrational numbers
5. Decimal expansions

---

**Note**: This is a structured summary. For complete content, please refer to official NCERT textbooks available at ncert.nic.in',
1200, 15, 'Sample structure - replace with legitimate NCERT content');

COMMENT ON TABLE ankr_learning.chapter_content IS 'Stores chapter content - should be populated from legitimate NCERT sources';
