#!/usr/bin/env python3
"""
NCERT AI Question Generator
Generates CBSE/NCERT-style questions from curriculum using AI
"""

import json
import requests
from pathlib import Path
import logging
from typing import List, Dict
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class NCERTQuestionGenerator:
    def __init__(
        self,
        curriculum_path="/root/data/ncert-ai-generator/ncert_class_7_8_curriculum.json",
        output_dir="/root/data/ncert-ai-generator/generated",
        ai_proxy_url="http://localhost:4444"
    ):
        self.curriculum_path = Path(curriculum_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.ai_proxy_url = ai_proxy_url

        # Load curriculum
        with open(self.curriculum_path) as f:
            self.curriculum = json.load(f)

    def generate_question_prompt(self, class_num: int, subject_info: Dict, topic: Dict, difficulty: str) -> str:
        """Create a prompt for NCERT-style question generation"""

        prompt = f"""You are an expert CBSE/NCERT teacher creating assessment questions.

**Board:** CBSE (NCERT)
**Class:** {class_num}
**Subject:** {subject_info['subject']} - {subject_info['name']}
**Topic:** {topic['name']}
**Subtopics:** {', '.join(topic['subtopics'])}

**Learning Outcomes:**
{chr(10).join(f"- {lo}" for lo in topic['learning_outcomes'])}

**Question Requirements:**
- Difficulty: {difficulty}
- Style: CBSE/NCERT board examination standard
- Format: Clear, age-appropriate language for Class {class_num}
- Include: Detailed answer with mark allocation

**Difficulty Guidelines:**
"""

        if difficulty == "easy":
            prompt += """- Focus on recall and basic understanding
- Simple, direct questions
- 1-2 marks
- Example: Define, List, Name, Identify"""
        elif difficulty == "medium":
            prompt += """- Require application and explanation
- Connect concepts
- 3-4 marks
- Example: Explain, Describe, Compare, Differentiate"""
        else:  # hard
            prompt += """- Demand analysis and evaluation
- Multi-concept integration
- 5-6 marks
- Example: Analyze, Evaluate, Justify, Critically examine"""

        prompt += f"""

**Question Types for {subject_info['subject']}:**
"""

        if subject_info['subject'] in ['History', 'Geography', 'Civics']:
            prompt += """- Short answer (2-3 marks)
- Long answer (5-6 marks)
- Map-based questions
- Source-based questions"""
        elif subject_info['subject'] == 'English':
            prompt += """- Reading comprehension
- Grammar questions
- Writing tasks
- Literature questions"""
        else:
            prompt += """- Short answer
- Long answer
- Application-based"""

        prompt += """

Generate the question in this exact JSON format:
{
  "question": "The question text here",
  "marks": 3,
  "difficulty": "medium",
  "question_type": "short_answer",
  "topic": "Topic name",
  "answer": "Detailed model answer with key points",
  "marking_scheme": [
    {"point": "Key point 1", "marks": 1},
    {"point": "Key point 2", "marks": 1},
    {"point": "Key point 3", "marks": 1}
  ],
  "bloom_level": "Understanding",
  "hints": ["Hint 1 for students", "Hint 2"]
}

Generate ONE high-quality CBSE/NCERT-style question now:"""

        return prompt

    def call_ai(self, prompt: str) -> Dict:
        """Call AI proxy to generate question"""
        try:
            response = requests.post(
                f"{self.ai_proxy_url}/v1/chat/completions",
                json={
                    "model": "gpt-4",
                    "messages": [
                        {"role": "system", "content": "You are a CBSE/NCERT teacher. Always respond with valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1200
                },
                timeout=60
            )

            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']

                # Extract JSON
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()

                return json.loads(content)
            else:
                logger.error(f"AI API error: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"AI call failed: {str(e)}")
            return None

    def generate_questions_for_topic(
        self,
        class_num: int,
        subject_key: str,
        topic: Dict,
        count_per_difficulty: int = 2
    ) -> List[Dict]:
        """Generate questions for a specific topic"""

        subject_info = self.curriculum[f"class_{class_num}"][subject_key]
        questions = []

        logger.info(f"  📝 Topic: {topic['name']}")

        difficulties = ["easy", "medium", "hard"]

        for difficulty in difficulties:
            for i in range(count_per_difficulty):
                logger.info(f"    Generating {difficulty} question {i+1}...")

                prompt = self.generate_question_prompt(
                    class_num,
                    subject_info,
                    topic,
                    difficulty
                )

                question_data = self.call_ai(prompt)

                if question_data:
                    # Add metadata
                    question_data['class'] = class_num
                    question_data['board'] = 'CBSE'
                    question_data['subject'] = subject_info['subject']
                    question_data['book'] = subject_info['name']
                    question_data['topic_id'] = topic['id']

                    questions.append(question_data)
                    logger.info(f"    ✅ Generated ({len(questions)} total)")
                else:
                    logger.warning(f"    ❌ Failed")

                time.sleep(1)

        return questions

    def generate_subject(
        self,
        class_num: int,
        subject_key: str,
        questions_per_topic: int = 6
    ):
        """Generate questions for entire subject"""

        subject_info = self.curriculum[f"class_{class_num}"].get(subject_key)
        if not subject_info:
            logger.error(f"Subject {subject_key} not found for Class {class_num}")
            return

        logger.info(f"\n{'='*60}")
        logger.info(f"📚 Class {class_num} {subject_info['subject']} - {subject_info['name']}")
        logger.info(f"{'='*60}")

        all_questions = []

        for topic in subject_info['topics']:
            topic_questions = self.generate_questions_for_topic(
                class_num,
                subject_key,
                topic,
                count_per_difficulty=questions_per_topic // 3
            )
            all_questions.extend(topic_questions)

        # Save to file
        output_file = self.output_dir / f"class{class_num}_{subject_key}_questions.json"
        with open(output_file, 'w') as f:
            json.dump({
                'class': class_num,
                'subject': subject_info['subject'],
                'book': subject_info['name'],
                'board': 'CBSE',
                'total_questions': len(all_questions),
                'questions': all_questions
            }, f, indent=2)

        logger.info(f"\n✅ Generated {len(all_questions)} questions")
        logger.info(f"📁 Saved to: {output_file}")

        return all_questions

    def generate_all_class_7_8(self, questions_per_topic: int = 6):
        """Generate questions for all Class 7 & 8 subjects"""

        logger.info("🚀 NCERT AI Question Generator - Class 7 & 8")
        logger.info(f"📁 Output: {self.output_dir}")
        logger.info(f"🤖 AI Proxy: {self.ai_proxy_url}")

        subjects = ['history', 'geography', 'civics', 'english']
        total_generated = 0

        for class_num in [7, 8]:
            for subject in subjects:
                questions = self.generate_subject(class_num, subject, questions_per_topic)
                if questions:
                    total_generated += len(questions)

        logger.info("\n" + "="*60)
        logger.info(f"🎉 COMPLETE: Generated {total_generated} total questions")
        logger.info("="*60)

if __name__ == "__main__":
    generator = NCERTQuestionGenerator()

    # Start with Class 7 History as pilot
    generator.generate_subject(7, "history", questions_per_topic=6)
