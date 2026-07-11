import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiRoutes from './routes/index.js';
import { handleWebhook } from './controllers/stripeController.js';
import { standardLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Performance Optimization: Gzip Compression
app.use(compression());

// Security Optimization: Secure HTTP Headers
app.use(helmet());

// Security Optimization: CORS Policy Control
app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Stripe Webhook must be parsed as raw buffer for signature verification
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), handleWebhook);

// Security Optimization: Limit JSON payload size to prevent Denial of Service (DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply standard rate limiter globally under /api
app.use('/api', standardLimiter);

// Mount API routes
app.use('/api', apiRoutes);

// Centralized error handling middleware (must be registered last)
app.use(errorHandler);

export default app;
