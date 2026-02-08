import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/database';

// Routes
import authRoutes from './routes/auth';
import challengeRoutes from './routes/challenges';
import verificationRoutes from './routes/verification';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Initialize database
initializeDatabase();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'HumanProof API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/verification', verificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
🚀 HumanProof API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server running on: http://localhost:${PORT}
🔐 Environment: ${process.env.NODE_ENV || 'development'}
🎯 Frontend URL: ${FRONTEND_URL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready to verify humans! 🤖❌
  `);
});
