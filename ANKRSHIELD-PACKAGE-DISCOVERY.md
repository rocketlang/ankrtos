
# ANKRShield Package Discovery Report
**Generated:** 2026-01-23T18:14:23.995Z
**Total Extractable Packages:** 25

## Summary

- ✅ **High Reusability:** 19 packages
- 🟡 **Medium Reusability:** 6 packages
- 📦 **Total Size:** 51.0 KB

## By Category

- **Backend Services:** 4
- **Frontend Components:** 18
- **Mobile Components:** 0
- **Shared Utilities:** 1
- **Security Services:** 2

---

## High Priority Packages


### @ankrshield/auth-jwt
- **Description:** JWT token utilities
- **Category:** security
- **Exports:** JWTPayload, extractToken
- **Dependencies:** 1 (fastify)
- **Size:** 0.6 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/api/src/auth/jwt.ts`


### @ankrshield/graphql-auth
- **Description:** Authentication GraphQL Types
- **Category:** backend
- **Exports:** RegisterInput, LoginInput
- **Dependencies:** 0 ()
- **Size:** 0.7 KB
- **Reason:** GraphQL type definitions - highly reusable
- **Path:** `/apps/api/src/graphql/types/auth.ts`


### @ankrshield/graphql-user
- **Description:** User GraphQL Type
- **Category:** backend
- **Exports:** UserRef
- **Dependencies:** 1 (@prisma/client)
- **Size:** 1.9 KB
- **Reason:** GraphQL type definitions - highly reusable
- **Path:** `/apps/api/src/graphql/types/user.ts`


### @ankrshield/util-jwt
- **Description:** JWT Helper - singleton to access Fastify JWT instance
- **Category:** shared
- **Exports:** generateToken, verifyToken
- **Dependencies:** 1 (jsonwebtoken)
- **Size:** 0.5 KB
- **Reason:** Utility functions - highly reusable
- **Path:** `/apps/api/src/utils/jwt-helper.ts`


### @ankrshield/monitor-traffic
- **Description:** Network Traffic Monitor
- **Category:** security
- **Exports:** startMonitor, stopMonitor, getMonitor, default
- **Dependencies:** 2 (pg, events)
- **Size:** 7.8 KB
- **Reason:** Multiple exports, Well documented, Type-safe, Few dependencies
- **Path:** `/apps/api/src/monitor/traffic-monitor.ts`


### @ankrshield-ui/table
- **Description:** Table Component
- **Category:** frontend
- **Exports:** TableHeader, TableBody, TableRow, TableHead, TableCell, default
- **Dependencies:** 0 ()
- **Size:** 1.5 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/apps/web/src/components/ui/Table.tsx`


### @ankrshield-ui/select
- **Description:** Select Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 1 (react)
- **Size:** 1.2 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/web/src/components/ui/Select.tsx`


### @ankrshield-ui/input
- **Description:** Input Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 1 (react)
- **Size:** 1.1 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/web/src/components/ui/Input.tsx`


### @ankrshield-ui/checkbox
- **Description:** Checkbox Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 1 (react)
- **Size:** 0.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/web/src/components/ui/Checkbox.tsx`


### @ankrshield-ui/card
- **Description:** Card Component
- **Category:** frontend
- **Exports:** CardHeader, CardBody, CardFooter, default
- **Dependencies:** 0 ()
- **Size:** 1.2 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/apps/web/src/components/ui/Card.tsx`


### @ankrshield-ui/button
- **Description:** Button Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 1 (react)
- **Size:** 2.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/web/src/components/ui/Button.tsx`


### @ankrshield-ui/badge
- **Description:** Badge Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 0 ()
- **Size:** 0.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/apps/web/src/components/ui/Badge.tsx`


### @ankrshield-ui/alert
- **Description:** Alert Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 2 (lucide-react, react)
- **Size:** 1.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/web/src/components/ui/Alert.tsx`


### @ankrshield-ui/layout-sidebar
- **Description:** Sidebar Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 2 (react-router-dom, lucide-react)
- **Size:** 1.6 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/web/src/components/layout/Sidebar.tsx`


### @ankrshield-ui/layout-contentwrapper
- **Description:** Content Wrapper Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 0 ()
- **Size:** 0.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/apps/web/src/components/layout/ContentWrapper.tsx`


### @ankrshield/desktop-preload
- **Description:** Preload script for Electron
- **Category:** frontend
- **Exports:** ElectronAPI
- **Dependencies:** 1 (electron)
- **Size:** 2.2 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/desktop/src/preload.ts`


### @ankrshield/desktop-App
- **Description:** Main React App Component
- **Category:** frontend
- **Exports:** default
- **Dependencies:** 2 (react, react-router-dom)
- **Size:** 2.1 KB
- **Reason:** Well documented, Generic implementation, Few dependencies
- **Path:** `/apps/desktop/src/renderer/App.tsx`


### @ankrshield/desktop-index
- **Description:** Preload Script
- **Category:** frontend
- **Exports:** ElectronAPI
- **Dependencies:** 1 (electron)
- **Size:** 4.2 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/apps/desktop/src/preload/index.ts`


### @ankrshield/desktop-updater
- **Description:** Auto-Updater
- **Category:** frontend
- **Exports:** setupAutoUpdater, checkForUpdates, quitAndInstall, cleanupUpdater
- **Dependencies:** 2 (electron-updater, electron)
- **Size:** 2.5 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Few dependencies
- **Path:** `/apps/desktop/src/main/updater.ts`


---

## Publishing Commands

```bash
# Top 5 packages
mkdir -p /root/ankr-packages/auth-jwt
cp /root/ankrshield/apps/api/src/auth/jwt.ts /root/ankr-packages/auth-jwt/
cd /root/ankr-packages/auth-jwt && npm init -y && npm publish --registry http://localhost:4873

mkdir -p /root/ankr-packages/graphql-auth
cp /root/ankrshield/apps/api/src/graphql/types/auth.ts /root/ankr-packages/graphql-auth/
cd /root/ankr-packages/graphql-auth && npm init -y && npm publish --registry http://localhost:4873

mkdir -p /root/ankr-packages/graphql-user
cp /root/ankrshield/apps/api/src/graphql/types/user.ts /root/ankr-packages/graphql-user/
cd /root/ankr-packages/graphql-user && npm init -y && npm publish --registry http://localhost:4873

mkdir -p /root/ankr-packages/util-jwt
cp /root/ankrshield/apps/api/src/utils/jwt-helper.ts /root/ankr-packages/util-jwt/
cd /root/ankr-packages/util-jwt && npm init -y && npm publish --registry http://localhost:4873

mkdir -p /root/ankr-packages/monitor-traffic
cp /root/ankrshield/apps/api/src/monitor/traffic-monitor.ts /root/ankr-packages/monitor-traffic/
cd /root/ankr-packages/monitor-traffic && npm init -y && npm publish --registry http://localhost:4873
```

---

**Total Packages Identified:** 25
**Ready to Publish:** 19
