# CoralsAstrology 🔮✨

**Founded by Jyotish Acharya Rakesh Sharma**

A modern, AI-powered astrology platform providing personalized horoscopes, birth chart analysis, and astrology consultations. Combining 25+ years of traditional Vedic wisdom with cutting-edge AI technology.

## 🌟 Features

### Core Features (MVP)
- ✅ User authentication & profiles
- ✅ Daily/Weekly/Monthly/Yearly horoscopes
- ✅ Zodiac sign calculator
- ✅ Birth chart generator
- ✅ Compatibility checker
- ✅ Astrologer consultation booking
- ✅ AI-powered personalized readings

### Advanced Features (Phase 2)
- 🔮 Real-time chat with astrologers
- 📱 Mobile app (React Native)
- 🌍 Multilingual support (English, Hindi, more)
- 💳 Payment integration (Razorpay/Stripe)
- 📧 Email notifications & reminders
- 🎨 Customizable themes
- 📊 Analytics dashboard

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js + GraphQL (Apollo Server)
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **AI:** OpenAI GPT-4 API
- **Astrology:** Swiss Ephemeris

### Frontend
- **Framework:** React 18+ with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Apollo Client + React Query
- **UI Components:** Radix UI / shadcn/ui
- **Charts:** Recharts / D3.js

### DevOps
- **Containerization:** Docker
- **Hosting:** Vercel (Frontend) + Railway (Backend)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry

## 📁 Project Structure

```
corals-astrology/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── schema/          # GraphQL schema & resolvers
│   │   ├── services/        # Business logic
│   │   ├── lib/             # Utilities (ephemeris, AI)
│   │   ├── middleware/      # Auth, validation
│   │   └── main.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # Utilities
│   │   ├── hooks/           # Custom hooks
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended) or npm

### Backend Setup

```bash
cd apps/corals-astrology/backend

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
pnpm prisma migrate dev

# Seed initial data
pnpm prisma db seed

# Start development server
pnpm dev
```

Backend will run on `http://localhost:4000`
GraphQL Playground: `http://localhost:4000/graphql`

### Frontend Setup

```bash
cd apps/corals-astrology/frontend

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Start development server
pnpm dev
```

Frontend will run on `http://localhost:5173`

## 🌊 Key Features Explained

### 1. Zodiac Sign Calculator
Automatically calculates sun sign, moon sign, and ascendant based on birth date, time, and location.

### 2. Birth Chart Generator
Uses Swiss Ephemeris for accurate planetary position calculations and generates interactive birth charts.

### 3. AI-Powered Readings
Leverages GPT-4 to generate personalized horoscope interpretations based on user's birth chart and current planetary transits.

### 4. Compatibility Checker
Analyzes synastry between two birth charts to determine relationship compatibility.

### 5. Consultation Booking
Real-time availability calendar for booking sessions with professional astrologers.

## 👨‍🏫 About the Founder

**Jyotish Acharya Rakesh Sharma** is the visionary founder and chief astrologer of CoralsAstrology. With over 25 years of deep expertise in:

- 📿 **Vedic Astrology (Jyotish Shastra)** - Traditional birth chart analysis and predictions
- 📕 **Lal Kitab** - Unique remedial astrology system with practical solutions
- 🔢 **KP System** - Krishnamurti Paddhati for precise predictions
- ❓ **Prashna Kundali** - Horary astrology for answering specific questions
- 🔮 **Numerology** - Life path and destiny number analysis
- 🏠 **Vastu Shastra** - Architectural harmony and energy flow
- 💎 **Gemstone Consultation** - Personalized gemstone recommendations

Jyotish Acharya Rakesh Sharma has guided over 1,500 clients worldwide, helping them navigate life's challenges through the ancient wisdom of Vedic astrology combined with modern AI technology. His mission is to make authentic astrological guidance accessible to everyone through CoralsAstrology.

**Contact:** acharya.rakesh@coralsastrology.com

## 🗺️ Roadmap

### Phase 1: MVP (4 weeks)
- [x] Project setup
- [ ] Database schema
- [ ] Authentication system
- [ ] Horoscope content management
- [ ] Basic birth chart calculator
- [ ] User dashboard
- [ ] Deployment

### Phase 2: Enhanced Features (4 weeks)
- [ ] AI-powered personalized readings
- [ ] Astrologer profiles & booking
- [ ] Payment integration
- [ ] Email notifications
- [ ] Advanced birth chart features
- [ ] Compatibility checker

### Phase 3: Scale & Monetization (Ongoing)
- [ ] Mobile app
- [ ] Subscription plans
- [ ] Affiliate program
- [ ] Content marketplace
- [ ] API for third-party integrations

## 📊 Business Model

### Revenue Streams
1. **Freemium Model**
   - Free: Daily horoscopes, basic birth chart
   - Premium: Detailed predictions, AI readings, priority support

2. **Consultations**
   - Commission on astrologer bookings (20-30%)
   - Platform fees

3. **Subscriptions**
   - Monthly: ₹299 / $5
   - Yearly: ₹2,499 / $40 (save 30%)

4. **API Access**
   - For developers & businesses
   - Usage-based pricing

## 🎯 Target Audience

- **Primary:** Age 18-45, spiritually inclined individuals
- **Secondary:** People seeking life guidance & self-discovery
- **Tertiary:** Astrology enthusiasts & professionals

## 📈 Market Opportunity

- Global astrology market: $12.8B (2024) → $22.8B (2031)
- India astrology apps market growing 15% YoY
- 70% of millennials check their horoscope regularly

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see LICENSE file for details

## 📞 Contact

- Website: [Coming Soon]
- Email: support@coralsastrology.com
- Twitter: @CoralsAstrology

---

Built with 💜 by the Corals Team
