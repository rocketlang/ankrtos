#!/usr/bin/env python3
"""
Generate ALL Class 7 & 8 subjects in parallel
History, Geography, Civics, English
"""

from ncert_question_generator import NCERTQuestionGenerator
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/root/data/ncert-ai-generator/generation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    generator = NCERTQuestionGenerator()

    logger.info("🚀 Starting Parallel AI Generation - Class 7 & 8 All Subjects")
    logger.info("="*70)

    subjects = ['history', 'geography', 'civics', 'english']
    classes = [7, 8]

    total_generated = 0

    for class_num in classes:
        logger.info(f"\n{'#'*70}")
        logger.info(f"# CLASS {class_num} - Generating All Subjects")
        logger.info(f"{'#'*70}\n")

        for subject in subjects:
            try:
                questions = generator.generate_subject(
                    class_num,
                    subject,
                    questions_per_topic=6
                )
                if questions:
                    total_generated += len(questions)
                    logger.info(f"✅ Class {class_num} {subject.title()}: {len(questions)} questions\n")
            except Exception as e:
                logger.error(f"❌ Failed: Class {class_num} {subject} - {str(e)}\n")

    logger.info("\n" + "="*70)
    logger.info(f"🎉 GENERATION COMPLETE!")
    logger.info(f"📊 Total Questions Generated: {total_generated}")
    logger.info(f"📁 Output: /root/data/ncert-ai-generator/generated/")
    logger.info("="*70)

if __name__ == "__main__":
    main()
