import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initProto } from './proto/serializer';
import { query, closePool } from './db/connection';
import meetingsRouter from './routes/meetings';
import importRouter from './routes/import';
import sessionsRouter from './routes/sessions';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Initialize protobuf serializers
initProto();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (also used to check if DB has data)
app.get('/health', async (_req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM sessions');
    const sessionCount = parseInt(result.rows[0].count, 10);
    res.json({ has_data: sessionCount > 0, session_count: sessionCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Database connection failed', message: err.message });
  }
});

// Routes
app.use('/meetings', meetingsRouter);
app.use('/import', importRouter);
app.use('/sessions', sessionsRouter);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Unknown error'
  });
});

// Start server
async function start() {
  try {
    // Test database connection
    await query('SELECT 1');
    console.log('Database connected');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await closePool();
  process.exit(0);
});
