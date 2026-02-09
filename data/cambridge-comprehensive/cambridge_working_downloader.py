#!/usr/bin/env python3
"""
Cambridge Past Papers Downloader - Working Sources
Uses actual working sources instead of broken GCE Guide links
"""

import requests
from bs4 import BeautifulSoup
import os
from pathlib import Path
import time
from urllib.parse import urljoin, urlparse
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/root/data/cambridge-comprehensive/working-download.log'),
        logging.StreamHandler()
    ]
)

class CambridgeDownloader:
    def __init__(self, output_dir="/root/data/cambridge-comprehensive/igcse"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        # Working sources for Cambridge IGCSE past papers
        self.sources = {
            "pastpapers.co": {
                "base_url": "https://pastpapers.co/cie",
                "enabled": True
            },
            "save_my_exams": {
                "base_url": "https://www.savemyexams.com/igcse",
                "enabled": False  # Requires registration
            },
            "znotes": {
                "base_url": "https://znotes.org/caie/igcse",
                "enabled": True
            }
        }

        # Priority subjects
        self.subjects = {
            "0580": "Mathematics",
            "0625": "Physics",
            "0620": "Chemistry",
            "0610": "Biology",
            "0478": "Computer Science",
            "0455": "Economics",
            "0450": "Business Studies"
        }

        self.years = [2024, 2023, 2022, 2021, 2020]
        self.downloaded_count = 0

    def download_file(self, url, output_path):
        """Download a file with retries"""
        try:
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()

            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            file_size = output_path.stat().st_size
            logging.info(f"✅ Downloaded: {output_path.name} ({file_size/1024:.1f} KB)")
            self.downloaded_count += 1
            return True

        except Exception as e:
            logging.error(f"❌ Failed to download {url}: {str(e)}")
            if output_path.exists():
                output_path.unlink()
            return False

    def download_from_pastpapers_co(self):
        """Download from pastpapers.co - most reliable free source"""
        logging.info("📥 Starting download from pastpapers.co")

        for code, subject in self.subjects.items():
            subject_dir = self.output_dir / f"{code}-{subject}"

            for year in self.years:
                logging.info(f"📚 {subject} ({code}) - Year {year}")

                # Try different URL patterns that might work
                urls_to_try = [
                    f"https://pastpapers.co/cie/{code}/{year}/",
                    f"https://pastpapers.co/cie/igcse/{code}/{year}/",
                ]

                for base_url in urls_to_try:
                    try:
                        response = self.session.get(base_url, timeout=15)
                        if response.status_code == 200:
                            soup = BeautifulSoup(response.content, 'html.parser')

                            # Find PDF links
                            pdf_links = []
                            for link in soup.find_all('a', href=True):
                                href = link['href']
                                if href.endswith('.pdf'):
                                    pdf_links.append(urljoin(base_url, href))

                            if pdf_links:
                                year_dir = subject_dir / str(year)
                                logging.info(f"   Found {len(pdf_links)} PDFs")

                                for pdf_url in pdf_links:
                                    filename = Path(urlparse(pdf_url).path).name
                                    output_path = year_dir / filename

                                    if not output_path.exists():
                                        self.download_file(pdf_url, output_path)
                                        time.sleep(1)  # Rate limiting

                                break  # Found working URL pattern

                    except Exception as e:
                        logging.debug(f"   URL {base_url} failed: {str(e)}")
                        continue

                time.sleep(2)  # Delay between years

    def download_from_znotes(self):
        """Download from ZNotes - has topical past papers"""
        logging.info("📥 Starting download from ZNotes")

        # ZNotes has a different structure - they organize by topic
        # We'll try to get their compiled past papers

        for code, subject in self.subjects.items():
            try:
                url = f"https://znotes.org/caie/igcse/{subject.lower().replace(' ', '-')}/{code}/"
                response = self.session.get(url, timeout=15)

                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')

                    # Look for download links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        if '.pdf' in href.lower():
                            pdf_url = urljoin(url, href)
                            filename = Path(urlparse(pdf_url).path).name

                            subject_dir = self.output_dir / f"{code}-{subject}" / "znotes"
                            output_path = subject_dir / filename

                            if not output_path.exists():
                                self.download_file(pdf_url, output_path)
                                time.sleep(1)

            except Exception as e:
                logging.error(f"❌ ZNotes failed for {subject}: {str(e)}")

            time.sleep(2)

    def download_sample_from_cambridge_org(self):
        """Download specimen papers directly from Cambridge Assessment"""
        logging.info("📥 Downloading specimen papers from cambridgeinternational.org")

        # Cambridge publishes specimen/sample papers officially
        # These are high-quality and freely available

        base_url = "https://www.cambridgeinternational.org"

        for code, subject in self.subjects.items():
            try:
                # Cambridge's official specimen papers
                url = f"{base_url}/programmes-and-qualifications/cambridge-igcse-{subject.lower().replace(' ', '-')}-{code}/"

                logging.info(f"📚 Checking {subject} specimen papers")

                response = self.session.get(url, timeout=15)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')

                    # Look for specimen/sample paper links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        text = link.get_text().lower()

                        if 'specimen' in text or 'sample' in text:
                            if '.pdf' in href.lower():
                                pdf_url = urljoin(base_url, href)
                                filename = Path(urlparse(pdf_url).path).name

                                subject_dir = self.output_dir / f"{code}-{subject}" / "specimen"
                                output_path = subject_dir / filename

                                if not output_path.exists():
                                    logging.info(f"   📄 Found specimen: {filename}")
                                    self.download_file(pdf_url, output_path)
                                    time.sleep(1)

            except Exception as e:
                logging.error(f"❌ Cambridge.org failed for {subject}: {str(e)}")

            time.sleep(2)

    def run(self):
        """Run the download process"""
        logging.info("🚀 Cambridge Working Downloader Started")
        logging.info(f"📁 Output directory: {self.output_dir}")
        logging.info("=" * 60)

        start_time = time.time()

        # Try each source
        if self.sources["pastpapers.co"]["enabled"]:
            self.download_from_pastpapers_co()

        if self.sources["znotes"]["enabled"]:
            self.download_from_znotes()

        # Always try to get official specimen papers
        self.download_sample_from_cambridge_org()

        elapsed = time.time() - start_time

        logging.info("=" * 60)
        logging.info(f"✅ Download Complete!")
        logging.info(f"📊 Total files downloaded: {self.downloaded_count}")
        logging.info(f"⏱️  Time taken: {elapsed/60:.1f} minutes")

        # Update content registry
        try:
            import sys
            sys.path.append('/root/ankr-content-tracker')
            from content_registry import ContentRegistry

            registry = ContentRegistry()
            registered = registry.scan_and_register_cambridge(str(self.output_dir))
            logging.info(f"📝 Registered {registered} files in content registry")
        except Exception as e:
            logging.warning(f"Could not update registry: {e}")

if __name__ == "__main__":
    downloader = CambridgeDownloader()
    downloader.run()
