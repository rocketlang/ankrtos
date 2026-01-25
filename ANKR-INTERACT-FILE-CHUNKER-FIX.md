# ANKR Interact - FileChunker Browser Fix

**Date:** January 23, 2026
**Issue:** ImportDocuments.tsx failing in browser
**Status:** ✅ Fixed

---

## Problem

### Browser Error
```
ImportDocuments.tsx:9 Uncaught SyntaxError: The requested module
'/@fs/root/ankr-labs-nx/packages/ankr-chunking/dist/index.js'
does not provide an export named 'FileChunker'
```

**Location:** https://ankrlms.ankr.in (ANKR Interact running on port 3199)

---

## Root Causes

### 1. Module Format Mismatch
**Problem:** @ankr/chunking was compiled to CommonJS
```javascript
// CommonJS output (before fix)
exports.FileChunker = ...
Object.defineProperty(exports, "FileChunker", { ... });
```

**Why it Failed:**
- Vite (browser build tool) expects ES modules (ESM)
- Browser `import { FileChunker }` requires ESM format
- CommonJS `exports` doesn't work in browser imports

**Fix:** Changed TypeScript compilation to ESM
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ES2020"  // was: "commonjs"
  }
}

// package.json
{
  "type": "module",
  "module": "dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js"
    }
  }
}
```

**Result:**
```javascript
// ESM output (after fix)
export { FileChunker } from './file-chunker';
export * from './types';
```

---

### 2. Node.js APIs in Browser Code
**Problem:** @ankr/chunking's FileChunker uses Node.js APIs
```typescript
// file-chunker.ts (server-side only!)
import { createReadStream, createWriteStream, statSync } from 'fs';

export class FileChunker {
  async *chunkFile(filePath: string) {
    const stream = createReadStream(filePath);  // ❌ Doesn't exist in browser!
    // ...
  }
}
```

**Why it Failed:**
- Browser doesn't have `fs` module
- `createReadStream` is Node.js only
- ImportDocuments.tsx runs in the browser

**Fix:** Created browser-compatible chunking function
```typescript
// Browser-compatible (uses File API)
async function* chunkFile(
  file: File,  // ✅ Browser File object
  chunkSize: number = 1024 * 1024
) {
  const totalChunks = Math.ceil(file.size / chunkSize);

  for (let index = 0; index < totalChunks; index++) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);  // ✅ Browser API

    yield {
      data: chunk,
      metadata: { index, totalChunks, ... }
    };
  }
}
```

---

## Changes Made

### 1. Fixed @ankr/chunking Package (ESM Support)

**File:** `/root/ankr-labs-nx/packages/ankr-chunking/tsconfig.json`
```diff
- "module": "commonjs",
+ "module": "ES2020",
```

**File:** `/root/ankr-labs-nx/packages/ankr-chunking/package.json`
```diff
+ "type": "module",
  "main": "dist/index.js",
+ "module": "dist/index.js",
  "types": "dist/index.d.ts",
+ "exports": {
+   ".": {
+     "import": "./dist/index.js",
+     "types": "./dist/index.d.ts"
+   }
+ },
```

**Rebuild:**
```bash
cd /root/ankr-labs-nx/packages/ankr-chunking
npm run build
```

**Result:** Package now exports ESM correctly for browser use

---

### 2. Fixed ImportDocuments.tsx (Browser-Compatible Chunking)

**File:** `/root/ankr-labs-nx/packages/ankr-interact/src/client/pages/ImportDocuments.tsx`

**Removed Node.js Dependency:**
```diff
- import { FileChunker } from '@ankr/chunking';
```

**Added Browser-Compatible Helper:**
```typescript
/**
 * Browser-compatible file chunking
 * Yields chunks of a File as Blobs with metadata
 */
async function* chunkFile(
  file: File,
  chunkSize: number = 1024 * 1024,
  onProgress?: (progress: { percentage: number; ... }) => void
) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  let bytesProcessed = 0;

  for (let index = 0; index < totalChunks; index++) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    bytesProcessed += chunk.size;

    if (onProgress) {
      onProgress({
        percentage: (bytesProcessed / file.size) * 100,
        bytesProcessed,
        totalBytes: file.size,
      });
    }

    yield {
      data: chunk,
      metadata: {
        index,
        totalChunks,
        chunkSize: chunk.size,
        totalSize: file.size,
      },
    };
  }
}
```

**Updated Usage:**
```diff
- const chunker = new FileChunker({ chunkSize: 1024 * 1024, ... });
- for await (const { data, metadata } of chunker.chunkFile(file)) {
+ for await (const { data, metadata } of chunkFile(file, 1024 * 1024, onProgress)) {
```

---

## Architecture Decision

### @ankr/chunking Package Purpose

**Server-Side Only:**
- FileChunker: Uses Node.js fs APIs for server file processing
- DatabaseChunker: Batch database operations
- TextChunker: Text vectorization for embeddings

**Use Cases:**
- Backend APIs processing uploaded files
- Database bulk operations
- AI/ML text processing

**NOT for Browser:**
- Cannot use fs module
- Should not be imported in React components
- Frontend needs different chunking approach

---

### Browser File Chunking Approach

**Use Browser APIs:**
```typescript
// ✅ Correct: Uses File.slice() (browser API)
const chunk = file.slice(start, end);

// ❌ Wrong: Uses fs.createReadStream() (Node.js only)
const stream = createReadStream(filePath);
```

**Where to Implement:**
- **Option 1:** Inline helper function (current approach)
  - Simple, no dependencies
  - Self-contained in component
  - Easy to customize per use case

- **Option 2:** Shared utility (@ankr/browser-utils)
  - Reusable across components
  - Consistent implementation
  - Requires new package

**Current Decision:** Option 1 (inline helper)
- ImportDocuments is the only component needing chunking
- Simple implementation (20 lines)
- No extra package needed

---

## Testing

### Before Fix
```
❌ Error: The requested module does not provide an export named 'FileChunker'
❌ Import fails in browser
❌ File upload broken
```

### After Fix
```
✅ Module imports successfully
✅ Chunking works in browser
✅ File upload functional
✅ Progress tracking works
✅ 1MB chunks uploaded correctly
```

---

## Impact

### Fixed Pages
- ✅ ImportDocuments.tsx (file upload with chunking)
- ✅ https://ankrlms.ankr.in/import
- ✅ ANKR LMS file import functionality

### Affected Services
- ✅ ANKR Interact (port 3199)
- ✅ ankrlms.ankr.in (Cloudflare proxy)
- ✅ ankr.in/project/documents

---

## Lessons Learned

### 1. Node.js vs Browser Packages
**Problem:** Many npm packages are Node.js-only
**Solution:** Check imports - if they use `fs`, `path`, `process`, they're Node.js only
**Prevention:** Create separate browser-compatible utilities

### 2. Module Format Matters
**Problem:** CommonJS doesn't work with Vite/browser imports
**Solution:** Always use ESM for browser packages
**Prevention:** Set `"type": "module"` and `"module": "ES2020"` in configs

### 3. File API Differences
**Browser:** `File` object with `.slice()` method
**Node.js:** File path string with `fs.createReadStream()`
**Solution:** Different implementations for each environment

---

## Future Improvements

### Option 1: Create @ankr/browser-utils Package
```typescript
// @ankr/browser-utils
export { FileChunker } from './file-chunker';  // Browser-compatible
export { ImageOptimizer } from './image-optimizer';
export { VideoThumbnail } from './video-thumbnail';
```

**Pros:**
- Reusable across all browser apps
- Consistent API
- Separate concerns

**Cons:**
- Another package to maintain
- May be overkill for single use case

### Option 2: Keep Current Approach
**Pros:**
- Simple, self-contained
- No dependencies
- Easy to customize

**Cons:**
- Code duplication if needed elsewhere
- Not discoverable by other developers

**Decision:** Keep current approach until needed in 2+ places

---

## Related Files

**Fixed:**
- `/root/ankr-labs-nx/packages/ankr-chunking/tsconfig.json`
- `/root/ankr-labs-nx/packages/ankr-chunking/package.json`
- `/root/ankr-labs-nx/packages/ankr-interact/src/client/pages/ImportDocuments.tsx`

**Compiled:**
- `/root/ankr-labs-nx/packages/ankr-chunking/dist/index.js` (now ESM)

**Services:**
- ankr-viewer (port 3199) - Restarted

---

## Verification

### Check Module Format
```bash
# Verify ESM output
head -20 /root/ankr-labs-nx/packages/ankr-chunking/dist/index.js
# Should show: export { FileChunker } from './file-chunker';

# Verify no CommonJS
grep -c "exports.FileChunker" /root/ankr-labs-nx/packages/ankr-chunking/dist/index.js
# Should output: 0
```

### Check Browser Import
```bash
# Test in browser console
curl -s http://localhost:3199/import | grep -c "ImportDocuments"
# Should work without errors
```

### Check Service
```bash
ankr-ctl status | grep ankr-viewer
# Should show: RUNNING
```

---

## Status

✅ **Fixed:** FileChunker import error resolved
✅ **Compiled:** @ankr/chunking now outputs ESM
✅ **Implemented:** Browser-compatible chunking in ImportDocuments.tsx
✅ **Restarted:** ankr-viewer service running
✅ **Verified:** File upload working on ankrlms.ankr.in

---

**Fix Applied:** 2026-01-23 22:10 UTC
**Service:** ANKR Interact (ankr-viewer)
**Impact:** File upload functionality restored
**Testing:** Browser import successful

**Jai Guru Ji** 🙏
