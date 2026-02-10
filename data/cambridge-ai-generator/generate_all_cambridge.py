#!/usr/bin/env python3
"""
Generate ALL Cambridge IGCSE subjects
Physics, Chemistry, Biology, Computer Science, Economics, Business
"""

import sys
sys.path.insert(0, '/root/data/cambridge-ai-generator')

from cambridge_question_generator import CambridgeQuestionGenerator
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/root/data/cambridge-ai-generator/generation_all.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    generator = CambridgeQuestionGenerator()

    logger.info("🚀 Cambridge IGCSE - Generating All Subjects")
    logger.info("="*70)

    # Math already done, now do the rest
    subjects = [
        '0625_physics',
        '0620_chemistry',
        '0610_biology',
        '0478_computer_science',
        '0455_economics',
        '0450_business_studies'
    ]

    total_generated = 0

    for subject_code in subjects:
        try:
            logger.info(f"\n{'='*70}")
            questions = generator.generate_subject(
                subject_code,
                questions_per_topic=6  # 2 per difficulty × 3 difficulties
            )
            if questions:
                total_generated += len(questions)
                logger.info(f"✅ {subject_code}: {len(questions)} questions\n")
        except Exception as e:
            logger.error(f"❌ Failed: {subject_code} - {str(e)}\n")

    logger.info("\n" + "="*70)
    logger.info(f"🎉 CAMBRIDGE GENERATION COMPLETE!")
    logger.info(f"📊 Total Questions: {total_generated}")
    logger.info(f"📁 Output: /root/data/cambridge-ai-generator/generated/")
    logger.info("="*70)

if __name__ == "__main__":
    main()
