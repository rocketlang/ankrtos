# 🎓 ANKR LMS - Demo Users

**Created:** 2026-01-23
**Password for all:** `Demo123!`

---

## 👥 Demo Accounts

### 1. **Admin Account** 🔧
```
Email: admin@ankr.demo
Password: Demo123!
Role: Admin
```

**Permissions:**
- Full system access
- User management
- Feature flag control
- Subject creation
- Enrollment management
- System analytics
- Audit logs

### 2. **Teacher Account** 📚
```
Email: teacher@ankr.demo
Password: Demo123!
Role: Teacher
```

**Permissions:**
- View all documents
- Upload documents
- Create assignments
- Grade students
- Manage classes
- Use AI features
- View analytics

### 3. **Student (Class 11)** 🎒
```
Email: student11@ankr.demo
Password: Demo123!
Role: Student
Class: 11
```

**Enrollments:**
- Mathematics (MATH11)
- Physics (PHY11)

**Permissions:**
- View enrolled subjects only
- Translate documents
- Submit assignments
- Use voice features

### 4. **Student (Class 12)** 🎓
```
Email: student12@ankr.demo
Password: Demo123!
Role: Student
Class: 12
```

**Enrollments:**
- Mathematics (MATH12)
- Physics (PHY12)

**Permissions:**
- View enrolled subjects only
- Translate documents
- Submit assignments
- Use voice features

---

## 📚 Demo Subjects

| Code | Name | Class | Description |
|------|------|-------|-------------|
| MATH11 | Mathematics | 11 | Algebra, Calculus, Geometry |
| PHY11 | Physics | 11 | Mechanics, Thermodynamics, Optics |
| CHEM11 | Chemistry | 11 | Organic, Inorganic, Physical Chemistry |
| MATH12 | Mathematics | 12 | Advanced Calculus, Vectors, Probability |
| PHY12 | Physics | 12 | Electromagnetism, Modern Physics, Waves |
| CHEM12 | Chemistry | 12 | Chemical Kinetics, Electrochemistry |

---

## 🧪 Testing Flow

### 1. Login as Student
```bash
# Navigate to http://localhost:3199
# Click "login"
# Enter: student11@ankr.demo / Demo123!
```

**Expected:**
- Can see documents for MATH11 and PHY11 only
- Cannot see MATH12, PHY12, or other subjects
- Can translate documents
- Cannot access admin dashboard

### 2. Login as Teacher
```bash
# Enter: teacher@ankr.demo / Demo123!
```

**Expected:**
- Can see ALL documents
- Can upload new documents
- Can create assignments
- Has AI assistant access
- Cannot access admin dashboard

### 3. Login as Admin
```bash
# Enter: admin@ankr.demo / Demo123!
```

**Expected:**
- Full access to everything
- Can access admin dashboard
- Can manage users (change roles, class levels)
- Can toggle features on/off
- Can create subjects and enrollments
- Can view audit logs

---

## 🔐 Testing Admin Dashboard

Once logged in as admin:

1. Click "🔧 admin" button in top-right
2. Navigate tabs:
   - **Users:** View all users, change roles
   - **Features:** Toggle features (ai_bot, translation, etc.)
   - **Subjects:** View/create subjects
   - **Enrollments:** View/create student enrollments

### Try These Actions:

**Change Student Role:**
1. Go to Users tab
2. Find student11@ankr.demo
3. Change role to "teacher"
4. Logout and login as student11@ankr.demo
5. Now has teacher permissions!

**Toggle AI Bot:**
1. Go to Features tab
2. Find "ai_bot" feature
3. Uncheck "student" checkbox
4. Students can no longer use AI bot
5. Teachers and admins still can

**Create Enrollment:**
1. Go to Enrollments tab
2. Click "+ add enrollment"
3. Enter: student11@ankr.demo
4. Subject: CHEM11
5. Student now has Chemistry access!

---

## 🌐 OAuth Testing

For Google/GitHub/Microsoft OAuth:

1. Add credentials to `.env`:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
# etc.
```

2. Restart server
3. OAuth buttons will work on login page

---

## 📊 API Testing

### Get Current User
```bash
# Login first, then:
curl -X GET http://localhost:3199/api/auth/me \
  --cookie "session=YOUR_SESSION_TOKEN"
```

### Login Programmatically
```bash
curl -X POST http://localhost:3199/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ankr.demo","password":"Demo123!"}'
```

### Check Features
```bash
curl -X GET http://localhost:3199/api/auth/features \
  --cookie "session=YOUR_SESSION_TOKEN"
```

### Get All Users (Admin Only)
```bash
curl -X GET http://localhost:3199/api/admin/users \
  --cookie "session=YOUR_SESSION_TOKEN"
```

---

## 🔄 Reset Demo Data

To reset all demo users and data:

```bash
PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon << EOF
DELETE FROM enrollments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@ankr.demo');
DELETE FROM subjects WHERE code IN ('MATH11', 'PHY11', 'CHEM11', 'MATH12', 'PHY12', 'CHEM12');
DELETE FROM users WHERE email LIKE '%@ankr.demo';
EOF

# Re-run seed script
PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -f src/server/db/seed.sql
```

---

**Built with @ankr/oauth + @ankr/iam**
**Server:** http://localhost:3199
**Ready to test!** 🚀
