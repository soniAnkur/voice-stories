import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mixRoute } from './routes/mix.js';
import { healthRoute } from './routes/health.js';
import { authMiddleware } from './lib/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Parse allowed origins from env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Parse JSON with larger limit for audio data
app.use(express.json({ limit: '100mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check (no auth required)
app.use('/api/health', healthRoute);

// Protected routes
app.use('/api/mix', authMiddleware, mixRoute);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           FFmpeg API Server Started               ║
╠═══════════════════════════════════════════════════╣
║  Port: ${PORT}                                       ║
║  Health: http://localhost:${PORT}/api/health         ║
║  Mix:    http://localhost:${PORT}/api/mix            ║
╚═══════════════════════════════════════════════════╝
  `);
});
