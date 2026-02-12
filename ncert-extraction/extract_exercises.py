#!/usr/bin/env python3
"""
Extract all exercises from Class 10 Mathematics NCERT PDFs
"""

import json
import re
import PyPDF2
from pathlib import Path
from typing import List, Dict, Any

# Chapter mapping
CHAPTER_MAPPING = {
    1: {"title": "Real Numbers", "module_id": "ch1-real-numbers"},
    2: {"title": "Polynomials", "module_id": "ch2-polynomials"},
    3: {"title": "Pair of Linear Equations in Two Variables", "module_id": "ch3-linear-equations"},
    4: {"title": "Quadratic Equations", "module_id": "ch4-quadratic-equations"},
    5: {"title": "Arithmetic Progressions", "module_id": "ch5-arithmetic-progressions"},
    6: {"title": "Triangles", "module_id": "ch6-triangles"},
    7: {"title": "Coordinate Geometry", "module_id": "ch7-coordinate-geometry"},
    8: {"title": "Introduction to Trigonometry", "module_id": "ch8-trigonometry"},
    9: {"title": "Some Applications of Trigonometry", "module_id": "ch9-trigonometry-applications"},
    10: {"title": "Circles", "module_id": "ch10-circles"},
    11: {"title": "Constructions", "module_id": "ch11-constructions"},
    12: {"title": "Areas Related to Circles", "module_id": "ch12-areas-circles"},
    13: {"title": "Surface Areas and Volumes", "module_id": "ch13-surface-areas-volumes"},
    14: {"title": "Statistics", "module_id": "ch14-statistics"},
    15: {"title": "Probability", "module_id": "ch15-probability"}
}

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file"""
    text = ""
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text

def parse_exercises(text: str, chapter_num: int) -> List[Dict[str, Any]]:
    """Parse exercises from chapter text"""
    exercises = []

    # Find all EXERCISE sections
    exercise_pattern = r'EXERCISE\s+(\d+\.\d+)(.*?)(?=EXERCISE\s+\d+\.\d+|\d+\.\d+\s+Summary|Summary|$)'
    matches = re.finditer(exercise_pattern, text, re.DOTALL | re.IGNORECASE)

    for match in matches:
        exercise_num = match.group(1)
        exercise_text = match.group(2).strip()

        # Parse questions from exercise
        questions = parse_questions(exercise_text)

        if questions:
            exercises.append({
                "exercise_number": exercise_num,
                "questions": questions
            })

    return exercises

def parse_questions(exercise_text: str) -> List[Dict[str, Any]]:
    """Parse individual questions from exercise text"""
    questions = []

    # Split by question numbers (1., 2., 3., etc.)
    question_pattern = r'(?:^|\n)(\d+)\.\s+(.*?)(?=\n\d+\.\s+|\Z)'
    matches = re.finditer(question_pattern, exercise_text, re.DOTALL)

    for match in matches:
        q_num = int(match.group(1))
        q_text = match.group(2).strip()

        # Clean up the question text
        q_text = re.sub(r'\s+', ' ', q_text)
        q_text = re.sub(r'Reprint \d{4}-\d{2}', '', q_text)

        # Estimate difficulty based on question length and complexity
        difficulty = estimate_difficulty(q_text)

        # Extract tags based on keywords
        tags = extract_tags(q_text)

        questions.append({
            "question_number": q_num,
            "question_text": q_text,
            "hints": [],
            "difficulty": difficulty,
            "tags": tags
        })

    return questions

def estimate_difficulty(text: str) -> str:
    """Estimate question difficulty"""
    # Simple heuristic: longer questions or those with "prove" are harder
    if len(text) > 200 or 'prove' in text.lower() or 'show that' in text.lower():
        return "hard"
    elif len(text) > 100:
        return "medium"
    else:
        return "easy"

def extract_tags(text: str) -> List[str]:
    """Extract relevant tags from question text"""
    tags = []
    text_lower = text.lower()

    # Define tag keywords
    tag_keywords = {
        "prime factorization": ["prime factor", "factorise", "factorize"],
        "HCF": ["hcf", "highest common factor", "greatest common divisor"],
        "LCM": ["lcm", "least common multiple", "lowest common multiple"],
        "irrational numbers": ["irrational", "√", "square root"],
        "rational numbers": ["rational"],
        "divisibility": ["divides", "divisible"],
        "proof": ["prove", "show that"],
        "real numbers": ["real number"],
        "euclid": ["euclid"]
    }

    for tag, keywords in tag_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            tags.append(tag)

    return tags if tags else ["general"]

def process_chapter(chapter_num: int, pdf_path: str) -> Dict[str, Any]:
    """Process a single chapter PDF"""
    print(f"Processing Chapter {chapter_num}: {CHAPTER_MAPPING[chapter_num]['title']}...")

    # Extract text from PDF
    text = extract_text_from_pdf(pdf_path)

    # Parse exercises
    exercises = parse_exercises(text, chapter_num)

    return {
        "number": chapter_num,
        "title": CHAPTER_MAPPING[chapter_num]["title"],
        "module_id": CHAPTER_MAPPING[chapter_num]["module_id"],
        "exercises": exercises
    }

def main():
    """Main extraction function"""
    base_path = Path("/root/data/ncert-extracted")
    output_path = Path("/root/ncert-extraction/class10-math-exercises.json")

    chapters = []
    total_questions = 0

    # Process chapters 1-14 (we have PDFs for these)
    for chapter_num in range(1, 15):
        pdf_file = base_path / f"jemh1{chapter_num:02d}.pdf"

        if pdf_file.exists():
            chapter_data = process_chapter(chapter_num, str(pdf_file))
            chapters.append(chapter_data)

            # Count questions
            for exercise in chapter_data["exercises"]:
                total_questions += len(exercise["questions"])
        else:
            print(f"Warning: PDF not found for Chapter {chapter_num}")

    # Create final output
    output_data = {
        "book": "Class 10 Mathematics",
        "total_chapters": len(chapters),
        "total_questions": total_questions,
        "chapters": chapters
    }

    # Save to JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Extraction complete!")
    print(f"  Total chapters: {len(chapters)}")
    print(f"  Total questions: {total_questions}")
    print(f"  Output: {output_path}")

if __name__ == "__main__":
    main()
