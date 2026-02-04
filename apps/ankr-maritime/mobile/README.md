# Mari8X Mobile App

Mobile application for Mari8X field agents, vessel masters, and port agents.

## Features

- 📱 **Real-time voyage tracking** - Live AIS position updates via WebSocket
- 📸 **Document capture** - Camera integration for capturing documents, damage photos
- 📍 **Location tracking** - GPS tracking for port agent visits
- 📋 **Task management** - Field task checklists and completion
- 🔔 **Push notifications** - Real-time alerts for voyage events
- 📊 **Offline mode** - Works offline, syncs when connection available

## Tech Stack

- **React Native** (Expo) - Cross-platform mobile framework
- **Apollo Client** - GraphQL client with WebSocket support
- **Expo Router** - File-based navigation
- **React Native Maps** - Interactive maps
- **AsyncStorage** - Local data persistence

## Getting Started

```bash
# Install dependencies
cd apps/ankr-maritime/mobile
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## User Roles

- **Vessel Master** - Noon reports, position updates, bunker ROB
- **Port Agent** - PDA documentation, arrival/departure reports
- **Field Agent** - Document capture, inspection checklists
- **Surveyor** - Inspection reports with photos

## Screens

1. **Dashboard** - Quick stats, pending tasks
2. **Voyages** - Active voyages with real-time map
3. **Documents** - Document vault, camera upload
4. **Tasks** - Checklist management
5. **Profile** - User settings, offline sync

## Build for Production

```bash
# Build APK (Android)
eas build --platform android

# Build IPA (iOS)
eas build --platform ios
```

## Environment Variables

Create `.env`:

```bash
BACKEND_URL=https://mari8x.ankr.com
WS_URL=wss://mari8x.ankr.com/graphql
```

---

*Part of the Mari8X Maritime Operations Platform*
