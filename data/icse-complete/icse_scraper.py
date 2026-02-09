#!/usr/bin/env python3
"""
Comprehensive ICSE Content Scraper
Downloads content from multiple sources for Classes 9-12
"""

import os
import json
import requests
from pathlib import Path
from datetime import datetime
import time

BASE_DIR = Path("/root/data/icse-complete")

class ICSEScraper:
    def __init__(self):
        self.stats = {
            "downloaded": 0,
            "failed": 0,
            "skipped": 0,
            "total_size_mb": 0
        }

        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def download_file(self, url, filepath):
        """Download a file with progress tracking"""
        try:
            filepath.parent.mkdir(parents=True, exist_ok=True)

            if filepath.exists():
                print(f"   ⏭️  Skipped (exists): {filepath.name}")
                self.stats["skipped"] += 1
                return True

            print(f"   📥 Downloading: {filepath.name}")

            response = requests.get(url, headers=self.headers, stream=True, timeout=60)
            response.raise_for_status()

            total_size = int(response.headers.get('content-length', 0))

            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            size_mb = filepath.stat().st_size / (1024 * 1024)
            self.stats["total_size_mb"] += size_mb
            self.stats["downloaded"] += 1

            print(f"   ✅ Downloaded: {filepath.name} ({size_mb:.2f} MB)")
            return True

        except Exception as e:
            print(f"   ❌ Failed: {filepath.name} - {str(e)}")
            self.stats["failed"] += 1
            return False

    def scrape_official_cisce(self):
        """Download official CISCE syllabi and documents"""
        print("\n📚 Phase 1: Official CISCE Content")
        print("=" * 70)

        official_dir = BASE_DIR / "official" / "syllabus"
        official_dir.mkdir(parents=True, exist_ok=True)

        # Note: These URLs are examples - actual CISCE URLs may vary
        # You'll need to update with current year's URLs
        documents = [
            {
                "name": "ICSE_Regulations_2025.pdf",
                "url": "https://cisce.org/pdf/ICSE-Regulations-2025.pdf",
                "type": "regulation"
            },
            {
                "name": "ISC_Regulations_2025.pdf",
                "url": "https://cisce.org/pdf/ISC-Regulations-2025.pdf",
                "type": "regulation"
            }
        ]

        for doc in documents:
            filepath = official_dir / doc["name"]
            self.download_file(doc["url"], filepath)
            time.sleep(1)  # Rate limiting

    def scrape_sample_papers(self):
        """Download sample papers"""
        print("\n📝 Phase 2: Sample Papers")
        print("=" * 70)

        papers_dir = BASE_DIR / "sample-papers"
        papers_dir.mkdir(parents=True, exist_ok=True)

        print("   Sample papers require manual collection from:")
        print("   - CISCE official website")
        print("   - School exam portals")
        print("   - Educational platforms")

    def scrape_study_materials(self):
        """Index study materials from educational platforms"""
        print("\n📖 Phase 3: Study Materials Index")
        print("=" * 70)

        sources = {
            "Tiwari Academy": "https://www.tiwariacademy.com/icse-books/",
            "Vedantu": "https://www.vedantu.com/selina-solutions",
            "TopperLearning": "https://www.topperlearning.com/icse-textbook-solutions",
            "Meritnation": "https://www.meritnation.com/icse",
        }

        study_index = []

        for platform, url in sources.items():
            print(f"\n   📌 {platform}")
            print(f"      URL: {url}")
            print(f"      Status: Available for manual download")

            study_index.append({
                "platform": platform,
                "url": url,
                "classes": [9, 10, 11, 12],
                "free": True
            })

        # Save index
        index_path = BASE_DIR / "study_materials_index.json"
        with open(index_path, 'w') as f:
            json.dump(study_index, f, indent=2)

        print(f"\n   ✅ Index saved: {index_path}")

    def create_structure_guide(self):
        """Create a guide for ICSE content structure"""
        guide = {
            "classes": {
                "9": {
                    "board": "ICSE",
                    "subjects": [
                        "English Language", "English Literature",
                        "Hindi", "Mathematics",
                        "Physics", "Chemistry", "Biology",
                        "History & Civics", "Geography",
                        "Economics", "Commercial Studies",
                        "Computer Applications", "Physical Education"
                    ]
                },
                "10": {
                    "board": "ICSE",
                    "subjects": "Same as Class 9",
                    "note": "Board examination year"
                },
                "11": {
                    "board": "ISC",
                    "streams": {
                        "Science": ["Physics", "Chemistry", "Biology/Computer Science", "Mathematics", "English"],
                        "Commerce": ["Accounts", "Commerce", "Economics", "Mathematics/Computer Science", "English"],
                        "Humanities": ["History", "Political Science", "Sociology", "Psychology", "English"]
                    }
                },
                "12": {
                    "board": "ISC",
                    "note": "Board examination year - same subjects as Class 11"
                }
            },
            "content_types": [
                "Textbooks (Publisher: Selina, Concise, Frank, etc.)",
                "Sample Papers (CISCE official)",
                "Specimen Papers (Previous years)",
                "Syllabi (Subject-wise)",
                "Question Banks",
                "Study Notes",
                "Video Lectures (third-party)",
                "Interactive Content"
            ],
            "recommended_publishers": {
                "Mathematics": ["Selina", "ML Aggarwal", "RS Aggarwal"],
                "Science": ["Selina", "Concise"],
                "English": ["Treasure Trove"],
                "History/Civics": ["Frank"],
                "Geography": ["Frank", "Veena Bhargava"]
            }
        }

        guide_path = BASE_DIR / "ICSE_STRUCTURE_GUIDE.json"
        with open(guide_path, 'w') as f:
            json.dump(guide, f, indent=2)

        print(f"\n📋 Structure guide created: {guide_path}")

    def generate_download_list(self):
        """Generate a comprehensive download list for manual collection"""
        download_list = []

        # Classes and subjects
        config = {
            9: ["Mathematics", "Physics", "Chemistry", "Biology", "Geography", "History"],
            10: ["Mathematics", "Physics", "Chemistry", "Biology", "Geography", "History"],
            11: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Economics"],
            12: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Economics"]
        }

        for class_num, subjects in config.items():
            board = "ICSE" if class_num <= 10 else "ISC"
            for subject in subjects:
                download_list.append({
                    "class": class_num,
                    "board": board,
                    "subject": subject,
                    "items_needed": [
                        f"Selina {subject} Class {class_num} Solutions",
                        f"{board} {subject} Sample Papers {datetime.now().year}",
                        f"{subject} Syllabus {datetime.now().year}",
                        f"{subject} Previous Year Papers (last 3 years)"
                    ]
                })

        list_path = BASE_DIR / "DOWNLOAD_CHECKLIST.json"
        with open(list_path, 'w') as f:
            json.dump(download_list, f, indent=2)

        print(f"📝 Download checklist created: {list_path}")
        return download_list

    def run(self):
        """Main execution"""
        print("\n🚀 ICSE Comprehensive Scraper")
        print("=" * 70)
        print(f"Target: Classes 9-12 (ICSE 9-10, ISC 11-12)")
        print(f"Content: ALL subjects, ALL content types")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)

        # Create base directories
        BASE_DIR.mkdir(parents=True, exist_ok=True)

        # Execute scraping phases
        self.scrape_official_cisce()
        self.scrape_sample_papers()
        self.scrape_study_materials()
        self.create_structure_guide()
        download_list = self.generate_download_list()

        # Save statistics
        stats_path = BASE_DIR / "scraping_stats.json"
        self.stats["completed_at"] = datetime.now().isoformat()
        self.stats["download_checklist_items"] = len(download_list)

        with open(stats_path, 'w') as f:
            json.dump(self.stats, f, indent=2)

        # Summary
        print("\n" + "=" * 70)
        print("✅ ICSE Scraping Complete!")
        print("=" * 70)
        print(f"\n📊 Statistics:")
        print(f"   Downloaded: {self.stats['downloaded']}")
        print(f"   Failed: {self.stats['failed']}")
        print(f"   Skipped: {self.stats['skipped']}")
        print(f"   Total Size: {self.stats['total_size_mb']:.2f} MB")
        print(f"\n📁 Location: {BASE_DIR}")
        print(f"\n📋 Next Steps:")
        print(f"   1. Review: {BASE_DIR / 'ICSE_STRUCTURE_GUIDE.json'}")
        print(f"   2. Check: {BASE_DIR / 'DOWNLOAD_CHECKLIST.json'}")
        print(f"   3. Index: {BASE_DIR / 'study_materials_index.json'}")
        print()

if __name__ == "__main__":
    scraper = ICSEScraper()
    scraper.run()
