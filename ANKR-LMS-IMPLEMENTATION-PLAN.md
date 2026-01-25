# 📚 ANKR LMS - Complete Implementation Plan

**Vision:** Transform ANKR Interact into a full Learning Management System (LMS) with OAuth, RBAC, email integration, and student access control.

---

## 🎯 Requirements Summary

1. ✅ **OAuth Login** - Google, Microsoft, GitHub
2. ✅ **RBAC System** - Admin, Teacher, Student roles
3. 📧 **Email Integration** - User inbox integration
4. 🎓 **Student Access Control** - By class (11, 12) and subjects
5. ⚙️ **Admin Dashboard** - Separate admin page for feature management
6. 🔒 **Permission-based Features** - Enable/disable bot, translation, etc.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ANKR LMS Platform                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Student    │  │   Teacher    │  │    Admin     │  │
│  │   Portal     │  │   Portal     │  │  Dashboard   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                          │                               │
│         ┌────────────────▼────────────────┐              │
│         │      @ankr/oauth (Auth)         │              │
│         │    @ankr/iam (RBAC/Perms)       │              │
│         └────────────────┬────────────────┘              │
│                          │                               │
│         ┌────────────────▼────────────────┐              │
│         │     Backend Services Layer      │              │
│         │  - Document Access Control      │              │
│         │  - Email Integration            │              │
│         │  - Feature Toggle System        │              │
│         └────────────────┬────────────────┘              │
│                          │                               │
│         ┌────────────────▼────────────────┐              │
│         │   Database (PostgreSQL)         │              │
│         │  - Users, Roles, Permissions    │              │
│         │  - Enrollments, Classes         │              │
│         │  - Documents, Subjects          │              │
│         └─────────────────────────────────┘              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Existing Packages (Already Built!)

### 1. **@ankr/oauth** - Authentication System
**Location:** `/root/ankr-labs-nx/packages/ankr-oauth`

**Features:**
- ✅ Email/Password authentication
- ✅ Google OAuth
- ✅ GitHub OAuth (can add more providers)
- ✅ Phone/Email OTP
- ✅ JWT sessions (30 days)
- ✅ Refresh tokens
- ✅ Rate limiting
- ✅ Session fingerprinting

**Usage:**
```typescript
import { AnkrOAuth } from '@ankr/oauth';

const auth = new AnkrOAuth({ database: {...} });

// Google OAuth
const { authUrl } = auth.getGoogleAuthUrl('http://localhost:3199/auth/callback');

// GitHub OAuth
const { authUrl } = auth.getGitHubAuthUrl('http://localhost:3199/auth/callback');

// Handle callback
const { user, sessionToken } = await auth.handleGoogleCallback(code);
```

### 2. **@ankr/iam** - RBAC & Permissions
**Location:** `/root/ankr-labs-nx/packages/ankr-iam`

**Features:**
- ✅ Role-Based Access Control (RBAC)
- ✅ Attribute-Based Access Control (ABAC)
- ✅ Multi-Factor Authentication (MFA)
- ✅ Just-In-Time (JIT) access
- ✅ Session recording & audit trails
- ✅ Access reviews

**Usage:**
```typescript
import { IAMService } from '@ankr/iam';

const iam = new IAMService();

// Create roles
const studentRole = iam.createRole({
  id: 'role-student',
  name: 'Student',
  permissions: [
    'documents:read',
    'assignments:submit',
    'email:send'
  ]
});

// Check permission
const allowed = await iam.checkPermission({
  userId: 'student123',
  action: 'documents:read',
  resource: 'class/11/math/chapter1.md'
});
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  role VARCHAR(50) DEFAULT 'student',
  class_level INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Enrollments Table
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subject_id UUID REFERENCES subjects(id),
  class_level INTEGER NOT NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active'
);
```

### Subjects Table
```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  class_level INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  class_level INTEGER NOT NULL,
  content_type VARCHAR(50),
  access_level VARCHAR(50) DEFAULT 'enrolled',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Feature Flags Table
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  role_restrictions JSONB,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 UI Components Needed

### 1. **Login Page** (`/login`)
- OAuth buttons (Google, Microsoft, GitHub)
- Email/Password login
- Forgot password link
- Sign up link

### 2. **Student Dashboard** (`/student`)
- My Classes (11, 12, etc.)
- My Subjects (enrolled only)
- Recent Documents
- Assignments
- Email inbox (integrated)

### 3. **Teacher Dashboard** (`/teacher`)
- My Classes
- All Subjects
- Upload Documents
- Grade Assignments
- Email students

### 4. **Admin Dashboard** (`/admin`)
- User Management
- Role Assignment
- Feature Flags Management
  - Toggle Translation
  - Toggle AI Bot
  - Toggle Voice Features
- System Analytics
- Enrollment Management

### 5. **Document Viewer** (existing, needs access control)
- Check user permissions before showing
- Filter by enrolled subjects/class
- Show only allowed features per role

---

## 🔐 RBAC Permission Matrix

| Feature | Student | Teacher | Admin |
|---------|---------|---------|-------|
| View enrolled documents | ✅ | ✅ | ✅ |
| View all documents | ❌ | ✅ | ✅ |
| Upload documents | ❌ | ✅ | ✅ |
| Delete documents | ❌ | ❌ | ✅ |
| Use AI translation | ✅ | ✅ | ✅ |
| Use AI bot | ⚙️ | ⚙️ | ✅ |
| Send email | ✅ | ✅ | ✅ |
| Access admin panel | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Toggle features | ❌ | ❌ | ✅ |

⚙️ = Admin-controlled (can be enabled/disabled)

---

## 📧 Email Integration Options

### Option 1: **IMAP/SMTP Integration** (Self-hosted)
- Integrate with user's existing email
- Use NodeMailer + IMAP
- Pros: Use existing emails
- Cons: Need user email credentials

### Option 2: **Platform Email** (Recommended)
- Give each user a `student@ankrlms.in` email
- Built-in email service
- Pros: Full control, better security
- Cons: Need email infrastructure

### Option 3: **Gmail API Integration**
- OAuth to Gmail
- Read/send via Gmail API
- Pros: Users keep their Gmail
- Cons: Google API quotas

**Recommended:** Start with Option 2 (Platform Email) using existing infrastructure.

---

## 🚀 Implementation Phases

### **Phase 1: OAuth & Basic RBAC** (Week 1)
1. Install & configure `@ankr/oauth`
2. Install & configure `@ankr/iam`
3. Create login page with Google OAuth
4. Create database tables
5. Implement basic user roles (Student, Teacher, Admin)
6. Add role-based routing

**Deliverable:** Users can login with Google and see role-specific dashboards

### **Phase 2: Student Access Control** (Week 2)
1. Create enrollment system
2. Add subject management
3. Implement document filtering by:
   - Class level
   - Enrolled subjects
4. Update document viewer with access checks
5. Create student dashboard

**Deliverable:** Students see only their enrolled class/subject materials

### **Phase 3: Admin Dashboard** (Week 3)
1. Create admin-only route `/admin`
2. Build user management UI
3. Build enrollment management UI
4. Build feature flags system
5. Add toggle switches for:
   - AI Translation
   - AI Bot
   - Voice Features
   - Publishing

**Deliverable:** Admin can manage users and toggle features

### **Phase 4: Email Integration** (Week 4)
1. Set up email service (NodeMailer + SMTP)
2. Create inbox UI component
3. Add compose email feature
4. Add email notifications for:
   - New assignments
   - Document uploads
   - System announcements
5. Integrate with user profiles

**Deliverable:** Users can send/receive emails within platform

### **Phase 5: Teacher Features** (Week 5)
1. Create teacher dashboard
2. Add document upload with class/subject tagging
3. Add assignment creation
4. Add grading interface
5. Add bulk email to class

**Deliverable:** Teachers can manage their classes

---

## 🔧 Technical Implementation

### 1. **Install Dependencies**
```bash
cd /root/ankr-labs-nx/packages/ankr-interact

# Add OAuth and IAM
pnpm add @ankr/oauth @ankr/iam

# Add email
pnpm add nodemailer @types/nodemailer imap

# Add auth middleware
pnpm add jsonwebtoken @types/jsonwebtoken
```

### 2. **Server Setup**
```typescript
// src/server/index.ts
import { AnkrOAuth } from '@ankr/oauth';
import { IAMService } from '@ankr/iam';

const auth = new AnkrOAuth({
  database: {
    host: 'localhost',
    port: 5432,
    database: 'ankr_eon',
    user: 'ankr',
    password: process.env.DB_PASSWORD
  }
});

const iam = new IAMService();

// Auth routes
app.get('/auth/google', async (req, reply) => {
  const { authUrl } = auth.getGoogleAuthUrl(
    'http://localhost:3199/auth/google/callback'
  );
  reply.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, reply) => {
  const { code } = req.query;
  const result = await auth.handleGoogleCallback(code);

  // Set session cookie
  reply.setCookie('session', result.sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  });

  reply.redirect('/dashboard');
});
```

### 3. **Auth Middleware**
```typescript
// src/server/middleware/auth.ts
export async function authMiddleware(req, reply) {
  const token = req.cookies.session;

  if (!token) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  const session = await auth.validateSession(token);
  if (!session) {
    reply.status(401).send({ error: 'Invalid session' });
    return;
  }

  req.user = session.user;
}

export function requireRole(role: string) {
  return async (req, reply) => {
    await authMiddleware(req, reply);

    if (req.user.role !== role) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }
  };
}
```

### 4. **Frontend Auth**
```typescript
// src/client/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  const login = () => {
    window.location.href = '/auth/google';
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, login, logout };
}
```

### 5. **Access Control Hook**
```typescript
// src/client/hooks/usePermission.ts
export function usePermission(action: string, resource?: string) {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetch('/api/permissions/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, resource })
    })
      .then(res => res.json())
      .then(data => setAllowed(data.allowed));
  }, [user, action, resource]);

  return { allowed };
}
```

---

## 📁 File Structure

```
ankr-interact/
├── src/
│   ├── server/
│   │   ├── index.ts
│   │   ├── auth/
│   │   │   ├── oauth.ts
│   │   │   ├── middleware.ts
│   │   │   └── routes.ts
│   │   ├── rbac/
│   │   │   ├── permissions.ts
│   │   │   ├── roles.ts
│   │   │   └── access-control.ts
│   │   ├── email/
│   │   │   ├── service.ts
│   │   │   └── routes.ts
│   │   ├── enrollment/
│   │   │   ├── service.ts
│   │   │   └── routes.ts
│   │   └── features/
│   │       ├── flags.ts
│   │       └── routes.ts
│   └── client/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── StudentDashboard.tsx
│       │   ├── TeacherDashboard.tsx
│       │   └── AdminDashboard.tsx
│       ├── components/
│       │   ├── auth/
│       │   │   ├── LoginButton.tsx
│       │   │   └── ProtectedRoute.tsx
│       │   ├── admin/
│       │   │   ├── UserManagement.tsx
│       │   │   ├── FeatureToggles.tsx
│       │   │   └── EnrollmentManager.tsx
│       │   └── email/
│       │       ├── Inbox.tsx
│       │       └── Compose.tsx
│       └── hooks/
│           ├── useAuth.ts
│           ├── usePermission.ts
│           └── useEnrollment.ts
```

---

## ✅ Next Steps

1. **Review this plan** - Confirm requirements and approach
2. **Set up database** - Create tables for users, enrollments, etc.
3. **Start Phase 1** - OAuth integration and basic RBAC
4. **Iterate** - Build features incrementally with testing

---

## 🎯 Success Metrics

- ✅ Users can login with Google OAuth
- ✅ Students see only enrolled materials
- ✅ Teachers can upload and manage documents
- ✅ Admin can toggle features on/off
- ✅ Email integration works end-to-end
- ✅ RBAC prevents unauthorized access

---

**Ready to implement?** Let me know which phase to start with! 🚀
