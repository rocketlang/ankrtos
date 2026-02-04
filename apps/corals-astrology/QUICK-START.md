# 🚀 CoralsAstrology - Quick Start Guide

Get your astrology platform running in **5 minutes**!

---

## 📋 Prerequisites

```bash
# Check if you have these installed:
node --version    # v20+ required
npm --version     # v9+ required
psql --version    # PostgreSQL 15+ required
```

---

## ⚡ Quick Setup (Copy & Paste)

### 1. Navigate to Project
```bash
cd /root/apps/corals-astrology
```

### 2. Backend Setup
```bash
# Go to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file (update DATABASE_URL, JWT_SECRET, OPENAI_API_KEY)
nano .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run prisma:seed

# Start backend server
npm run dev
```

**Backend should now be running on:** http://localhost:4000
**GraphQL Playground:** http://localhost:4000/graphql

### 3. Frontend Setup (New Terminal)
```bash
# Go to frontend
cd /root/apps/corals-astrology/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

**Frontend should now be running on:** http://localhost:5173

---

## 🐳 Docker Setup (Alternative)

```bash
# From project root
cd /root/apps/corals-astrology

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🧪 Test the API

### Using cURL
```bash
# Health check
curl http://localhost:4000/health

# GraphQL query (get horoscope)
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ dailyHoroscope(zodiacSign: LEO) { overview love career } }"
  }'
```

### Using GraphQL Playground
1. Open http://localhost:4000/graphql
2. Try this query:
```graphql
query {
  dailyHoroscope(zodiacSign: LEO) {
    overview
    love
    career
    finance
    health
    lucky
    loveRating
    careerRating
  }
}
```

---

## 📱 Access the App

1. **Open Browser:** http://localhost:5173
2. **Click "Get Started Free"**
3. **Sign up with email**
4. **Generate your Kundli!**

---

## 🔑 Default Credentials

### Admin User
- **Email:** admin@coralsastrology.com
- **Password:** admin123

### Astrologer
- **Email:** swami@coralsastrology.com
- **Password:** astrologer123

---

## 🛠️ Common Commands

### Backend
```bash
cd /root/apps/corals-astrology/backend

# Development
npm run dev

# Build
npm run build

# Production
npm start

# Prisma Studio (Database GUI)
npm run prisma:studio

# Generate types
npm run prisma:generate

# Create migration
npx prisma migrate dev --name your_migration_name

# Seed data
npm run prisma:seed

# Lint
npm run lint
```

### Frontend
```bash
cd /root/apps/corals-astrology/frontend

# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Generate GraphQL types
npm run codegen

# Lint
npm run lint
```

---

## 📂 Project Structure

```
corals-astrology/
├── backend/                    # Node.js + GraphQL API
│   ├── prisma/                # Database schema & migrations
│   │   ├── schema.prisma      # Main schema
│   │   ├── vedic-schema.prisma # Vedic models
│   │   ├── tarot-schema.prisma # Tarot models
│   │   └── seed.ts            # Seed data
│   ├── src/
│   │   ├── lib/               # Utilities
│   │   │   └── vedic-engine.ts # Vedic calculations
│   │   ├── schema/            # GraphQL
│   │   │   ├── typeDefs.ts    # Schema definitions
│   │   │   ├── resolvers.ts   # Query/Mutation handlers
│   │   │   └── context.ts     # Request context
│   │   └── main.ts            # Server entry
│   └── package.json
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── lib/               # Utilities
│   │   ├── App.tsx            # Main app
│   │   └── main.tsx           # Entry point
│   └── package.json
│
└── docs/                       # Documentation
    ├── README.md              # Project overview
    ├── TODO.md                # Task list
    ├── FEATURE-BRAINSTORM.md  # Feature ideas
    └── QUICK-START.md         # This file
```

---

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Create database manually
psql -U postgres -c "CREATE DATABASE corals_astrology;"
```

### Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=4001
```

### Swiss Ephemeris Not Found
```bash
# Install Swiss Ephemeris files
mkdir -p /usr/share/swisseph
cd /usr/share/swisseph

# Download ephemeris data
wget https://www.astro.com/ftp/swisseph/ephe/seas_18.se1
# ... download other required files
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Next Steps

### Week 1: Complete Backend
- [ ] Install Swiss Ephemeris library
- [ ] Implement GraphQL resolvers
- [ ] Add authentication middleware
- [ ] Test Kundli generation
- [ ] Test Panchang calculations

### Week 2: Build Frontend
- [ ] Create all page components
- [ ] Implement authentication UI
- [ ] Build Kundli generator form
- [ ] Display horoscopes
- [ ] Add Tarot card interface

### Week 3: Advanced Features
- [ ] Real-time chat (Socket.io)
- [ ] Payment integration (Razorpay)
- [ ] AI predictions (OpenAI)
- [ ] Mobile responsiveness

### Week 4: Testing & Deploy
- [ ] Write tests (Jest, Vitest)
- [ ] E2E testing (Playwright)
- [ ] Performance optimization
- [ ] Deploy to production

---

## 📚 Key Documentation

### Internal Docs
- [README.md](./README.md) - Full project documentation
- [TODO.md](./TODO.md) - Comprehensive task list (300+ tasks)
- [FEATURE-BRAINSTORM.md](./FEATURE-BRAINSTORM.md) - Feature ideas (100+)
- [PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md) - Project overview

### External Resources
- [Prisma Docs](https://www.prisma.io/docs)
- [GraphQL Docs](https://graphql.org/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Swiss Ephemeris](https://www.astro.com/swisseph/)

---

## 💡 Pro Tips

### Development
1. **Use Prisma Studio** for easy database management
2. **Keep GraphQL Playground open** for API testing
3. **Use React DevTools** for debugging
4. **Enable hot reload** for faster development
5. **Use TypeScript strictly** for type safety

### Code Organization
1. **One resolver per file** in `backend/src/schema/resolvers/`
2. **Shared components** in `frontend/src/components/`
3. **Custom hooks** in `frontend/src/hooks/`
4. **Utilities** in respective `lib/` folders

### Performance
1. **Use DataLoader** for batching queries
2. **Implement caching** with Redis
3. **Optimize images** before upload
4. **Use CDN** for static assets
5. **Enable gzip** compression

---

## 🐛 Known Issues

### Issue: Slow Kundli Generation
**Solution:** Cache planetary positions for common dates

### Issue: Large Bundle Size
**Solution:** Implement code splitting and lazy loading

### Issue: Memory Leak in WebSocket
**Solution:** Properly cleanup socket connections on unmount

---

## 🎉 You're All Set!

Your CoralsAstrology platform is ready for development!

**Quick Links:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- GraphQL Playground: http://localhost:4000/graphql
- Prisma Studio: http://localhost:5555 (run `npm run prisma:studio`)

**Need Help?**
- Check [TODO.md](./TODO.md) for detailed tasks
- Read [FEATURE-BRAINSTORM.md](./FEATURE-BRAINSTORM.md) for feature ideas
- Review [README.md](./README.md) for comprehensive docs

---

## 🚀 Ready to Build!

```bash
# Backend Terminal 1
cd backend && npm run dev

# Frontend Terminal 2
cd frontend && npm run dev

# Open browser
open http://localhost:5173

# Start coding! 🔮✨
```

**Happy coding! May the stars align in your favor! 🌟**

---

*Last Updated: February 4, 2026*
