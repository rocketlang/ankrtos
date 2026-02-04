# ANKR Viewer Mobile App

A comprehensive mobile application for browsing ANKR's documentation, knowledge graph, and investor resources. Built with Expo and React Native for iOS and Android.

## Features

### Core Capabilities
- **File Browser**: Navigate and view all documentation with folder hierarchy
- **Knowledge Graph**: Interactive D3.js visualization of connected documents and topics
- **Search**: Full-text search across all documents with category filters
- **Document Viewer**: Support for Markdown, PDF, code files, images, and more
- **Offline Support**: Cache documents for offline viewing

### Investor Features
- **Investor Dashboard**: Complete platform overview with key metrics
- **Product Portfolio**: All ANKR products with live status and metrics
- **Capabilities Showcase**: 8+ platform capabilities with detailed features
- **Share Functionality**: Easy sharing of documents and deck to investors

### Navigation
- **Hamburger Menu**: Quick access to all sections with bookmarks and recent files
- **Bottom Tab Bar**: Home, Files, Graph, Capabilities, Investor, Settings
- **Breadcrumb Navigation**: Easy folder traversal in file browser

## Tech Stack

- **Framework**: Expo SDK 52 / React Native 0.76
- **Navigation**: Expo Router v4 (file-based routing)
- **State Management**: Zustand with persistence
- **Data Fetching**: TanStack React Query
- **Styling**: Custom theme system with dark/light modes
- **Visualization**: D3.js (via WebView) for knowledge graph
- **UI Components**: Custom components with Expo vector icons

## Installation

### Prerequisites
- Node.js 18+
- npm or pnpm
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`

### Setup

```bash
# Clone and navigate to the project
cd ankr-viewer-mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

## Building for Production

### Android APK (for testing)

```bash
# Build preview APK
eas build -p android --profile preview

# Or build locally
npx expo prebuild
cd android && ./gradlew assembleRelease
```

### Android App Bundle (for Play Store)

```bash
eas build -p android --profile production
```

### iOS (requires Apple Developer account)

```bash
# Build for TestFlight
eas build -p ios --profile production

# Submit to App Store
eas submit -p ios
```

## Project Structure

```
ankr-viewer-mobile/
├── app/                      # Expo Router pages
│   ├── (tabs)/               # Bottom tab navigation
│   │   ├── index.tsx         # Home screen
│   │   ├── files.tsx         # File browser
│   │   ├── graph.tsx         # Knowledge graph
│   │   ├── capabilities.tsx  # Platform capabilities
│   │   ├── investor.tsx      # Investor dashboard
│   │   └── settings.tsx      # App settings
│   ├── viewer/
│   │   └── [path].tsx        # Document viewer
│   ├── search/
│   │   └── index.tsx         # Search screen
│   └── _layout.tsx           # Root layout with drawer
├── src/
│   ├── components/           # Reusable components
│   ├── context/
│   │   └── store.ts          # Zustand store
│   ├── services/
│   │   └── api.ts            # API client
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── utils/
│       └── theme.ts          # Theme configuration
├── assets/                   # Images, icons, splash
├── app.json                  # Expo configuration
├── eas.json                  # EAS Build configuration
└── package.json
```

## API Integration

The app connects to the ANKR Viewer backend at `https://ankr.in/api/`:

- `GET /files` - List directory contents
- `GET /file` - Get file content with frontmatter
- `GET /search` - Full-text search
- `GET /knowledge/graph` - Knowledge graph data
- `GET /knowledge/topics` - List topics
- `GET /bookmarks` - User bookmarks
- `GET /recent` - Recent files

## Customization

### Changing API URL
1. Open Settings in the app
2. Enter your custom API URL
3. Tap Save

Or modify `src/services/api.ts`:
```typescript
const DEFAULT_API_URL = 'https://your-api.com';
```

### Theme Customization
Edit `src/utils/theme.ts` to modify colors, spacing, and typography.

## Sharing with Investors

1. Build the APK using EAS:
   ```bash
   eas build -p android --profile preview
   ```

2. Download the APK from the EAS dashboard

3. Share the APK directly or upload to:
   - Firebase App Distribution
   - Google Drive
   - Your company's internal distribution

4. For iOS, use TestFlight:
   ```bash
   eas build -p ios --profile production
   eas submit -p ios
   ```

## Supported File Types

| Type | Extensions | Viewer |
|------|------------|--------|
| Markdown | .md, .mdx | Native Markdown renderer |
| PDF | .pdf | WebView PDF viewer |
| Code | .js, .ts, .py, .json, etc. | Syntax highlighted |
| Images | .png, .jpg, .gif, .svg | Native image viewer |
| HTML | .html | WebView |
| Plain Text | .txt, etc. | Native text view |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Proprietary - ANKR Technologies Pvt. Ltd. © 2026

## Contact

- **Email**: support@ankr.in
- **Website**: https://ankr.in
- **Documentation**: https://ankr.in/viewer/
