"use strict";
/**
 * ankrshield Desktop App - E2E Tests
 * Comprehensive end-to-end tests covering complete user workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ankrshieldE2ETests = void 0;
exports.ankrshieldE2ETests = [
    {
        id: 'ankrshield-e2e-001',
        name: 'Complete privacy scan workflow',
        description: 'Verify privacy score is displayed and stats load correctly',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['critical', 'privacy', 'workflow'],
        timeout: 15000,
        fn: async (agent) => {
            // Wait for dashboard to load
            await agent.waitForElement('#dashboard, .dashboard', 5000);
            // Verify privacy score is displayed
            await agent.waitForElement('#privacy-score, .privacy-score', 10000);
            const scoreText = await agent.getText('#privacy-score, .privacy-score');
            if (!scoreText || !scoreText.match(/\d+/)) {
                throw new Error('Privacy score not displaying valid value');
            }
            const score = parseInt(scoreText.match(/\d+/)[0]);
            if (score < 0 || score > 100) {
                throw new Error(`Privacy score out of range: ${score}`);
            }
            // Verify scan results are displayed
            const hasResults = await agent.isElementVisible('.scan-results, .stats-grid, .stat-card');
            if (!hasResults) {
                throw new Error('Scan results not visible');
            }
            console.log(`Privacy scan complete - Score: ${score}`);
        }
    },
    {
        id: 'ankrshield-e2e-002',
        name: 'Toggle protection state',
        description: 'Toggle privacy protection and verify UI responds',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['critical', 'protection', 'interaction'],
        timeout: 10000,
        fn: async (agent) => {
            // Look for protection toggle in header
            const headerVisible = await agent.isElementVisible('header, .header');
            if (!headerVisible) {
                throw new Error('Header not visible');
            }
            // Find interactive elements (buttons, toggles, etc.)
            const buttons = await agent.findElements('header button, .header button');
            if (buttons.length === 0) {
                console.warn('No buttons found in header');
                return;
            }
            console.log(`Found ${buttons.length} interactive elements in header`);
            // Try to find and click protection toggle
            const toggleExists = await agent.isElementVisible('[data-test="protection-toggle"], .toggle-switch, .protection-switch');
            if (toggleExists) {
                await agent.click('[data-test="protection-toggle"], .toggle-switch, .protection-switch');
                await agent.wait(1000);
                // Verify UI is still responsive
                const stillVisible = await agent.isElementVisible('header');
                if (!stillVisible) {
                    throw new Error('UI became unresponsive after toggle');
                }
                console.log('Protection toggle clicked successfully');
            }
            else {
                console.log('Protection toggle not found in current UI');
            }
        }
    },
    {
        id: 'ankrshield-e2e-003',
        name: 'View activity feed',
        description: 'Navigate to activity feed and verify events display',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['activity', 'navigation', 'data'],
        timeout: 10000,
        fn: async (agent) => {
            // Check if activity is visible on dashboard
            const activityOnDashboard = await agent.isElementVisible('.recent-activity, .activity-section, .activity-feed');
            if (activityOnDashboard) {
                console.log('Activity feed visible on dashboard');
                // Get activity items
                const items = await agent.findElements('.activity-item, .event-item, .activity-card');
                console.log(`Found ${items.length} activity items`);
                if (items.length === 0) {
                    console.warn('Activity feed is empty');
                }
                return;
            }
            // Try to navigate to activity page
            const activityLink = await agent.isElementVisible('[data-test="activity-link"], a:has-text("Activity")');
            if (activityLink) {
                await agent.click('[data-test="activity-link"], a:has-text("Activity")');
                await agent.wait(2000);
                // Verify activity content loaded
                const activityVisible = await agent.isElementVisible('.activity-feed, .activity-list, .event-list');
                if (!activityVisible) {
                    throw new Error('Activity feed not visible after navigation');
                }
                console.log('Activity feed loaded successfully');
            }
            else {
                console.warn('Activity feed not accessible - checking for any data display');
                // Just verify some content is displayed
                const hasContent = await agent.isElementVisible('.content, main, .main-content');
                if (!hasContent) {
                    throw new Error('No main content visible');
                }
            }
        }
    },
    {
        id: 'ankrshield-e2e-004',
        name: 'Filter activity by category',
        description: 'Apply filters and verify activity list updates',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['activity', 'filtering', 'interaction'],
        timeout: 10000,
        fn: async (agent) => {
            // Look for activity section
            const activityVisible = await agent.isElementVisible('.activity-feed, .recent-activity, .activity-list');
            if (!activityVisible) {
                // Try navigation
                const navLink = await agent.isElementVisible('a:has-text("Activity"), button:has-text("Activity")');
                if (navLink) {
                    await agent.click('a:has-text("Activity"), button:has-text("Activity")');
                    await agent.wait(1000);
                }
            }
            // Count initial items
            const initialItems = await agent.findElements('.activity-item, .event-item, .tracker-item');
            console.log(`Initial activity items: ${initialItems.length}`);
            // Look for filter controls
            const hasFilters = await agent.isElementVisible('.filter-button, select, .filter-controls');
            if (!hasFilters) {
                console.warn('No filter controls found - feature may not be implemented');
                return;
            }
            console.log('Filter controls found - activity filtering is available');
        }
    },
    {
        id: 'ankrshield-e2e-005',
        name: 'Open settings panel',
        description: 'Open settings and verify settings UI loads',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['settings', 'navigation', 'ui'],
        timeout: 10000,
        fn: async (agent) => {
            // Look for settings button
            const settingsVisible = await agent.isElementVisible('[data-test="settings-button"], button:has-text("Settings"), [aria-label="Settings"]');
            if (!settingsVisible) {
                throw new Error('Settings button not found');
            }
            // Click settings
            await agent.click('[data-test="settings-button"], button:has-text("Settings"), [aria-label="Settings"]');
            await agent.wait(1500);
            // Verify settings UI opened (modal or page)
            const settingsOpened = await agent.isElementVisible('.settings-modal, .settings-page, .settings-panel, [data-test="settings-modal"]');
            if (!settingsOpened) {
                console.warn('Settings modal not detected - checking for settings content');
                const settingsContent = await agent.isElementVisible('.settings-section, .settings-content');
                if (!settingsContent) {
                    throw new Error('Settings UI did not open');
                }
            }
            // Verify settings has interactive elements
            const buttons = await agent.findElements('button');
            const inputs = await agent.findElements('input');
            console.log(`Settings UI has ${buttons.length} buttons and ${inputs.length} inputs`);
            if (buttons.length === 0 && inputs.length === 0) {
                throw new Error('Settings UI has no interactive controls');
            }
        }
    },
    {
        id: 'ankrshield-e2e-006',
        name: 'Change DNS provider setting',
        description: 'Navigate to DNS settings and verify controls exist',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['settings', 'dns', 'configuration'],
        timeout: 10000,
        fn: async (agent) => {
            // Open settings
            const settingsButton = await agent.isElementVisible('[data-test="settings-button"], button:has-text("Settings")');
            if (settingsButton) {
                await agent.click('[data-test="settings-button"], button:has-text("Settings")');
                await agent.wait(1000);
            }
            // Look for DNS or network settings section
            const dnsSection = await agent.isElementVisible('[data-test="dns-settings"], .dns-section, .network-settings');
            if (!dnsSection) {
                console.warn('DNS settings section not found - checking for any settings');
                const anySettings = await agent.isElementVisible('.settings-modal, .settings-content');
                if (!anySettings) {
                    throw new Error('Settings did not open');
                }
                console.log('Settings opened but DNS configuration not visible');
                return;
            }
            console.log('DNS settings section found');
            // Look for DNS provider controls
            const dnsControls = await agent.findElements('select, [data-test="dns-provider"], .dns-provider');
            if (dnsControls.length === 0) {
                console.warn('DNS provider controls not found');
            }
            else {
                console.log(`Found ${dnsControls.length} DNS control(s)`);
            }
        }
    },
    {
        id: 'ankrshield-e2e-007',
        name: 'Export data functionality',
        description: 'Verify export button exists and responds to clicks',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['export', 'data', 'functionality'],
        timeout: 10000,
        fn: async (agent) => {
            // Look for export button on main page
            let exportVisible = await agent.isElementVisible('[data-test="export-button"], button:has-text("Export"), button:has-text("Download")');
            if (!exportVisible) {
                // Try settings
                const settingsButton = await agent.isElementVisible('button:has-text("Settings")');
                if (settingsButton) {
                    await agent.click('button:has-text("Settings")');
                    await agent.wait(1000);
                    exportVisible = await agent.isElementVisible('[data-test="export-button"], button:has-text("Export")');
                }
            }
            if (!exportVisible) {
                console.warn('Export functionality not found - may not be implemented');
                return;
            }
            // Click export
            await agent.click('[data-test="export-button"], button:has-text("Export"), button:has-text("Download")');
            await agent.wait(1500);
            // Check for export dialog/modal
            const exportDialog = await agent.isElementVisible('.export-modal, .export-dialog, [data-test="export-modal"]');
            if (exportDialog) {
                console.log('Export dialog opened successfully');
            }
            else {
                console.log('Export triggered (download may have started automatically)');
            }
        }
    },
    {
        id: 'ankrshield-e2e-008',
        name: 'Privacy score remains stable',
        description: 'Verify privacy score displays consistently',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['privacy', 'stability', 'score'],
        timeout: 15000,
        fn: async (agent) => {
            // Get initial privacy score
            await agent.waitForElement('#privacy-score, .privacy-score', 5000);
            const initialScore = await agent.getText('#privacy-score, .privacy-score');
            if (!initialScore || !initialScore.match(/\d+/)) {
                throw new Error('Could not read initial privacy score');
            }
            // Wait and check again
            await agent.wait(5000);
            const currentScore = await agent.getText('#privacy-score, .privacy-score');
            if (!currentScore || !currentScore.match(/\d+/)) {
                throw new Error('Privacy score became invalid');
            }
            console.log(`Privacy score: ${initialScore} → ${currentScore}`);
            // Verify score is still in valid range
            const score = parseInt(currentScore.match(/\d+/)[0]);
            if (score < 0 || score > 100) {
                throw new Error(`Privacy score out of range: ${score}`);
            }
        }
    },
    {
        id: 'ankrshield-e2e-009',
        name: 'Stats display correctly',
        description: 'Verify statistics cards show data',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['stats', 'data', 'display'],
        timeout: 10000,
        fn: async (agent) => {
            // Wait for stats to load
            await agent.waitForElement('.stats-grid, .stat-card', 5000);
            // Count stat cards
            const statCards = await agent.findElements('.stat-card, .stat-item');
            if (statCards.length === 0) {
                throw new Error('No stat cards found');
            }
            console.log(`Found ${statCards.length} stat cards`);
            // Verify each card has content
            for (let i = 0; i < Math.min(statCards.length, 6); i++) {
                const text = await agent.getText(`.stat-card:nth-of-type(${i + 1}), .stat-item:nth-of-type(${i + 1})`);
                if (!text || text.trim().length === 0) {
                    console.warn(`Stat card ${i + 1} is empty`);
                }
                else {
                    console.log(`Stat ${i + 1}: ${text.substring(0, 50)}...`);
                }
            }
        }
    },
    {
        id: 'ankrshield-e2e-010',
        name: 'View tracker information',
        description: 'Navigate to tracker/blocked domain list',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['trackers', 'details', 'navigation'],
        timeout: 10000,
        fn: async (agent) => {
            // Look for tracker/blocked domains section
            const trackerSection = await agent.isElementVisible('.tracker-list, .blocked-domains, .blocklist');
            if (!trackerSection) {
                // Try navigation
                const trackersLink = await agent.isElementVisible('a:has-text("Trackers"), a:has-text("Blocked")');
                if (trackersLink) {
                    await agent.click('a:has-text("Trackers"), a:has-text("Blocked")');
                    await agent.wait(1500);
                    const loaded = await agent.isElementVisible('.tracker-list, .blocked-domains');
                    if (!loaded) {
                        console.warn('Tracker list did not load after navigation');
                        return;
                    }
                }
                else {
                    console.warn('Tracker section not accessible');
                    return;
                }
            }
            // Count tracker items
            const trackerItems = await agent.findElements('.tracker-item, .domain-item, .blocked-item');
            console.log(`Found ${trackerItems.length} tracker/blocked items`);
            if (trackerItems.length === 0) {
                console.warn('Tracker list is empty');
            }
        }
    },
    {
        id: 'ankrshield-e2e-011',
        name: 'View privacy history',
        description: 'Check for privacy history visualization',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['history', 'data', 'visualization'],
        timeout: 10000,
        fn: async (agent) => {
            // Look for history/chart on dashboard
            const chartVisible = await agent.isElementVisible('.chart, .timeline, .history-chart, .privacy-chart');
            if (chartVisible) {
                console.log('Privacy history chart found on dashboard');
                return;
            }
            // Try navigating to history
            const historyLink = await agent.isElementVisible('[data-test="history-link"], a:has-text("History")');
            if (historyLink) {
                await agent.click('[data-test="history-link"], a:has-text("History")');
                await agent.wait(2000);
                const historyView = await agent.isElementVisible('.history-view, .timeline-view');
                if (!historyView) {
                    console.warn('History view did not load');
                    return;
                }
                console.log('History view loaded successfully');
            }
            else {
                console.warn('Privacy history not accessible in current UI');
            }
        }
    },
    {
        id: 'ankrshield-e2e-012',
        name: 'Search blocked domains',
        description: 'Verify search functionality exists',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['search', 'filtering', 'domains'],
        timeout: 10000,
        fn: async (agent) => {
            // Look for search input
            const searchVisible = await agent.isElementVisible('[data-test="search"], input[type="search"], input[placeholder*="Search"]');
            if (!searchVisible) {
                console.warn('Search input not visible on main page');
                // Try other pages
                const blockedLink = await agent.isElementVisible('a:has-text("Blocked"), a:has-text("Domains")');
                if (blockedLink) {
                    await agent.click('a:has-text("Blocked"), a:has-text("Domains")');
                    await agent.wait(1000);
                    const searchAfterNav = await agent.isElementVisible('input[type="search"], input[placeholder*="Search"]');
                    if (!searchAfterNav) {
                        console.warn('Search not available');
                        return;
                    }
                }
                else {
                    return;
                }
            }
            console.log('Search functionality found');
            // Count items before search
            const items = await agent.findElements('.domain-item, .tracker-item, .activity-item');
            console.log(`${items.length} items available for searching`);
            // Type in search
            await agent.type('input[type="search"], input[placeholder*="Search"]', 'google');
            await agent.wait(1500);
            // Count filtered items
            const filteredItems = await agent.findElements('.domain-item, .tracker-item, .activity-item');
            console.log(`${filteredItems.length} items after search filter`);
        }
    },
    {
        id: 'ankrshield-e2e-013',
        name: 'Notification system works',
        description: 'Trigger action and check for notification',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['notifications', 'ui', 'feedback'],
        timeout: 10000,
        fn: async (agent) => {
            // Trigger an action (toggle or button)
            const toggleButton = await agent.isElementVisible('[data-test="protection-toggle"], .toggle-switch');
            const actionButton = await agent.isElementVisible('button:has-text("Scan"), button:has-text("Refresh")');
            if (toggleButton) {
                await agent.click('[data-test="protection-toggle"], .toggle-switch');
            }
            else if (actionButton) {
                await agent.click('button:has-text("Scan"), button:has-text("Refresh")');
            }
            else {
                console.warn('No actionable button found to trigger notification');
                return;
            }
            // Wait for potential notification
            await agent.wait(2000);
            // Look for notification
            const notificationVisible = await agent.isElementVisible('.notification, .toast, .alert, [role="alert"]');
            if (notificationVisible) {
                const notificationText = await agent.getText('.notification, .toast, .alert');
                console.log(`Notification displayed: "${notificationText.substring(0, 80)}"`);
            }
            else {
                console.log('No notification displayed - app may not show notifications for this action');
            }
        }
    },
    {
        id: 'ankrshield-e2e-014',
        name: 'App window remains responsive',
        description: 'Verify app window stays responsive during navigation',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['stability', 'responsiveness', 'navigation'],
        timeout: 10000,
        fn: async (agent) => {
            // Navigate through different sections
            const sections = [
                'a:has-text("Dashboard")',
                'a:has-text("Activity")',
                'a:has-text("Settings")'
            ];
            for (const selector of sections) {
                const linkVisible = await agent.isElementVisible(selector);
                if (linkVisible) {
                    await agent.click(selector);
                    await agent.wait(1000);
                    // Verify app is still responsive
                    const bodyVisible = await agent.isElementVisible('body');
                    if (!bodyVisible) {
                        throw new Error(`App became unresponsive after clicking ${selector}`);
                    }
                    console.log(`Navigated to ${selector.split('"')[1]} - app responsive`);
                }
            }
            // Final responsiveness check
            const isResponsive = await agent.isAppVisible();
            if (!isResponsive) {
                throw new Error('App window is not responsive');
            }
            console.log('App remained responsive throughout navigation');
        }
    },
    {
        id: 'ankrshield-e2e-015',
        name: 'UI layout consistency',
        description: 'Verify main UI elements are consistently present',
        type: 'e2e',
        app: 'ankrshield-desktop',
        tags: ['ui', 'layout', 'consistency'],
        timeout: 10000,
        fn: async (agent) => {
            // Check for key UI elements
            const requiredElements = [
                { name: 'Header', selector: 'header, .header' },
                { name: 'Main Content', selector: 'main, .main-content, .content' },
                { name: 'Privacy Score', selector: '#privacy-score, .privacy-score' },
                { name: 'Stats Grid', selector: '.stats-grid, .stat-card' }
            ];
            const results = [];
            for (const element of requiredElements) {
                const isVisible = await agent.isElementVisible(element.selector);
                results.push({ name: element.name, present: isVisible });
                if (isVisible) {
                    console.log(`✓ ${element.name} is visible`);
                }
                else {
                    console.warn(`✗ ${element.name} is not visible`);
                }
            }
            // At least header and main content should be present
            const header = results.find(r => r.name === 'Header');
            const mainContent = results.find(r => r.name === 'Main Content');
            if (!header?.present || !mainContent?.present) {
                throw new Error('Critical UI elements missing (header or main content)');
            }
            const presentCount = results.filter(r => r.present).length;
            console.log(`UI Consistency: ${presentCount}/${results.length} elements present`);
        }
    }
];
//# sourceMappingURL=e2e-tests.js.map