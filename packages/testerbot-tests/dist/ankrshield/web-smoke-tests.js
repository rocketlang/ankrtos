"use strict";
/**
 * ankrshield Web App - Smoke Tests
 * Quick tests to verify basic web functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ankrshieldWebSmokeTests = void 0;
exports.ankrshieldWebSmokeTests = [
    {
        id: 'ankrshield-web-001',
        name: 'Landing page loads',
        description: 'Verify the landing page loads successfully',
        type: 'smoke',
        app: 'ankrshield-web',
        tags: ['critical', 'web', 'landing'],
        timeout: 30000,
        fn: async (agent) => {
            // Page should already be loaded by setup()
            const isLoaded = await agent.isPageLoaded();
            if (!isLoaded) {
                throw new Error('Page did not load');
            }
            // Verify we're on the right page
            const url = await agent.getUrl();
            if (!url.includes('ankrshield') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
                console.warn(`Unexpected URL: ${url}`);
            }
            // Check for body element
            const bodyVisible = await agent.isElementVisible('body');
            if (!bodyVisible) {
                throw new Error('Body element not visible');
            }
        }
    },
    {
        id: 'ankrshield-web-002',
        name: 'Page title is set',
        description: 'Verify the page has a proper title',
        type: 'smoke',
        app: 'ankrshield-web',
        tags: ['seo', 'web'],
        fn: async (agent) => {
            const title = await agent.getTitle();
            if (!title || title.trim() === '') {
                throw new Error('Page title is empty');
            }
            if (title.toLowerCase().includes('react app')) {
                throw new Error(`Default React title found: ${title}`);
            }
            console.log(`Page title: ${title}`);
        }
    },
    {
        id: 'ankrshield-web-003',
        name: 'Navigation elements present',
        description: 'Verify navigation header/menu exists',
        type: 'smoke',
        app: 'ankrshield-web',
        tags: ['ui', 'navigation'],
        fn: async (agent) => {
            // Look for common navigation elements
            const selectors = [
                'nav',
                'header',
                '.nav',
                '.navbar',
                '.navigation',
                '[role="navigation"]'
            ];
            let found = false;
            for (const selector of selectors) {
                const visible = await agent.isElementVisible(selector);
                if (visible) {
                    found = true;
                    console.log(`Found navigation: ${selector}`);
                    break;
                }
            }
            if (!found) {
                // Not critical, just log warning
                console.warn('No navigation elements found');
            }
        }
    },
    {
        id: 'ankrshield-web-004',
        name: 'No console errors',
        description: 'Verify no JavaScript errors in browser console',
        type: 'smoke',
        app: 'ankrshield-web',
        tags: ['critical', 'stability'],
        fn: async (agent) => {
            // Wait a bit for page to fully load
            await agent.wait(2000);
            const errors = await agent.getConsoleErrors();
            // Filter out common non-critical errors
            const criticalErrors = errors.filter(err => !err.includes('DevTools') &&
                !err.includes('Warning') &&
                !err.includes('favicon') &&
                !err.includes('404'));
            if (criticalErrors.length > 0) {
                throw new Error(`Found ${criticalErrors.length} console errors:\n${criticalErrors.join('\n')}`);
            }
        }
    },
    {
        id: 'ankrshield-web-005',
        name: 'Images load correctly',
        description: 'Verify images on page load without errors',
        type: 'smoke',
        app: 'ankrshield-web',
        tags: ['ui', 'assets'],
        fn: async (agent) => {
            // Find all images
            const images = await agent.findElements('img');
            if (images.length === 0) {
                console.warn('No images found on page');
                return;
            }
            console.log(`Found ${images.length} images`);
            // Check if images are loaded (using naturalWidth)
            const brokenImages = await agent.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.filter(img => {
                    // Skip images that are intentionally hidden or lazy-loaded
                    if (img.style.display === 'none')
                        return false;
                    // Check if image is loaded
                    return img.complete && img.naturalWidth === 0;
                }).length;
            });
            if (brokenImages > 0) {
                throw new Error(`${brokenImages} out of ${images.length} images failed to load`);
            }
        }
    },
    {
        id: 'ankrshield-web-006',
        name: 'Links are valid',
        description: 'Verify main links on page are not broken',
        type: 'smoke',
        app: 'ankrshield-web',
        tags: ['navigation', 'seo'],
        fn: async (agent) => {
            // Find all links
            const links = await agent.findElements('a[href]');
            if (links.length === 0) {
                console.warn('No links found on page');
                return;
            }
            console.log(`Found ${links.length} links`);
            // Check for obviously broken links (javascript:void(0), #, empty)
            const brokenLinks = await agent.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a[href]'));
                return anchors.filter(a => {
                    const href = a.getAttribute('href') || '';
                    return href === '' ||
                        href === '#' ||
                        href === 'javascript:void(0)' ||
                        href === 'javascript:;';
                }).length;
            });
            if (brokenLinks > 0) {
                console.warn(`${brokenLinks} links have placeholder hrefs`);
            }
        }
    },
    {
        id: 'ankrshield-web-007',
        name: 'Page is responsive',
        description: 'Verify page layout adapts to different screen sizes',
        type: 'smoke',
        app: 'ankrshield-web',
        tags: ['responsive', 'ui'],
        fn: async (agent) => {
            // Test different viewport sizes
            const viewports = [
                { name: 'Mobile', width: 375, height: 667 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Desktop', width: 1920, height: 1080 }
            ];
            for (const viewport of viewports) {
                await agent.setViewport(viewport.width, viewport.height);
                await agent.wait(500); // Wait for reflow
                // Check if page is still visible
                const bodyVisible = await agent.isElementVisible('body');
                if (!bodyVisible) {
                    throw new Error(`Page not visible at ${viewport.name} size`);
                }
                console.log(`✓ ${viewport.name} (${viewport.width}x${viewport.height})`);
            }
        }
    }
];
//# sourceMappingURL=web-smoke-tests.js.map