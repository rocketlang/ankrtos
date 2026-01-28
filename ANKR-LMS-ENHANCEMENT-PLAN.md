# ANKR LMS Enhancement Plan 🚀

**Based on:** Offline-First Tools Analysis (Notion/Evernote replacement article)
**Date:** January 25, 2026
**Status:** Implementation Ready

---

## Executive Summary

ANKR already surpasses the article's offline-first stack (Anytype + Joplin + Unforget) in 9/10 categories. Adding these 3 features will make ANKR the **definitive offline-first knowledge platform**.

**Missing Features:**
1. ⏸️ Quick Capture (browser extension + voice)
2. ⏸️ PWA Support (install on phone/desktop)
3. ⏸️ Import Tools (Notion/Evernote migration)

**Total Time Estimate:** 2-3 weeks
**Priority:** HIGH (completes the offline-first vision)

---

## Enhancement 1: Quick Capture System 📝

**Priority:** HIGH
**Time Estimate:** 3-4 days
**Package Name:** `@ankr/quick-capture`

### What It Does
Allows users to capture thoughts instantly from anywhere (browser, mobile, voice) and auto-sync to ANKR Knowledge Base.

### Architecture

```
@ankr/quick-capture/
├── browser-extension/          # Chrome/Firefox extension
│   ├── manifest.json          # V3 manifest
│   ├── popup/                 # Quick capture popup
│   ├── background/            # Offline queue & sync
│   └── content-script/        # Page capture
├── mobile-widget/             # React Native widget
├── voice-capture/             # Integration with @ankr/voice-ai
└── core/                      # Shared logic
    ├── capture.service.ts     # Capture handling
    ├── queue.service.ts       # Offline queue (IndexedDB)
    └── sync.service.ts        # Sync to knowledge base
```

### Technical Specifications

#### 1. Browser Extension (Chrome/Firefox)

**Manifest V3:**
```json
{
  "manifest_version": 3,
  "name": "ANKR Quick Capture",
  "version": "1.0.0",
  "description": "Capture thoughts instantly to ANKR",
  "permissions": [
    "storage",
    "activeTab",
    "contextMenus",
    "offscreen"
  ],
  "host_permissions": [
    "http://localhost:*/*",
    "https://ankr.in/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "commands": {
    "quick-capture": {
      "suggested_key": {
        "default": "Ctrl+Shift+A",
        "mac": "Command+Shift+A"
      },
      "description": "Quick capture"
    }
  }
}
```

**Popup UI (React):**
```typescript
// browser-extension/popup/App.tsx
import { useState } from 'react';
import { CaptureService } from '../core/capture.service';

export function QuickCapturePopup() {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [type, setType] = useState<'note' | 'todo' | 'bookmark'>('note');

  const handleCapture = async () => {
    await CaptureService.capture({
      content,
      tags,
      type,
      source: 'browser-extension',
      timestamp: new Date(),
      url: window.location.href
    });

    // Clear and close
    setContent('');
    window.close();
  };

  return (
    <div className="w-80 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Quick thought..."
        className="w-full h-32 mb-2"
        autoFocus
      />

      <div className="flex gap-2 mb-2">
        <button onClick={() => setType('note')}>Note</button>
        <button onClick={() => setType('todo')}>To-Do</button>
        <button onClick={() => setType('bookmark')}>Bookmark</button>
      </div>

      <input
        type="text"
        placeholder="Tags (comma-separated)"
        onChange={(e) => setTags(e.target.value.split(','))}
        className="w-full mb-2"
      />

      <button onClick={handleCapture} className="w-full">
        Capture (Ctrl+Enter)
      </button>
    </div>
  );
}
```

**Offline Queue (IndexedDB):**
```typescript
// core/queue.service.ts
import { openDB, DBSchema } from 'idb';

interface CaptureDB extends DBSchema {
  captures: {
    key: string;
    value: {
      id: string;
      content: string;
      tags: string[];
      type: string;
      timestamp: Date;
      synced: boolean;
    };
  };
}

export class QueueService {
  private db: IDBPDatabase<CaptureDB>;

  async init() {
    this.db = await openDB<CaptureDB>('ankr-captures', 1, {
      upgrade(db) {
        db.createObjectStore('captures', { keyPath: 'id' });
      },
    });
  }

  async addToQueue(capture: Capture) {
    await this.db.add('captures', {
      ...capture,
      synced: false
    });
  }

  async getPending() {
    const all = await this.db.getAll('captures');
    return all.filter(c => !c.synced);
  }

  async markSynced(id: string) {
    const capture = await this.db.get('captures', id);
    if (capture) {
      capture.synced = true;
      await this.db.put('captures', capture);
    }
  }
}
```

**Background Sync:**
```typescript
// background/sync-worker.ts
import { QueueService } from '../core/queue.service';
import { KnowledgeBase } from '@ankr/knowledge-base';

class BackgroundSync {
  private queue = new QueueService();
  private kb = new KnowledgeBase();
  private syncInterval: NodeJS.Timer;

  async start() {
    await this.queue.init();

    // Sync every 30 seconds
    this.syncInterval = setInterval(() => this.sync(), 30000);

    // Sync immediately on network change
    window.addEventListener('online', () => this.sync());
  }

  async sync() {
    if (!navigator.onLine) return;

    const pending = await this.queue.getPending();

    for (const capture of pending) {
      try {
        await this.kb.ingest({
          content: capture.content,
          metadata: {
            source: 'quick-capture',
            tags: capture.tags,
            type: capture.type,
            timestamp: capture.timestamp
          }
        });

        await this.queue.markSynced(capture.id);
      } catch (error) {
        console.error('Sync failed:', error);
        // Will retry on next sync
      }
    }
  }
}

const sync = new BackgroundSync();
sync.start();
```

#### 2. Voice Capture (Integration with @ankr/voice-ai)

```typescript
// voice-capture/voice.service.ts
import { VoiceAI } from '@ankr/voice-ai';
import { CaptureService } from '../core/capture.service';

export class VoiceCapture {
  private voice = new VoiceAI({
    language: 'hi-IN', // Hindi by default
    fallback: 'en-IN'
  });

  async startCapture() {
    const text = await this.voice.listen({
      timeout: 60000, // 1 minute
      endOnSilence: 3000 // 3 seconds silence
    });

    await CaptureService.capture({
      content: text,
      type: 'note',
      source: 'voice',
      tags: ['voice-capture'],
      timestamp: new Date()
    });

    return text;
  }

  async captureWithCommand() {
    // Listen for wake word "ANKR capture"
    const command = await this.voice.detectWakeWord('ankr capture');

    if (command) {
      await this.startCapture();
    }
  }
}
```

#### 3. Mobile Widget (React Native)

```typescript
// mobile-widget/QuickCaptureWidget.tsx
import { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { CaptureService } from '../core/capture.service';
import { VoiceCapture } from '../voice-capture/voice.service';

export function QuickCaptureWidget() {
  const [text, setText] = useState('');
  const voice = new VoiceCapture();

  const handleCapture = async () => {
    await CaptureService.capture({
      content: text,
      type: 'note',
      source: 'mobile-widget',
      timestamp: new Date()
    });
    setText('');
  };

  const handleVoiceCapture = async () => {
    const captured = await voice.startCapture();
    setText(captured);
  };

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Quick thought..."
        multiline
        style={{ height: 100, borderWidth: 1, padding: 8 }}
      />
      <Button title="🎤 Voice" onPress={handleVoiceCapture} />
      <Button title="💾 Save" onPress={handleCapture} />
    </View>
  );
}
```

### Integration with ANKR Knowledge Base

```typescript
// core/capture.service.ts
import { KnowledgeBase } from '@ankr/knowledge-base';
import { QueueService } from './queue.service';

export class CaptureService {
  private static kb = new KnowledgeBase();
  private static queue = new QueueService();

  static async capture(data: CaptureData) {
    const capture = {
      id: crypto.randomUUID(),
      ...data,
      timestamp: new Date()
    };

    // Add to offline queue first
    await this.queue.addToQueue(capture);

    // Try immediate sync if online
    if (navigator.onLine) {
      try {
        await this.kb.ingest({
          content: capture.content,
          metadata: {
            source: capture.source,
            tags: capture.tags,
            type: capture.type,
            url: capture.url
          }
        });

        await this.queue.markSynced(capture.id);
      } catch (error) {
        // Will retry in background
        console.error('Immediate sync failed, queued for retry');
      }
    }

    return capture;
  }
}
```

### Installation & Distribution

**Browser Extension:**
1. Build: `cd packages/ankr-quick-capture/browser-extension && npm run build`
2. Chrome Web Store submission
3. Firefox Add-ons submission
4. Self-hosted: `chrome://extensions` → Load unpacked

**Mobile Widget:**
1. Add to ANKR Interact mobile app
2. iOS: Home screen widget
3. Android: Quick settings tile

### Testing Plan

```typescript
// core/__tests__/capture.test.ts
import { CaptureService } from '../capture.service';
import { QueueService } from '../queue.service';

describe('CaptureService', () => {
  test('captures note with tags', async () => {
    const capture = await CaptureService.capture({
      content: 'Test note',
      tags: ['test'],
      type: 'note',
      source: 'test'
    });

    expect(capture.id).toBeDefined();
    expect(capture.content).toBe('Test note');
  });

  test('queues capture when offline', async () => {
    // Mock offline
    Object.defineProperty(navigator, 'onLine', { value: false });

    await CaptureService.capture({
      content: 'Offline note',
      type: 'note',
      source: 'test'
    });

    const queue = new QueueService();
    const pending = await queue.getPending();
    expect(pending.length).toBeGreaterThan(0);
  });
});
```

---

## Enhancement 2: PWA Support 📱

**Priority:** MEDIUM
**Time Estimate:** 2-3 days
**Target Apps:** ANKR Interact, ANKR LMS

### What It Does
Makes ANKR Interact installable on mobile/desktop with offline functionality, background sync, and push notifications.

### Architecture

```
apps/ankr-interact/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icons/                 # App icons (192x192, 512x512)
├── src/
│   ├── service-worker/
│   │   ├── cache-strategies.ts
│   │   ├── background-sync.ts
│   │   └── push-notifications.ts
│   └── pwa/
│       ├── install-prompt.tsx
│       └── offline-indicator.tsx
└── vite.config.ts             # Vite PWA plugin
```

### Technical Specifications

#### 1. PWA Manifest

```json
// public/manifest.json
{
  "name": "ANKR Platform",
  "short_name": "ANKR",
  "description": "AI-powered offline-first knowledge platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Quick Capture",
      "url": "/capture",
      "icons": [{ "src": "/icons/capture.png", "sizes": "96x96" }]
    },
    {
      "name": "Search Knowledge",
      "url": "/search",
      "icons": [{ "src": "/icons/search.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["education", "productivity", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ]
}
```

#### 2. Service Worker with Workbox

```typescript
// src/service-worker/sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache all build assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses (GraphQL)
registerRoute(
  ({ url }) => url.pathname.includes('/graphql'),
  new NetworkFirst({
    cacheName: 'graphql-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache static assets
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-cache',
  })
);

// Background sync for failed requests
const bgSyncPlugin = new BackgroundSyncPlugin('ankr-sync-queue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
});

registerRoute(
  ({ url }) => url.pathname.includes('/api/'),
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  })
);

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-captures') {
    event.waitUntil(syncCaptures());
  }
});

async function syncCaptures() {
  // Sync pending captures to knowledge base
  const captures = await getCapturesFromIndexedDB();
  for (const capture of captures) {
    await fetch('/api/knowledge-base/ingest', {
      method: 'POST',
      body: JSON.stringify(capture)
    });
  }
}
```

#### 3. Vite PWA Plugin Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/**/*'],
      manifest: {
        // manifest.json content here
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.ankr\.in\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Enable in dev for testing
      }
    })
  ]
});
```

#### 4. Install Prompt UI

```typescript
// src/pwa/install-prompt.tsx
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="font-bold mb-2">Install ANKR</h3>
      <p className="text-sm mb-3">
        Install ANKR for offline access and faster performance
      </p>
      <div className="flex gap-2">
        <button onClick={handleInstall} className="btn-primary">
          Install
        </button>
        <button onClick={() => setShowPrompt(false)} className="btn-secondary">
          Later
        </button>
      </div>
    </div>
  );
}
```

#### 5. Offline Indicator

```typescript
// src/pwa/offline-indicator.tsx
import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center">
      ⚠️ You're offline. Changes will sync when connection is restored.
    </div>
  );
}
```

#### 6. Background Sync for Captures

```typescript
// src/service-worker/background-sync.ts
import { Queue } from 'workbox-background-sync';

const captureQueue = new Queue('capture-queue', {
  onSync: async ({ queue }) => {
    let entry;
    while (entry = await queue.shiftRequest()) {
      try {
        await fetch(entry.request);
        console.log('Synced capture:', entry);
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// Add failed requests to queue
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/captures')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        captureQueue.pushRequest({ request: event.request });
        return new Response(JSON.stringify({ queued: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  }
});
```

### Testing Plan

```typescript
// src/pwa/__tests__/install-prompt.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { InstallPrompt } from '../install-prompt';

describe('InstallPrompt', () => {
  test('shows prompt when beforeinstallprompt fires', () => {
    const { getByText } = render(<InstallPrompt />);

    // Simulate beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);

    expect(getByText('Install ANKR')).toBeInTheDocument();
  });

  test('triggers install on button click', async () => {
    const mockPrompt = jest.fn();
    const event: any = {
      preventDefault: jest.fn(),
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };

    const { getByText } = render(<InstallPrompt />);
    window.dispatchEvent(event);

    fireEvent.click(getByText('Install'));
    expect(mockPrompt).toHaveBeenCalled();
  });
});
```

---

## Enhancement 3: Import Tools 📥

**Priority:** MEDIUM
**Time Estimate:** 1 week
**Package Name:** `@ankr/importers`

### What It Does
Allows users to migrate from Notion, Evernote, Google Keep, and other note-taking apps to ANKR.

### Architecture

```
@ankr/importers/
├── notion/
│   ├── notion-importer.ts     # Notion API integration
│   ├── markdown-parser.ts     # Parse Notion markdown
│   └── database-handler.ts    # Notion databases
├── evernote/
│   ├── enex-parser.ts         # .enex file parser
│   ├── note-converter.ts      # Convert to ANKR format
│   └── attachment-handler.ts  # Handle attachments
├── google-keep/
│   ├── takeout-parser.ts      # Parse Google Takeout
│   └── label-mapper.ts        # Map labels to tags
├── markdown/
│   ├── obsidian-importer.ts   # Obsidian vault
│   ├── logseq-importer.ts     # Logseq graph
│   └── generic-md.ts          # Generic markdown files
├── core/
│   ├── base-importer.ts       # Base class
│   ├── converter.ts           # Format conversion
│   └── progress-tracker.ts    # Import progress
└── cli/
    └── import-cli.ts          # CLI tool
```

### Technical Specifications

#### 1. Base Importer

```typescript
// core/base-importer.ts
import { KnowledgeBase } from '@ankr/knowledge-base';
import { EventEmitter } from 'events';

export interface ImportOptions {
  source: string;
  destination?: string;
  tags?: string[];
  batchSize?: number;
  preserveMetadata?: boolean;
}

export interface ImportProgress {
  total: number;
  processed: number;
  failed: number;
  current: string;
}

export abstract class BaseImporter extends EventEmitter {
  protected kb = new KnowledgeBase();
  protected progress: ImportProgress = {
    total: 0,
    processed: 0,
    failed: 0,
    current: ''
  };

  abstract parse(source: string): Promise<Document[]>;
  abstract convert(doc: any): Document;

  async import(options: ImportOptions): Promise<ImportResult> {
    this.emit('start', { source: options.source });

    try {
      // Parse source
      const docs = await this.parse(options.source);
      this.progress.total = docs.length;
      this.emit('parsed', { count: docs.length });

      // Convert and ingest in batches
      const batchSize = options.batchSize || 10;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);

        for (const doc of batch) {
          try {
            this.progress.current = doc.title || doc.id;
            this.emit('progress', this.progress);

            const converted = this.convert(doc);
            await this.kb.ingest({
              content: converted.content,
              metadata: {
                ...converted.metadata,
                source: options.source,
                importedAt: new Date(),
                tags: [...(converted.tags || []), ...(options.tags || [])]
              }
            });

            this.progress.processed++;
          } catch (error) {
            this.progress.failed++;
            this.emit('error', { doc, error });
          }
        }
      }

      this.emit('complete', this.progress);
      return {
        success: true,
        processed: this.progress.processed,
        failed: this.progress.failed
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}
```

#### 2. Notion Importer

```typescript
// notion/notion-importer.ts
import { Client } from '@notionhq/client';
import { BaseImporter } from '../core/base-importer';

export class NotionImporter extends BaseImporter {
  private notion: Client;

  constructor(apiKey: string) {
    super();
    this.notion = new Client({ auth: apiKey });
  }

  async parse(source: string): Promise<any[]> {
    const docs: any[] = [];

    // Get all pages
    const pages = await this.notion.search({
      filter: { property: 'object', value: 'page' }
    });

    for (const page of pages.results) {
      docs.push(await this.parsePage(page.id));
    }

    // Get all databases
    const databases = await this.notion.search({
      filter: { property: 'object', value: 'database' }
    });

    for (const db of databases.results) {
      docs.push(...await this.parseDatabase(db.id));
    }

    return docs;
  }

  async parsePage(pageId: string) {
    const page = await this.notion.pages.retrieve({ page_id: pageId });
    const blocks = await this.notion.blocks.children.list({ block_id: pageId });

    return {
      id: pageId,
      title: this.extractTitle(page),
      content: this.blocksToMarkdown(blocks.results),
      metadata: {
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        url: page.url
      }
    };
  }

  async parseDatabase(dbId: string) {
    const db = await this.notion.databases.retrieve({ database_id: dbId });
    const pages = await this.notion.databases.query({ database_id: dbId });

    return pages.results.map(page => ({
      id: page.id,
      title: this.extractTitle(page),
      properties: this.extractProperties(page),
      database: db.title[0]?.plain_text
    }));
  }

  convert(doc: any): Document {
    return {
      content: doc.content || '',
      title: doc.title,
      metadata: doc.metadata,
      tags: ['notion-import']
    };
  }

  private blocksToMarkdown(blocks: any[]): string {
    return blocks.map(block => {
      switch (block.type) {
        case 'paragraph':
          return block.paragraph.rich_text.map(t => t.plain_text).join('');
        case 'heading_1':
          return `# ${block.heading_1.rich_text.map(t => t.plain_text).join('')}`;
        case 'heading_2':
          return `## ${block.heading_2.rich_text.map(t => t.plain_text).join('')}`;
        case 'heading_3':
          return `### ${block.heading_3.rich_text.map(t => t.plain_text).join('')}`;
        case 'bulleted_list_item':
          return `- ${block.bulleted_list_item.rich_text.map(t => t.plain_text).join('')}`;
        case 'numbered_list_item':
          return `1. ${block.numbered_list_item.rich_text.map(t => t.plain_text).join('')}`;
        case 'code':
          return `\`\`\`${block.code.language}\n${block.code.rich_text.map(t => t.plain_text).join('')}\n\`\`\``;
        default:
          return '';
      }
    }).join('\n\n');
  }

  private extractTitle(page: any): string {
    const titleProp = Object.values(page.properties).find(
      (p: any) => p.type === 'title'
    );
    return titleProp?.title[0]?.plain_text || 'Untitled';
  }
}
```

#### 3. Evernote Importer

```typescript
// evernote/enex-parser.ts
import { parseStringPromise } from 'xml2js';
import { BaseImporter } from '../core/base-importer';
import * as fs from 'fs/promises';

export class EvernoteImporter extends BaseImporter {
  async parse(enexPath: string): Promise<any[]> {
    const xml = await fs.readFile(enexPath, 'utf-8');
    const parsed = await parseStringPromise(xml);

    return parsed['en-export'].note.map(note => ({
      title: note.title[0],
      content: this.parseContent(note.content[0]),
      created: new Date(note.created[0]),
      updated: new Date(note.updated[0]),
      tags: note.tag || [],
      attachments: note.resource || []
    }));
  }

  convert(doc: any): Document {
    return {
      content: doc.content,
      title: doc.title,
      metadata: {
        createdAt: doc.created,
        updatedAt: doc.updated,
        source: 'evernote'
      },
      tags: [...doc.tags, 'evernote-import']
    };
  }

  private parseContent(enml: string): string {
    // Convert ENML (Evernote Markup Language) to Markdown
    let markdown = enml;

    // Remove ENML tags
    markdown = markdown.replace(/<\/?en-note>/g, '');

    // Convert div to paragraphs
    markdown = markdown.replace(/<div>(.*?)<\/div>/g, '$1\n\n');

    // Convert bold
    markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');

    // Convert italic
    markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');

    // Convert links
    markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');

    // Convert lists
    markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
      return content.replace(/<li>(.*?)<\/li>/g, '- $1\n');
    });

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    return markdown.trim();
  }

  private async handleAttachments(attachments: any[]): Promise<string[]> {
    const urls: string[] = [];

    for (const attachment of attachments) {
      const data = Buffer.from(attachment.data[0]._, 'base64');
      const mime = attachment.mime[0];
      const filename = attachment['resource-attributes']?.[0]?.['file-name']?.[0] || 'attachment';

      // Save to ANKR storage
      const url = await this.saveAttachment(filename, data, mime);
      urls.push(url);
    }

    return urls;
  }

  private async saveAttachment(filename: string, data: Buffer, mime: string): Promise<string> {
    // Save to local storage or S3
    const path = `/uploads/evernote/${Date.now()}-${filename}`;
    await fs.writeFile(`/var/www/ankr${path}`, data);
    return `https://ankr.in${path}`;
  }
}
```

#### 4. Google Keep Importer

```typescript
// google-keep/takeout-parser.ts
import { BaseImporter } from '../core/base-importer';
import * as fs from 'fs/promises';
import * as path from 'path';

export class GoogleKeepImporter extends BaseImporter {
  async parse(takeoutPath: string): Promise<any[]> {
    // Google Takeout provides JSON files
    const keepDir = path.join(takeoutPath, 'Keep');
    const files = await fs.readdir(keepDir);

    const notes: any[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(keepDir, file), 'utf-8');
        notes.push(JSON.parse(content));
      }
    }

    return notes;
  }

  convert(doc: any): Document {
    return {
      content: `${doc.title || ''}\n\n${doc.textContent || ''}`,
      title: doc.title || 'Untitled Note',
      metadata: {
        createdAt: new Date(doc.createdTimestampUsec / 1000),
        updatedAt: new Date(doc.userEditedTimestampUsec / 1000),
        color: doc.color,
        pinned: doc.isPinned,
        archived: doc.isArchived,
        source: 'google-keep'
      },
      tags: [
        ...(doc.labels || []).map(l => l.name),
        'keep-import'
      ]
    };
  }
}
```

#### 5. CLI Tool

```typescript
// cli/import-cli.ts
import { Command } from 'commander';
import { NotionImporter } from '../notion/notion-importer';
import { EvernoteImporter } from '../evernote/enex-parser';
import { GoogleKeepImporter } from '../google-keep/takeout-parser';
import ora from 'ora';
import chalk from 'chalk';

const program = new Command();

program
  .name('ankr-import')
  .description('Import notes from other platforms to ANKR')
  .version('1.0.0');

program
  .command('notion')
  .description('Import from Notion')
  .requiredOption('-k, --api-key <key>', 'Notion API key')
  .option('-t, --tags <tags>', 'Additional tags (comma-separated)')
  .action(async (options) => {
    const spinner = ora('Importing from Notion...').start();

    const importer = new NotionImporter(options.apiKey);

    importer.on('progress', (progress) => {
      spinner.text = `Importing: ${progress.current} (${progress.processed}/${progress.total})`;
    });

    try {
      const result = await importer.import({
        source: 'notion',
        tags: options.tags?.split(',') || []
      });

      spinner.succeed(
        chalk.green(`✅ Imported ${result.processed} notes (${result.failed} failed)`)
      );
    } catch (error) {
      spinner.fail(chalk.red(`❌ Import failed: ${error.message}`));
    }
  });

program
  .command('evernote <file>')
  .description('Import from Evernote .enex file')
  .option('-t, --tags <tags>', 'Additional tags (comma-separated)')
  .action(async (file, options) => {
    const spinner = ora('Importing from Evernote...').start();

    const importer = new EvernoteImporter();

    importer.on('progress', (progress) => {
      spinner.text = `Importing: ${progress.current} (${progress.processed}/${progress.total})`;
    });

    try {
      const result = await importer.import({
        source: file,
        tags: options.tags?.split(',') || []
      });

      spinner.succeed(
        chalk.green(`✅ Imported ${result.processed} notes (${result.failed} failed)`)
      );
    } catch (error) {
      spinner.fail(chalk.red(`❌ Import failed: ${error.message}`));
    }
  });

program
  .command('keep <folder>')
  .description('Import from Google Keep (Google Takeout)')
  .option('-t, --tags <tags>', 'Additional tags (comma-separated)')
  .action(async (folder, options) => {
    const spinner = ora('Importing from Google Keep...').start();

    const importer = new GoogleKeepImporter();

    importer.on('progress', (progress) => {
      spinner.text = `Importing: ${progress.current} (${progress.processed}/${progress.total})`;
    });

    try {
      const result = await importer.import({
        source: folder,
        tags: options.tags?.split(',') || []
      });

      spinner.succeed(
        chalk.green(`✅ Imported ${result.processed} notes (${result.failed} failed)`)
      );
    } catch (error) {
      spinner.fail(chalk.red(`❌ Import failed: ${error.message}`));
    }
  });

program.parse();
```

### Usage Examples

```bash
# Install CLI
npm install -g @ankr/importers

# Import from Notion
ankr-import notion --api-key secret_xxx --tags "imported,notion"

# Import from Evernote
ankr-import evernote my-notes.enex --tags "imported"

# Import from Google Keep
ankr-import keep ~/Downloads/Takeout/Keep --tags "imported,keep"

# Import Obsidian vault
ankr-import markdown ~/Documents/ObsidianVault --tags "obsidian"
```

### Web UI for Imports

```typescript
// web/ImportWizard.tsx
import { useState } from 'react';
import { NotionImporter } from '@ankr/importers';

export function ImportWizard() {
  const [step, setStep] = useState<'select' | 'configure' | 'import' | 'done'>('select');
  const [source, setSource] = useState<'notion' | 'evernote' | 'keep'>();
  const [progress, setProgress] = useState({ total: 0, processed: 0 });

  const handleImport = async (config: any) => {
    setStep('import');

    let importer;
    switch (source) {
      case 'notion':
        importer = new NotionImporter(config.apiKey);
        break;
      case 'evernote':
        importer = new EvernoteImporter();
        break;
      case 'keep':
        importer = new GoogleKeepImporter();
        break;
    }

    importer.on('progress', setProgress);

    await importer.import(config);
    setStep('done');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Import to ANKR</h1>

      {step === 'select' && (
        <div className="grid grid-cols-3 gap-4">
          <ImportCard
            icon="📝"
            name="Notion"
            onClick={() => { setSource('notion'); setStep('configure'); }}
          />
          <ImportCard
            icon="🐘"
            name="Evernote"
            onClick={() => { setSource('evernote'); setStep('configure'); }}
          />
          <ImportCard
            icon="💡"
            name="Google Keep"
            onClick={() => { setSource('keep'); setStep('configure'); }}
          />
        </div>
      )}

      {step === 'import' && (
        <div className="text-center">
          <div className="mb-4">
            Importing {progress.processed} / {progress.total}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(progress.processed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold">Import Complete!</h2>
          <p className="mt-2">
            Successfully imported {progress.processed} notes
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Timeline

### Week 1: Quick Capture
**Days 1-2: Browser Extension**
- [ ] Set up extension manifest V3
- [ ] Build popup UI (React)
- [ ] Implement IndexedDB queue
- [ ] Test offline capture

**Days 3-4: Background Sync & Voice**
- [ ] Implement service worker sync
- [ ] Integrate @ankr/voice-ai
- [ ] Build mobile widget
- [ ] Test end-to-end flow

### Week 2: PWA Support
**Days 5-6: PWA Setup**
- [ ] Add manifest.json
- [ ] Configure Vite PWA plugin
- [ ] Build service worker with Workbox
- [ ] Implement cache strategies

**Day 7: PWA Features**
- [ ] Build install prompt
- [ ] Add offline indicator
- [ ] Implement background sync
- [ ] Test on mobile devices

### Week 3: Import Tools
**Days 8-10: Core Importers**
- [ ] Build base importer class
- [ ] Implement Notion importer
- [ ] Implement Evernote importer
- [ ] Implement Google Keep importer

**Days 11-12: CLI & Web UI**
- [ ] Build CLI tool
- [ ] Build web import wizard
- [ ] Add progress tracking
- [ ] Test with real exports

### Week 3: Polish & Launch
**Days 13-14: Testing & Documentation**
- [ ] Write tests for all features
- [ ] Create user guides
- [ ] Record demo videos
- [ ] Publish to Chrome Web Store / Firefox Add-ons

---

## Success Metrics

**Quick Capture:**
- ✅ Capture note in < 5 seconds
- ✅ Works offline
- ✅ Syncs within 30 seconds when online
- ✅ Voice capture accuracy > 90%

**PWA:**
- ✅ Install rate > 30% of mobile users
- ✅ Offline functionality works for 100% of core features
- ✅ Load time < 2 seconds
- ✅ Cache hit rate > 80%

**Import Tools:**
- ✅ Import 1000 notes in < 5 minutes
- ✅ Success rate > 95%
- ✅ Preserve formatting & metadata
- ✅ Support attachments

---

## Dependencies

**New Packages to Add:**
```json
{
  "@notionhq/client": "^2.2.0",
  "xml2js": "^0.6.0",
  "workbox-precaching": "^7.0.0",
  "workbox-routing": "^7.0.0",
  "workbox-strategies": "^7.0.0",
  "workbox-expiration": "^7.0.0",
  "workbox-background-sync": "^7.0.0",
  "vite-plugin-pwa": "^0.17.0",
  "idb": "^8.0.0",
  "commander": "^11.0.0",
  "ora": "^7.0.0",
  "chalk": "^5.3.0"
}
```

**Existing ANKR Packages Used:**
- `@ankr/knowledge-base` - Ingest captured/imported content
- `@ankr/voice-ai` - Voice capture
- `@ankr/rag` - AI-powered search in imported notes
- `@ankr/eon` - Remember import patterns

---

## Marketing Message

**After These Enhancements:**

> "ANKR is the **only** platform that combines:
> - Offline-first architecture (like Anytype + Joplin)
> - Quick capture (like Unforget)
> - AI-powered answers (like ChatGPT)
> - Educational features (quizzes, audio, tracking)
> - Easy migration (import from anywhere)
> - **All in ONE unified system!**"

**vs The Article's Stack:**
- Their stack: 3 separate tools, manual sync, no AI
- ANKR: 1 platform, auto sync, AI-powered, education-focused

---

## Next Steps

1. **Review this plan** - Confirm priorities and timeline
2. **Create packages** - Set up @ankr/quick-capture, @ankr/importers
3. **Start with Quick Capture** - Highest user impact
4. **Add PWA support** - Makes mobile experience perfect
5. **Build importers** - Helps users migrate to ANKR

**Ready to start?** We can begin with Quick Capture (browser extension) today!

---

*Enhancement Plan Created: January 25, 2026*
*Status: Ready for Implementation*
*Expected Completion: 2-3 weeks*
