#!/usr/bin/env python3
"""
NCERT PDF Content Extractor
Uses PyPDF2 for text extraction
"""

import sys
import json
import re
from pathlib import Path

try:
    import PyPDF2
except ImportError:
    print("❌ PyPDF2 not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
    import PyPDF2

def extract_text_from_pdf(pdf_path):
    """Extract all text from PDF"""
    print(f"📄 Extracting text from: {Path(pdf_path).name}")

    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        num_pages = len(pdf_reader.pages)

        print(f"   Pages: {num_pages}")

        full_text = ""
        for page_num in range(num_pages):
            page = pdf_reader.pages[page_num]
            full_text += page.extract_text() + "\n"

            if (page_num + 1) % 10 == 0:
                print(f"\r   Progress: {page_num + 1}/{num_pages} pages", end='')

        print(f"\r   ✅ Extracted {num_pages} pages ({len(full_text)} chars)")

        return {
            'text': full_text,
            'pages': num_pages,
            'length': len(full_text)
        }

def extract_chapters(text):
    """Extract chapter structure"""
    print("\n📖 Extracting chapters...")

    chapters = []

    # Pattern: Chapter number followed by title
    # Examples: "1\nREAL NUMBERS", "CHAPTER 1: Title", "1. Title"
    patterns = [
        r'^(\d+)\s*\n\s*([A-Z][A-Z\s]{3,50})',  # "1\nREAL NUMBERS"
        r'(?:CHAPTER|Chapter)\s+(\d+)[:\s]*([^\n]+)',  # "CHAPTER 1: Title"
        r'^(\d+)\.\s+([A-Z][a-z].{3,50})',  # "1. Title"
    ]

    matches = []
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.MULTILINE):
            chapter_num = int(match.group(1))
            title = match.group(2).strip()

            if 1 <= chapter_num <= 20 and 3 < len(title) < 100:
                matches.append({
                    'chapterNumber': chapter_num,
                    'title': title,
                    'startPos': match.start()
                })

    # Remove duplicates, keep first occurrence
    unique = {}
    for m in sorted(matches, key=lambda x: (x['chapterNumber'], x['startPos'])):
        if m['chapterNumber'] not in unique:
            unique[m['chapterNumber']] = m

    chapters = list(unique.values())
    chapters.sort(key=lambda x: x['chapterNumber'])

    # Extract content
    for i, chapter in enumerate(chapters):
        next_start = chapters[i + 1]['startPos'] if i + 1 < len(chapters) else len(text)
        chapter['content'] = text[chapter['startPos']:next_start]
        chapter['wordCount'] = len(chapter['content'].split())

    print(f"   Found {len(chapters)} chapters:")
    for ch in chapters:
        print(f"   {ch['chapterNumber']}. {ch['title']} ({ch['wordCount']} words)")

    return chapters

def extract_examples(chapter_text, chapter_num):
    """Extract worked examples"""
    examples = []

    pattern = r'(?:Example|EXAMPLE)\s+(\d+)[:\.]?\s*([^\n]{0,200})'

    for match in re.finditer(pattern, chapter_text):
        ex_num = int(match.group(1))
        title = match.group(2).strip() if match.group(2) else f"Example {ex_num}"

        # Get context (next 1500 chars)
        start = match.start()
        context = chapter_text[start:start + 1500]

        # Try to find solution
        solution_match = re.search(
            r'(?:Solution|SOLUTION)[:\.]?\s*([\s\S]{100,800}?)(?=(?:Example|EXAMPLE|Exercise|EXERCISE|\d\.\s+[A-Z]))',
            context,
            re.IGNORECASE
        )

        examples.append({
            'chapterNumber': chapter_num,
            'exampleNumber': ex_num,
            'title': title,
            'question': context[:min(500, len(context))].strip(),
            'solution': solution_match.group(1).strip() if solution_match else ''
        })

    return examples

def extract_exercises(chapter_text, chapter_num):
    """Extract exercise questions"""
    exercises = []

    # Find exercises
    exercise_pattern = r'(?:EXERCISE|Exercise)\s+(\d+)\.(\d+)'

    for match in re.finditer(exercise_pattern, chapter_text):
        exercise_num = f"{match.group(1)}.{match.group(2)}"
        start = match.start()

        # Get exercise content (next 3000 chars)
        exercise_text = chapter_text[start:start + 3000]

        # Extract numbered questions
        questions = []
        question_pattern = r'^\s*(\d+)\.\s+([^\n]+(?:\n(?!\s*\d+\.)[^\n]+)*)'

        for q_match in re.finditer(question_pattern, exercise_text, re.MULTILINE):
            q_num = int(q_match.group(1))
            q_text = q_match.group(2).strip()

            if 1 <= q_num <= 50 and len(q_text) > 10:
                questions.append({
                    'questionNumber': q_num,
                    'questionText': q_text
                })

        if questions:
            exercises.append({
                'chapterNumber': chapter_num,
                'exerciseNumber': exercise_num,
                'questions': questions
            })

    return exercises

def process_pdf(pdf_path):
    """Main processing function"""
    print("\n" + "="*60)
    print(f"  NCERT PDF Extraction: {Path(pdf_path).name}")
    print("="*60 + "\n")

    # Extract text
    pdf_data = extract_text_from_pdf(pdf_path)

    # Extract chapters
    chapters = extract_chapters(pdf_data['text'])

    # Process each chapter
    processed_chapters = []
    for chapter in chapters:
        examples = extract_examples(chapter['content'], chapter['chapterNumber'])
        exercises = extract_exercises(chapter['content'], chapter['chapterNumber'])

        processed_chapters.append({
            'chapterNumber': chapter['chapterNumber'],
            'title': chapter['title'],
            'content': chapter['content'],
            'wordCount': chapter['wordCount'],
            'examples': examples,
            'exercises': exercises,
            'stats': {
                'examplesCount': len(examples),
                'exercisesCount': sum(len(ex['questions']) for ex in exercises)
            }
        })

    # Summary
    total_examples = sum(ch['stats']['examplesCount'] for ch in processed_chapters)
    total_exercises = sum(ch['stats']['exercisesCount'] for ch in processed_chapters)
    total_words = sum(ch['wordCount'] for ch in processed_chapters)

    print("\n📊 Extraction Summary:")
    print(f"   Chapters: {len(processed_chapters)}")
    print(f"   Total Examples: {total_examples}")
    print(f"   Total Exercises: {total_exercises}")
    print(f"   Total Words: {total_words:,}")

    return {
        'filename': Path(pdf_path).name,
        'chapters': processed_chapters,
        'metadata': {
            'pages': pdf_data['pages'],
            'totalWords': total_words
        }
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python extract-pdf.py <pdf-path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = Path(__file__).parent / 'extracted'
    output_dir.mkdir(exist_ok=True)

    result = process_pdf(pdf_path)

    # Save to JSON
    output_file = output_dir / f"{Path(pdf_path).stem}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved to: {output_file}\n")
