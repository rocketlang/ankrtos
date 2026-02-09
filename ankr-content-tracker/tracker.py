#!/usr/bin/env python3
"""
ANKR Content Ingestion Tracker
Monitors: NCERT Processing, Cambridge Downloads, ICSE Scraping
Real-time dashboard with progress, ETAs, and statistics
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
import psutil

class ContentTracker:
    def __init__(self):
        self.db_connection = "postgresql://ankr:indrA@0612@localhost:5432/ankr_eon"

        # Task configurations
        self.tasks = {
            "ncert_processing": {
                "name": "NCERT Question Generation",
                "type": "processing",
                "total_items": 144,  # Total chapters across 16 books
                "log_file": "/root/ankr-labs-nx/apps/ankr-curriculum-backend/batch-processing.log",
                "pid_pattern": "node.*resume-processing",
                "started_at": "2026-02-09 12:00:00",
                "color": "\033[94m"  # Blue
            },
            "cambridge_download": {
                "name": "Cambridge IGCSE/A-Level Download",
                "type": "downloading",
                "total_items": 280,  # Estimated PDFs (7 subjects × 5 years × 8 papers)
                "log_file": "/root/data/cambridge-comprehensive/cambridge-download.log",
                "pid_pattern": "start_bulk_download",
                "data_dir": "/root/data/cambridge-comprehensive/igcse",
                "started_at": "2026-02-09 12:39:00",
                "color": "\033[92m"  # Green
            },
            "icse_scraping": {
                "name": "ICSE Content Collection",
                "type": "scraping",
                "total_items": 24,  # Download checklist items
                "log_file": "/root/data/icse-complete/icse-download.log",
                "data_dir": "/root/data/icse-complete",
                "started_at": "2026-02-09 12:21:00",
                "color": "\033[93m"  # Yellow
            }
        }

        self.reset = "\033[0m"
        self.bold = "\033[1m"

    def check_process_running(self, pattern):
        """Check if a process matching pattern is running"""
        try:
            result = subprocess.run(
                f"ps aux | grep '{pattern}' | grep -v grep",
                shell=True, capture_output=True, text=True
            )
            return len(result.stdout.strip()) > 0
        except:
            return False

    def get_database_stats(self):
        """Get current database statistics"""
        try:
            cmd = f"sudo -u postgres psql -d ankr_eon -t -c \"SELECT COUNT(*) FROM ankr_learning.courses;\""
            courses = int(subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip())

            cmd = f"sudo -u postgres psql -d ankr_eon -t -c \"SELECT COUNT(*) FROM ankr_learning.modules;\""
            modules = int(subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip())

            cmd = f"sudo -u postgres psql -d ankr_eon -t -c \"SELECT COUNT(*) FROM ankr_learning.questions;\""
            questions = int(subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip())

            return {
                "courses": courses,
                "modules": modules,
                "questions": questions
            }
        except Exception as e:
            return {"courses": 0, "modules": 0, "questions": 0, "error": str(e)}

    def get_ncert_progress(self):
        """Calculate NCERT processing progress"""
        stats = self.get_database_stats()

        # Read log to find completed chapters
        completed_chapters = 0
        current_book = "N/A"
        current_chapter = "N/A"

        try:
            log_file = self.tasks["ncert_processing"]["log_file"]
            if Path(log_file).exists():
                with open(log_file, 'r') as f:
                    content = f.read()

                # Count "Chapter complete" markers
                completed_chapters = content.count("✅ Chapter complete")

                # Find current book/chapter
                lines = content.split('\n')
                for line in reversed(lines[-100:]):  # Last 100 lines
                    if "📚 [" in line:
                        import re
                        match = re.search(r'📚 \[(\d+)/(\d+)\] (.*)', line)
                        if match:
                            current_book = f"{match.group(1)}/{match.group(2)} - {match.group(3)}"
                        break
                    elif "[" in line and ".pdf" in line:
                        match = re.search(r'\[(\d+)/(\d+)\] (.*\.pdf)', line)
                        if match:
                            current_chapter = f"{match.group(1)}/{match.group(2)} - {match.group(3)[:30]}"
        except Exception as e:
            pass

        total = self.tasks["ncert_processing"]["total_items"]
        percentage = min(100, (completed_chapters / total) * 100)

        # Calculate ETA
        elapsed_minutes = self.get_elapsed_minutes("ncert_processing")
        if completed_chapters > 0 and elapsed_minutes > 0:
            rate = completed_chapters / elapsed_minutes
            remaining = total - completed_chapters
            eta_minutes = remaining / rate if rate > 0 else 0
        else:
            eta_minutes = 0

        return {
            "status": "running" if self.check_process_running(self.tasks["ncert_processing"]["pid_pattern"]) else "stopped",
            "completed": completed_chapters,
            "total": total,
            "percentage": percentage,
            "current_book": current_book,
            "current_chapter": current_chapter,
            "questions_generated": stats["questions"],
            "courses_created": stats["courses"],
            "eta_minutes": eta_minutes
        }

    def get_cambridge_progress(self):
        """Calculate Cambridge download progress"""
        downloaded_files = 0
        total_size_mb = 0

        try:
            data_dir = self.tasks["cambridge_download"]["data_dir"]
            if Path(data_dir).exists():
                # Count PDF files
                result = subprocess.run(
                    f'find {data_dir} -name "*.pdf" | wc -l',
                    shell=True, capture_output=True, text=True
                )
                downloaded_files = int(result.stdout.strip())

                # Get total size
                result = subprocess.run(
                    f'du -sm {data_dir} 2>/dev/null | cut -f1',
                    shell=True, capture_output=True, text=True
                )
                total_size_mb = int(result.stdout.strip() or 0)
        except Exception as e:
            pass

        total = self.tasks["cambridge_download"]["total_items"]
        percentage = min(100, (downloaded_files / total) * 100)

        # Calculate ETA
        elapsed_minutes = self.get_elapsed_minutes("cambridge_download")
        if downloaded_files > 0 and elapsed_minutes > 0:
            rate = downloaded_files / elapsed_minutes
            remaining = total - downloaded_files
            eta_minutes = remaining / rate if rate > 0 else 0
        else:
            eta_minutes = 0

        return {
            "status": "running" if self.check_process_running(self.tasks["cambridge_download"]["pid_pattern"]) else "stopped",
            "completed": downloaded_files,
            "total": total,
            "percentage": percentage,
            "size_mb": total_size_mb,
            "eta_minutes": eta_minutes
        }

    def get_icse_progress(self):
        """Calculate ICSE scraping progress"""
        # ICSE is mostly manual, so track downloaded files
        downloaded_files = 0

        try:
            data_dir = self.tasks["icse_scraping"]["data_dir"]
            if Path(data_dir).exists():
                result = subprocess.run(
                    f'find {data_dir} -name "*.pdf" | wc -l',
                    shell=True, capture_output=True, text=True
                )
                downloaded_files = int(result.stdout.strip())
        except:
            pass

        total = self.tasks["icse_scraping"]["total_items"]
        percentage = min(100, (downloaded_files / total) * 100) if total > 0 else 0

        return {
            "status": "setup_complete",
            "completed": downloaded_files,
            "total": total,
            "percentage": percentage,
            "eta_minutes": 0
        }

    def get_elapsed_minutes(self, task_name):
        """Calculate elapsed time in minutes"""
        try:
            start_str = self.tasks[task_name]["started_at"]
            start_time = datetime.strptime(start_str, "%Y-%m-%d %H:%M:%S")
            elapsed = datetime.now() - start_time
            return elapsed.total_seconds() / 60
        except:
            return 0

    def format_eta(self, minutes):
        """Format ETA in human-readable format"""
        if minutes <= 0:
            return "N/A"
        elif minutes < 60:
            return f"{int(minutes)}m"
        else:
            hours = int(minutes / 60)
            mins = int(minutes % 60)
            return f"{hours}h {mins}m"

    def get_system_stats(self):
        """Get system resource usage"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "cpu": cpu_percent,
            "memory_percent": memory.percent,
            "memory_used_gb": memory.used / (1024**3),
            "memory_total_gb": memory.total / (1024**3),
            "disk_percent": disk.percent,
            "disk_used_gb": disk.used / (1024**3),
            "disk_total_gb": disk.total / (1024**3)
        }

    def draw_progress_bar(self, percentage, width=40):
        """Draw a progress bar"""
        filled = int(width * percentage / 100)
        bar = '█' * filled + '░' * (width - filled)
        return bar

    def display_dashboard(self):
        """Display the main dashboard"""
        # Clear screen
        os.system('clear')

        # Header
        print(f"\n{self.bold}╔════════════════════════════════════════════════════════════════════════╗{self.reset}")
        print(f"{self.bold}║     ANKR CONTENT INGESTION TRACKER - Real-time Dashboard              ║{self.reset}")
        print(f"{self.bold}╚════════════════════════════════════════════════════════════════════════╝{self.reset}")
        print(f"  Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        # Get all progress data
        ncert = self.get_ncert_progress()
        cambridge = self.get_cambridge_progress()
        icse = self.get_icse_progress()
        system = self.get_system_stats()

        # Task 1: NCERT Processing
        color = self.tasks["ncert_processing"]["color"]
        print(f"{color}{self.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")
        print(f"{color}📚 NCERT QUESTION GENERATION{self.reset}")
        print(f"{color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")

        status_icon = "🟢" if ncert["status"] == "running" else "🔴"
        print(f"  Status: {status_icon} {ncert['status'].upper()}")
        print(f"  Progress: {self.draw_progress_bar(ncert['percentage'])} {ncert['percentage']:.1f}%")
        print(f"  Completed: {ncert['completed']}/{ncert['total']} chapters")
        print(f"  Current Book: {ncert['current_book']}")
        print(f"  Current Chapter: {ncert['current_chapter']}")
        print(f"  Questions Generated: {ncert['questions_generated']:,}")
        print(f"  Courses Created: {ncert['courses_created']}")
        print(f"  ETA: {self.format_eta(ncert['eta_minutes'])}")

        # Task 2: Cambridge Download
        color = self.tasks["cambridge_download"]["color"]
        print(f"\n{color}{self.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")
        print(f"{color}📥 CAMBRIDGE IGCSE/A-LEVEL DOWNLOAD{self.reset}")
        print(f"{color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")

        status_icon = "🟢" if cambridge["status"] == "running" else "🔴"
        print(f"  Status: {status_icon} {cambridge['status'].upper()}")
        print(f"  Progress: {self.draw_progress_bar(cambridge['percentage'])} {cambridge['percentage']:.1f}%")
        print(f"  Downloaded: {cambridge['completed']}/{cambridge['total']} PDFs")
        print(f"  Total Size: {cambridge['size_mb']:.1f} MB")
        print(f"  ETA: {self.format_eta(cambridge['eta_minutes'])}")

        # Task 3: ICSE Scraping
        color = self.tasks["icse_scraping"]["color"]
        print(f"\n{color}{self.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")
        print(f"{color}🔍 ICSE CONTENT COLLECTION{self.reset}")
        print(f"{color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")

        status_icon = "⚙️"
        print(f"  Status: {status_icon} {icse['status'].upper().replace('_', ' ')}")
        print(f"  Progress: {self.draw_progress_bar(icse['percentage'])} {icse['percentage']:.1f}%")
        print(f"  Files: {icse['completed']}/{icse['total']} items")
        print(f"  Note: Manual downloads required (see documentation)")

        # System Resources
        print(f"\n{self.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")
        print(f"{self.bold}💻 SYSTEM RESOURCES{self.reset}")
        print(f"{self.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")
        print(f"  CPU: {self.draw_progress_bar(system['cpu'], 30)} {system['cpu']:.1f}%")
        print(f"  Memory: {self.draw_progress_bar(system['memory_percent'], 30)} {system['memory_percent']:.1f}% ({system['memory_used_gb']:.1f}/{system['memory_total_gb']:.1f} GB)")
        print(f"  Disk: {self.draw_progress_bar(system['disk_percent'], 30)} {system['disk_percent']:.1f}% ({system['disk_used_gb']:.1f}/{system['disk_total_gb']:.1f} GB)")

        # Overall Summary
        total_percentage = (ncert['percentage'] + cambridge['percentage'] + icse['percentage']) / 3
        print(f"\n{self.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")
        print(f"{self.bold}📊 OVERALL PROGRESS{self.reset}")
        print(f"{self.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{self.reset}")
        print(f"  Combined: {self.draw_progress_bar(total_percentage)} {total_percentage:.1f}%")
        print(f"  Active Tasks: {sum([1 if t['status'] == 'running' else 0 for t in [ncert, cambridge]])}/3")

        print(f"\n{self.bold}Press Ctrl+C to exit{self.reset}\n")

    def run_live(self, refresh_interval=5):
        """Run live dashboard with auto-refresh"""
        try:
            while True:
                self.display_dashboard()
                time.sleep(refresh_interval)
        except KeyboardInterrupt:
            print("\n\n✅ Dashboard closed.\n")

    def export_json(self, output_file):
        """Export current status as JSON"""
        data = {
            "timestamp": datetime.now().isoformat(),
            "ncert": self.get_ncert_progress(),
            "cambridge": self.get_cambridge_progress(),
            "icse": self.get_icse_progress(),
            "system": self.get_system_stats()
        }

        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)

        return data

if __name__ == "__main__":
    tracker = ContentTracker()

    if len(sys.argv) > 1:
        if sys.argv[1] == "--json":
            output = sys.argv[2] if len(sys.argv) > 2 else "/tmp/tracker-status.json"
            data = tracker.export_json(output)
            print(f"Status exported to: {output}")
        elif sys.argv[1] == "--once":
            tracker.display_dashboard()
        else:
            print("Usage:")
            print("  python3 tracker.py           # Live dashboard (default)")
            print("  python3 tracker.py --once    # Single snapshot")
            print("  python3 tracker.py --json [file]  # Export to JSON")
    else:
        # Default: Live dashboard
        tracker.run_live(refresh_interval=5)
