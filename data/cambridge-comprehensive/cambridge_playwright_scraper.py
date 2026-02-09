#!/usr/bin/env python3
"""
Cambridge Past Papers - Playwright Scraper
Handles JavaScript-heavy sites that regular HTTP requests can't access
"""

import asyncio
import logging
from pathlib import Path
from urllib.parse import urljoin, urlparse
import time
import sys

# Add content registry path
sys.path.append('/root/ankr-content-tracker')

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("❌ Playwright not installed. Run: pip install playwright && playwright install chromium")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/root/data/cambridge-comprehensive/playwright-download.log'),
        logging.StreamHandler()
    ]
)

class PlaywrightCambridgeScraper:
    def __init__(self, output_dir="/root/data/cambridge-comprehensive/igcse"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.downloaded_count = 0

        # Target subjects and years
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

    async def download_file(self, page, url, output_path):
        """Download a file using Playwright's download handler"""
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Navigate and download
            async with page.expect_download() as download_info:
                await page.goto(url, wait_until='networkidle', timeout=30000)

            download = await download_info.value
            await download.save_as(output_path)

            file_size = output_path.stat().st_size
            logging.info(f"✅ Downloaded: {output_path.name} ({file_size/1024:.1f} KB)")
            self.downloaded_count += 1
            return True

        except Exception as e:
            logging.debug(f"Failed to download {url}: {str(e)}")
            return False

    async def scrape_pastpapers_co_with_browser(self, page):
        """Scrape pastpapers.co with full browser rendering"""
        logging.info("🌐 Scraping pastpapers.co with Playwright")

        for code, subject in self.subjects.items():
            for year in self.years:
                urls_to_try = [
                    f"https://pastpapers.co/cie/{code}/{year}/",
                    f"https://pastpapers.co/cie/igcse/{code}/{year}/",
                ]

                for url in urls_to_try:
                    try:
                        logging.info(f"📚 {subject} ({code}) - {year}: {url}")

                        await page.goto(url, wait_until='networkidle', timeout=30000)
                        await page.wait_for_timeout(2000)  # Wait for dynamic content

                        # Find all PDF links
                        pdf_links = await page.eval_on_selector_all(
                            'a[href$=".pdf"]',
                            'elements => elements.map(e => e.href)'
                        )

                        if pdf_links:
                            logging.info(f"   Found {len(pdf_links)} PDF links")

                            subject_dir = self.output_dir / f"{code}-{subject}" / str(year)

                            for pdf_url in pdf_links[:10]:  # Limit to 10 per year
                                filename = Path(urlparse(pdf_url).path).name
                                output_path = subject_dir / filename

                                if not output_path.exists():
                                    try:
                                        # Direct download
                                        response = await page.request.get(pdf_url)
                                        if response.status == 200:
                                            content = await response.body()
                                            output_path.parent.mkdir(parents=True, exist_ok=True)
                                            output_path.write_bytes(content)
                                            logging.info(f"✅ Downloaded: {filename}")
                                            self.downloaded_count += 1
                                            await page.wait_for_timeout(1000)
                                    except Exception as e:
                                        logging.debug(f"Failed: {filename} - {e}")

                            break  # Found working URL pattern

                    except Exception as e:
                        logging.debug(f"URL failed: {url} - {str(e)}")
                        continue

                await page.wait_for_timeout(2000)  # Rate limiting

    async def scrape_gceguide_with_browser(self, page):
        """Try GCE Guide with browser rendering"""
        logging.info("🌐 Trying GCE Guide with Playwright")

        # Try different URL patterns
        base_urls = [
            "https://gceguide.com/papers/",
            "https://papers.gceguide.com/",
            "https://www.gceguide.com/",
        ]

        for base_url in base_urls:
            try:
                await page.goto(base_url, wait_until='domcontentloaded', timeout=30000)

                # Look for IGCSE links
                links = await page.eval_on_selector_all(
                    'a',
                    'elements => elements.map(e => ({ href: e.href, text: e.textContent }))'
                )

                igcse_links = [l for l in links if 'igcse' in l['text'].lower() or 'IGCSE' in l['href']]

                if igcse_links:
                    logging.info(f"   Found {len(igcse_links)} IGCSE links")
                    # Navigate to first IGCSE section
                    await page.goto(igcse_links[0]['href'], wait_until='networkidle')

                    # Find PDF links
                    pdf_links = await page.eval_on_selector_all(
                        'a[href*=".pdf"]',
                        'elements => elements.map(e => e.href)'
                    )

                    logging.info(f"   Found {len(pdf_links)} PDF links")

                    # Download first few as test
                    for pdf_url in pdf_links[:5]:
                        try:
                            response = await page.request.get(pdf_url)
                            if response.status == 200:
                                content = await response.body()
                                filename = Path(urlparse(pdf_url).path).name
                                output_path = self.output_dir / "gceguide" / filename
                                output_path.parent.mkdir(parents=True, exist_ok=True)
                                output_path.write_bytes(content)
                                logging.info(f"✅ Downloaded: {filename}")
                                self.downloaded_count += 1
                        except:
                            pass

                    return

            except Exception as e:
                logging.debug(f"GCE Guide URL {base_url} failed: {str(e)}")

    async def scrape_znotes_with_browser(self, page):
        """Scrape ZNotes with browser rendering"""
        logging.info("🌐 Scraping ZNotes with Playwright")

        for code, subject in self.subjects.items():
            try:
                # ZNotes subject pages
                subject_slug = subject.lower().replace(' ', '-')
                url = f"https://znotes.org/caie/igcse/{subject_slug}/"

                logging.info(f"📚 Checking {subject}: {url}")

                await page.goto(url, wait_until='networkidle', timeout=30000)
                await page.wait_for_timeout(2000)

                # Find download links (ZNotes has "Download" buttons)
                download_links = await page.eval_on_selector_all(
                    'a[href*=".pdf"], a:has-text("Download")',
                    'elements => elements.map(e => ({ href: e.href, text: e.textContent }))'
                )

                if download_links:
                    logging.info(f"   Found {len(download_links)} download links")

                    for link in download_links[:5]:  # Limit per subject
                        if '.pdf' in link['href']:
                            try:
                                response = await page.request.get(link['href'])
                                if response.status == 200:
                                    content = await response.body()
                                    filename = Path(urlparse(link['href']).path).name
                                    if not filename.endswith('.pdf'):
                                        filename = f"{subject_slug}-{code}.pdf"

                                    output_path = self.output_dir / f"{code}-{subject}" / "znotes" / filename
                                    output_path.parent.mkdir(parents=True, exist_ok=True)
                                    output_path.write_bytes(content)
                                    logging.info(f"✅ Downloaded: {filename}")
                                    self.downloaded_count += 1
                            except Exception as e:
                                logging.debug(f"Failed to download: {e}")

                await page.wait_for_timeout(2000)

            except Exception as e:
                logging.debug(f"ZNotes failed for {subject}: {str(e)}")

    async def try_alternative_sources(self, page):
        """Try additional alternative sources"""
        logging.info("🌐 Trying alternative sources")

        # Physics and Maths Tutor
        try:
            await page.goto("https://www.physicsandmathstutor.com/past-papers/igcse/",
                          wait_until='networkidle', timeout=30000)

            # Find subject links
            subject_links = await page.eval_on_selector_all(
                'a[href*="mathematics"], a[href*="physics"], a[href*="chemistry"]',
                'elements => elements.map(e => e.href)'
            )

            logging.info(f"   Found {len(subject_links)} subject links on PMT")

            # Visit first subject
            if subject_links:
                await page.goto(subject_links[0], wait_until='networkidle')
                pdf_links = await page.eval_on_selector_all(
                    'a[href$=".pdf"]',
                    'elements => elements.map(e => e.href)'
                )

                logging.info(f"   Found {len(pdf_links)} PDFs on PMT")

                for pdf_url in pdf_links[:3]:
                    try:
                        response = await page.request.get(pdf_url)
                        if response.status == 200:
                            content = await response.body()
                            filename = Path(urlparse(pdf_url).path).name
                            output_path = self.output_dir / "pmt" / filename
                            output_path.parent.mkdir(parents=True, exist_ok=True)
                            output_path.write_bytes(content)
                            logging.info(f"✅ Downloaded: {filename}")
                            self.downloaded_count += 1
                    except:
                        pass
        except Exception as e:
            logging.debug(f"PMT failed: {str(e)}")

    async def run(self):
        """Main scraping routine with Playwright"""
        logging.info("🚀 Cambridge Playwright Scraper Started")
        logging.info(f"📁 Output: {self.output_dir}")
        logging.info("=" * 60)

        start_time = time.time()

        async with async_playwright() as p:
            # Launch browser with stealth mode
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-blink-features=AutomationControlled']
            )

            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                viewport={'width': 1920, 'height': 1080}
            )

            page = await context.new_page()

            # Try each source
            try:
                await self.scrape_pastpapers_co_with_browser(page)
            except Exception as e:
                logging.error(f"PastPapers.co failed: {str(e)}")

            try:
                await self.scrape_gceguide_with_browser(page)
            except Exception as e:
                logging.error(f"GCE Guide failed: {str(e)}")

            try:
                await self.scrape_znotes_with_browser(page)
            except Exception as e:
                logging.error(f"ZNotes failed: {str(e)}")

            try:
                await self.try_alternative_sources(page)
            except Exception as e:
                logging.error(f"Alternative sources failed: {str(e)}")

            await browser.close()

        elapsed = time.time() - start_time

        logging.info("=" * 60)
        logging.info(f"✅ Playwright Scraping Complete!")
        logging.info(f"📊 Files downloaded: {self.downloaded_count}")
        logging.info(f"⏱️  Time: {elapsed/60:.1f} minutes")

        # Register in content tracker
        if self.downloaded_count > 0:
            try:
                from content_registry import ContentRegistry
                registry = ContentRegistry()
                registered = registry.scan_and_register_cambridge(str(self.output_dir))
                logging.info(f"📝 Registered {registered} files in content registry")
            except Exception as e:
                logging.warning(f"Registry update failed: {e}")

if __name__ == "__main__":
    scraper = PlaywrightCambridgeScraper()
    asyncio.run(scraper.run())
