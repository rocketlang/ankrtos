#!/usr/bin/env python3
"""
Cambridge Syllabus Fetcher
Downloads official syllabi from Cambridge International website
"""

import requests
from pathlib import Path
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CambridgeSyllabusFetcher:
    def __init__(self, output_dir="/root/data/cambridge-ai-generator/syllabi"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Official Cambridge International syllabus codes and direct PDF URLs
        # These are publicly available specimen/syllabus documents
        self.syllabi = {
            "igcse": {
                "0580": {
                    "name": "Mathematics",
                    "url": "https://www.cambridgeinternational.org/Images/597437-2023-2025-syllabus.pdf",
                    "years": "2023-2025"
                },
                "0625": {
                    "name": "Physics",
                    "url": "https://www.cambridgeinternational.org/Images/595567-2023-2025-syllabus.pdf",
                    "years": "2023-2025"
                },
                "0620": {
                    "name": "Chemistry",
                    "url": "https://www.cambridgeinternational.org/Images/595559-2023-2025-syllabus.pdf",
                    "years": "2023-2025"
                },
                "0610": {
                    "name": "Biology",
                    "url": "https://www.cambridgeinternational.org/Images/554986-2023-2025-syllabus.pdf",
                    "years": "2023-2025"
                },
                "0478": {
                    "name": "Computer Science",
                    "url": "https://www.cambridgeinternational.org/Images/554985-2023-2025-syllabus.pdf",
                    "years": "2023-2025"
                },
                "0455": {
                    "name": "Economics",
                    "url": "https://www.cambridgeinternational.org/Images/554983-2023-2025-syllabus.pdf",
                    "years": "2023-2025"
                },
                "0450": {
                    "name": "Business Studies",
                    "url": "https://www.cambridgeinternational.org/Images/554982-2023-2025-syllabus.pdf",
                    "years": "2023-2025"
                }
            }
        }

    def download_syllabus(self, code, subject_info):
        """Download a syllabus PDF"""
        filename = f"{code}_{subject_info['name'].replace(' ', '_')}_{subject_info['years']}.pdf"
        output_path = self.output_dir / filename

        if output_path.exists():
            logger.info(f"✅ Already exists: {filename}")
            return output_path

        try:
            logger.info(f"📥 Downloading {subject_info['name']} ({code})...")

            response = requests.get(
                subject_info['url'],
                headers={'User-Agent': 'Mozilla/5.0'},
                timeout=30
            )

            if response.status_code == 200:
                output_path.write_bytes(response.content)
                size = output_path.stat().st_size / 1024
                logger.info(f"✅ Downloaded: {filename} ({size:.1f} KB)")
                return output_path
            else:
                logger.error(f"❌ Failed: {filename} (HTTP {response.status_code})")
                return None

        except Exception as e:
            logger.error(f"❌ Error downloading {filename}: {str(e)}")
            return None

    def fetch_all(self):
        """Download all syllabi"""
        logger.info("🚀 Cambridge Syllabus Fetcher Started")
        logger.info(f"📁 Output: {self.output_dir}")
        logger.info("=" * 60)

        downloaded = []

        for level, subjects in self.syllabi.items():
            logger.info(f"\n📚 {level.upper()} Syllabi:")

            for code, info in subjects.items():
                result = self.download_syllabus(code, info)
                if result:
                    downloaded.append(result)
                time.sleep(1)  # Rate limiting

        logger.info("=" * 60)
        logger.info(f"✅ Downloaded {len(downloaded)} syllabi")
        logger.info(f"📊 Total subjects: {len(self.syllabi['igcse'])}")

        return downloaded

if __name__ == "__main__":
    fetcher = CambridgeSyllabusFetcher()
    fetcher.fetch_all()
