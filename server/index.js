import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import estimateRoutes from './routes/estimates.js';
import stripeRoutes from './routes/stripe.js';
import ghlRoutes from './routes/ghl.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL || ''
  ].filter(Boolean)
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.USE_MOCK === 'true' ? 'mock' : 'live',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/estimates', estimateRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/ghl', ghlRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`AiRCO API running on port ${PORT} [${process.env.USE_MOCK === 'true' ? 'MOCK MODE' : 'LIVE MODE'}]`);
});
