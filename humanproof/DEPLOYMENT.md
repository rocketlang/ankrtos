# HumanProof Deployment Guide

## 🚀 Quick Start (Local Development)

```bash
chmod +x start.sh
./start.sh
```

This will:
1. Install dependencies for both backend and frontend
2. Initialize the SQLite database
3. Start both servers
   - Backend: http://localhost:3001
   - Frontend: http://localhost:5173

## 📦 Manual Setup

### Backend

```bash
cd backend
npm install
npm run migrate  # Initialize database
npm run dev      # Start development server
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Start development server
```

## 🌐 Production Deployment

### Option 1: Free Hosting (Recommended for MVP)

#### Backend - Railway.app (Free Tier)

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo and `backend` directory
4. Add environment variables:
   ```
   PORT=3001
   JWT_SECRET=your-production-secret-here
   NODE_ENV=production
   DATABASE_PATH=/data/humanproof.db
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
5. Railway will auto-deploy on push

#### Frontend - Vercel (Free Tier)

1. Create account at [vercel.com](https://vercel.com)
2. Click "New Project" → Import Git Repository
3. Select `frontend` directory
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
5. Deploy!

### Option 2: VPS Deployment

#### Requirements
- Ubuntu 20.04+
- Node.js 18+
- nginx
- PM2

#### Setup

```bash
# Install dependencies
sudo apt update
sudo apt install -y nodejs npm nginx

# Install PM2
npm install -g pm2

# Clone repo
git clone https://github.com/yourusername/humanproof.git
cd humanproof

# Backend setup
cd backend
npm install
npm run migrate
npm run build

# Start with PM2
pm2 start dist/server.js --name humanproof-api
pm2 save
pm2 startup

# Frontend setup
cd ../frontend
npm install
npm run build

# Configure nginx
sudo nano /etc/nginx/sites-available/humanproof
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/humanproof/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/humanproof /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔐 Security Checklist

Before going to production:

- [ ] Change JWT_SECRET to a strong random value
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS (use Let's Encrypt)
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Add rate limiting to API endpoints
- [ ] Monitor server logs

## 📊 Database Migration (SQLite → PostgreSQL)

For production at scale, migrate to PostgreSQL:

```bash
# Install PostgreSQL driver
npm install pg

# Update database.ts to use PostgreSQL
# Update connection string in .env
DATABASE_URL=postgresql://user:password@host:5432/humanproof
```

## 🎯 Post-Deployment

1. Test registration and login
2. Complete a challenge
3. Request certificate
4. Verify API endpoints
5. Check error handling

## 💰 Scaling Considerations

**When to upgrade:**
- SQLite → PostgreSQL: 1,000+ users
- Single server → Load balancer: 10,000+ users
- Add Redis for caching: 50,000+ users
- CDN for static assets: Always beneficial

## 🐛 Troubleshooting

**Backend won't start:**
- Check `DATABASE_PATH` exists and is writable
- Verify JWT_SECRET is set
- Check port 3001 is available

**Frontend can't connect:**
- Verify `VITE_API_URL` points to backend
- Check CORS configuration in backend
- Ensure backend is running

**Database errors:**
- Run `npm run migrate` again
- Check file permissions on .db file
- Ensure SQLite is installed

## 📈 Monitoring

Recommended tools:
- **Uptime:** UptimeRobot (free)
- **Errors:** Sentry (free tier)
- **Analytics:** Plausible or Simple Analytics
- **Logs:** PM2 logs or Railway logs

---

Built with ❤️ using Claude Code
