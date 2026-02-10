#!/usr/bin/env python3
"""
Cambridge AI Question Generator
Generates Cambridge-style questions from syllabus topics using AI
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

class CambridgeQuestionGenerator:
    def __init__(
        self,
        curriculum_path="/root/data/cambridge-ai-generator/config/cambridge_curriculum.json",
        output_dir="/root/data/cambridge-ai-generator/generated",
        ai_proxy_url="http://localhost:4444"
    ):
        self.curriculum_path = Path(curriculum_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.ai_proxy_url = ai_proxy_url

        # Load curriculum
        with open(self.curriculum_path) as f:
            self.curriculum = json.load(f)

        self.generated_questions = []

    def generate_question_prompt(self, subject_info: Dict, topic: Dict, question_type: str, difficulty: str) -> str:
        """Create a prompt for question generation"""

        prompt = f"""You are an expert Cambridge IGCSE examiner creating assessment questions.

**Subject:** {subject_info['name']} ({subject_info['code']})
**Topic:** {topic['name']}
**Subtopics:** {', '.join(topic['subtopics'])}

**Learning Outcomes:**
{chr(10).join(f"- {lo}" for lo in topic['learning_outcomes'])}

**Assessment Objectives:**
{chr(10).join(f"- {ao}" for ao in subject_info['assessment_objectives'])}

**Question Requirements:**
- Type: {question_type}
- Difficulty: {difficulty}
- Style: Cambridge IGCSE examination standard
- Include: Clear marking scheme with point allocation
- Format: Professional, precise language

**Question Type Guidelines:**
"""

        if question_type == "multiple_choice":
            prompt += """
Create a multiple-choice question with:
- One clear stem/question
- Four options (A, B, C, D)
- Only ONE correct answer
- Plausible distractors based on common misconceptions
- Mark scheme showing correct answer and brief explanation
"""
        elif question_type == "short_answer":
            prompt += """
Create a short answer question that:
- Tests specific knowledge or single concept
- Requires 1-3 sentences or a brief calculation
- Awards 2-4 marks
- Has clear, objective marking criteria
"""
        elif question_type == "structured":
            prompt += """
Create a structured question with:
- Multiple parts (a, b, c) building on each other
- Progressive difficulty
- Total marks: 6-10
- Mix of recall, application, and analysis
- Clear marking scheme for each part
"""
        else:  # extended
            prompt += """
Create an extended response question that:
- Requires analysis, synthesis, or evaluation
- Tests deep understanding
- Awards 8-12 marks
- Includes levels-based marking scheme
- May involve calculations, explanations, and reasoning
"""

        prompt += f"""

**Difficulty Level: {difficulty}**
"""
        if difficulty == "easy":
            prompt += "- Focus on recall and basic application\n- Straightforward context\n- Single-step or two-step process"
        elif difficulty == "medium":
            prompt += "- Require application and some analysis\n- May need connecting multiple concepts\n- Multi-step solutions"
        else:  # hard
            prompt += "- Demand synthesis and evaluation\n- Complex, unfamiliar contexts\n- Require strategic thinking"

        prompt += """

Generate the question in this exact JSON format:
{
  "question": "The question text here (use \\n for line breaks if multi-part)",
  "marks": 6,
  "question_type": "structured",
  "difficulty": "medium",
  "topic": "Topic name",
  "subtopic": "Specific subtopic",
  "answer": "Model answer or calculation steps",
  "mark_scheme": [
    {"point": "First marking point", "marks": 2},
    {"point": "Second marking point", "marks": 2},
    {"point": "Third marking point", "marks": 2}
  ],
  "assessment_objective": "AO2",
  "common_errors": ["Error 1", "Error 2"]
}

Generate ONE high-quality question now:"""

        return prompt

    def call_ai(self, prompt: str) -> Dict:
        """Call AI proxy to generate question"""
        try:
            response = requests.post(
                f"{self.ai_proxy_url}/v1/chat/completions",
                json={
                    "model": "gpt-4",  # AI proxy will route
                    "messages": [
                        {"role": "system", "content": "You are a Cambridge IGCSE examiner. Always respond with valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500
                },
                timeout=60
            )

            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']

                # Extract JSON from response (handle markdown code blocks)
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
        subject_code: str,
        topic: Dict,
        count_per_difficulty: int = 2
    ) -> List[Dict]:
        """Generate questions for a specific topic"""

        subject_info = self.curriculum['igcse'][subject_code]
        questions = []

        logger.info(f"  📝 Topic: {topic['name']}")

        difficulties = ["easy", "medium", "hard"]
        question_types = ["short_answer", "structured", "multiple_choice"]

        for difficulty in difficulties:
            for i in range(count_per_difficulty):
                # Rotate through question types
                qtype = question_types[i % len(question_types)]

                logger.info(f"    Generating {difficulty} {qtype} question...")

                prompt = self.generate_question_prompt(
                    subject_info,
                    topic,
                    qtype,
                    difficulty
                )

                question_data = self.call_ai(prompt)

                if question_data:
                    # Add metadata
                    question_data['subject_code'] = subject_code
                    question_data['subject_name'] = subject_info['name']
                    question_data['level'] = subject_info['level']
                    question_data['topic_id'] = topic['id']

                    questions.append(question_data)
                    logger.info(f"    ✅ Generated ({len(questions)} total)")
                else:
                    logger.warning(f"    ❌ Failed to generate question")

                time.sleep(1)  # Rate limiting

        return questions

    def generate_subject(self, subject_code: str, questions_per_topic: int = 6):
        """Generate questions for entire subject"""

        subject_info = self.curriculum['igcse'].get(subject_code)
        if not subject_info:
            logger.error(f"Subject {subject_code} not found")
            return

        logger.info(f"\n{'='*60}")
        logger.info(f"📚 Generating: {subject_info['name']} ({subject_code})")
        logger.info(f"{'='*60}")

        all_questions = []

        for topic in subject_info['topics']:
            topic_questions = self.generate_questions_for_topic(
                subject_code,
                topic,
                count_per_difficulty=questions_per_topic // 3
            )
            all_questions.extend(topic_questions)

        # Save to file
        output_file = self.output_dir / f"{subject_code}_{subject_info['name'].replace(' ', '_')}_questions.json"
        with open(output_file, 'w') as f:
            json.dump({
                'subject': subject_info['name'],
                'code': subject_code,
                'level': subject_info['level'],
                'total_questions': len(all_questions),
                'questions': all_questions
            }, f, indent=2)

        logger.info(f"\n✅ Generated {len(all_questions)} questions")
        logger.info(f"📁 Saved to: {output_file}")

        return all_questions

    def generate_all(self, questions_per_topic: int = 6):
        """Generate questions for all subjects"""

        logger.info("🚀 Cambridge AI Question Generator Started")
        logger.info(f"📁 Output: {self.output_dir}")
        logger.info(f"🤖 AI Proxy: {self.ai_proxy_url}")

        total_generated = 0

        for subject_code in self.curriculum['igcse'].keys():
            questions = self.generate_subject(subject_code, questions_per_topic)
            if questions:
                total_generated += len(questions)

        logger.info("\n" + "="*60)
        logger.info(f"🎉 COMPLETE: Generated {total_generated} total questions")
        logger.info("="*60)

if __name__ == "__main__":
    generator = CambridgeQuestionGenerator()

    # Start with Mathematics (0580) as pilot
    generator.generate_subject("0580_mathematics", questions_per_topic=6)
