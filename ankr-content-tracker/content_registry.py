#!/usr/bin/env python3
"""
Content Registry - Tracks processed content to avoid duplication
Maintains a database of:
- NCERT chapters processed
- Cambridge papers downloaded
- ICSE materials collected
"""

import json
import hashlib
from pathlib import Path
from datetime import datetime
import sqlite3

class ContentRegistry:
    def __init__(self, db_path="/root/ankr-content-tracker/content_registry.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize SQLite database for tracking"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        # NCERT processing table
        c.execute('''
            CREATE TABLE IF NOT EXISTS ncert_processed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board TEXT NOT NULL,
                class TEXT NOT NULL,
                subject TEXT NOT NULL,
                book_code TEXT NOT NULL,
                chapter_file TEXT NOT NULL,
                file_hash TEXT UNIQUE NOT NULL,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                questions_generated INTEGER DEFAULT 0,
                status TEXT DEFAULT 'completed',
                UNIQUE(board, class, subject, book_code, chapter_file)
            )
        ''')

        # Cambridge downloads table
        c.execute('''
            CREATE TABLE IF NOT EXISTS cambridge_downloaded (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT NOT NULL,
                subject_code TEXT NOT NULL,
                subject_name TEXT NOT NULL,
                year INTEGER NOT NULL,
                paper_type TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_hash TEXT UNIQUE NOT NULL,
                downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                file_size_bytes INTEGER,
                status TEXT DEFAULT 'downloaded',
                UNIQUE(level, subject_code, year, filename)
            )
        ''')

        # ICSE collection table
        c.execute('''
            CREATE TABLE IF NOT EXISTS icse_collected (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board TEXT NOT NULL,
                class TEXT NOT NULL,
                subject TEXT NOT NULL,
                content_type TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_hash TEXT UNIQUE,
                collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source TEXT,
                status TEXT DEFAULT 'collected',
                UNIQUE(board, class, subject, content_type, filename)
            )
        ''')

        # Processing queue table
        c.execute('''
            CREATE TABLE IF NOT EXISTS processing_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                file_path TEXT NOT NULL,
                priority INTEGER DEFAULT 5,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed BOOLEAN DEFAULT 0,
                UNIQUE(source, file_path)
            )
        ''')

        conn.commit()
        conn.close()

    def calculate_file_hash(self, filepath):
        """Calculate SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        try:
            with open(filepath, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except Exception as e:
            return None

    def mark_ncert_processed(self, board, class_num, subject, book_code, chapter_file, file_path, questions=0):
        """Mark an NCERT chapter as processed"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        file_hash = self.calculate_file_hash(file_path) if Path(file_path).exists() else None

        try:
            c.execute('''
                INSERT OR REPLACE INTO ncert_processed
                (board, class, subject, book_code, chapter_file, file_hash, questions_generated, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (board, class_num, subject, book_code, chapter_file, file_hash, questions, 'completed'))

            conn.commit()
            return True
        except Exception as e:
            print(f"Error marking NCERT processed: {e}")
            return False
        finally:
            conn.close()

    def is_ncert_processed(self, board, class_num, subject, book_code, chapter_file):
        """Check if NCERT chapter already processed"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''
            SELECT id FROM ncert_processed
            WHERE board=? AND class=? AND subject=? AND book_code=? AND chapter_file=?
        ''', (board, class_num, subject, book_code, chapter_file))

        result = c.fetchone()
        conn.close()

        return result is not None

    def mark_cambridge_downloaded(self, level, subject_code, subject_name, year, paper_type, filename, file_path):
        """Mark a Cambridge paper as downloaded"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        file_hash = self.calculate_file_hash(file_path) if Path(file_path).exists() else None
        file_size = Path(file_path).stat().st_size if Path(file_path).exists() else 0

        try:
            c.execute('''
                INSERT OR REPLACE INTO cambridge_downloaded
                (level, subject_code, subject_name, year, paper_type, filename, file_hash, file_size_bytes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (level, subject_code, subject_name, year, paper_type, filename, file_hash, file_size, 'downloaded'))

            conn.commit()
            return True
        except Exception as e:
            print(f"Error marking Cambridge downloaded: {e}")
            return False
        finally:
            conn.close()

    def is_cambridge_downloaded(self, level, subject_code, year, filename):
        """Check if Cambridge paper already downloaded"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''
            SELECT id FROM cambridge_downloaded
            WHERE level=? AND subject_code=? AND year=? AND filename=?
        ''', (level, subject_code, year, filename))

        result = c.fetchone()
        conn.close()

        return result is not None

    def mark_icse_collected(self, board, class_num, subject, content_type, filename, file_path, source="manual"):
        """Mark ICSE content as collected"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        file_hash = self.calculate_file_hash(file_path) if Path(file_path).exists() else None

        try:
            c.execute('''
                INSERT OR REPLACE INTO icse_collected
                (board, class, subject, content_type, filename, file_hash, source, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (board, class_num, subject, content_type, filename, file_hash, source, 'collected'))

            conn.commit()
            return True
        except Exception as e:
            print(f"Error marking ICSE collected: {e}")
            return False
        finally:
            conn.close()

    def get_ncert_stats(self):
        """Get NCERT processing statistics"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('SELECT COUNT(*), SUM(questions_generated) FROM ncert_processed')
        result = c.fetchone()
        conn.close()

        return {
            "chapters_processed": result[0] or 0,
            "total_questions": result[1] or 0
        }

    def get_cambridge_stats(self):
        """Get Cambridge download statistics"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('SELECT COUNT(*), SUM(file_size_bytes) FROM cambridge_downloaded')
        result = c.fetchone()
        conn.close()

        return {
            "files_downloaded": result[0] or 0,
            "total_size_bytes": result[1] or 0
        }

    def get_icse_stats(self):
        """Get ICSE collection statistics"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('SELECT COUNT(*) FROM icse_collected')
        result = c.fetchone()
        conn.close()

        return {
            "files_collected": result[0] or 0
        }

    def export_manifest(self, output_file):
        """Export complete manifest of all content"""
        manifest = {
            "generated_at": datetime.now().isoformat(),
            "ncert": self.get_ncert_stats(),
            "cambridge": self.get_cambridge_stats(),
            "icse": self.get_icse_stats()
        }

        with open(output_file, 'w') as f:
            json.dump(manifest, f, indent=2)

        return manifest

    def scan_and_register_ncert(self, base_dir="/root/data/ncert-complete/extracted"):
        """Scan NCERT directory and register all files"""
        registered = 0

        for class_dir in Path(base_dir).glob("class_*"):
            class_num = class_dir.name.replace("class_", "")

            for book_dir in class_dir.iterdir():
                if book_dir.is_dir():
                    book_code = book_dir.name

                    for pdf_file in book_dir.glob("*.pdf"):
                        # Extract subject from directory structure
                        subject = book_code[:4]  # Simplified

                        if not self.is_ncert_processed("CBSE", class_num, subject, book_code, pdf_file.name):
                            self.mark_ncert_processed(
                                "CBSE", class_num, subject, book_code,
                                pdf_file.name, str(pdf_file), questions=0
                            )
                            registered += 1

        return registered

    def scan_and_register_cambridge(self, base_dir="/root/data/cambridge-comprehensive/igcse"):
        """Scan Cambridge directory and register all files"""
        registered = 0

        for pdf_file in Path(base_dir).rglob("*.pdf"):
            # Extract metadata from path
            parts = pdf_file.parts
            try:
                # Example: .../igcse/past-papers/0580-Mathematics/2024/filename.pdf
                subject_code = parts[-3].split('-')[0] if '-' in parts[-3] else "unknown"
                year = int(parts[-2]) if parts[-2].isdigit() else 0

                if not self.is_cambridge_downloaded("IGCSE", subject_code, year, pdf_file.name):
                    self.mark_cambridge_downloaded(
                        "IGCSE", subject_code, parts[-3], year,
                        "past_paper", pdf_file.name, str(pdf_file)
                    )
                    registered += 1
            except:
                pass

        return registered

if __name__ == "__main__":
    import sys

    registry = ContentRegistry()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "scan":
            print("Scanning directories and registering content...")
            ncert_count = registry.scan_and_register_ncert()
            cambridge_count = registry.scan_and_register_cambridge()
            print(f"Registered {ncert_count} NCERT files")
            print(f"Registered {cambridge_count} Cambridge files")

        elif command == "stats":
            ncert = registry.get_ncert_stats()
            cambridge = registry.get_cambridge_stats()
            icse = registry.get_icse_stats()

            print("\n📊 Content Registry Statistics")
            print("=" * 50)
            print(f"NCERT:")
            print(f"  Chapters: {ncert['chapters_processed']}")
            print(f"  Questions: {ncert['total_questions']}")
            print(f"\nCambridge:")
            print(f"  Files: {cambridge['files_downloaded']}")
            print(f"  Size: {cambridge['total_size_bytes'] / (1024*1024):.1f} MB")
            print(f"\nICSE:")
            print(f"  Files: {icse['files_collected']}")

        elif command == "export":
            output = sys.argv[2] if len(sys.argv) > 2 else "content_manifest.json"
            registry.export_manifest(output)
            print(f"Manifest exported to: {output}")

    else:
        print("Content Registry - Track processed content")
        print("\nUsage:")
        print("  python3 content_registry.py scan       # Scan and register all files")
        print("  python3 content_registry.py stats      # Show statistics")
        print("  python3 content_registry.py export [file]  # Export manifest")
