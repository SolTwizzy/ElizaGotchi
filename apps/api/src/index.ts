import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { agentRoutes } from './routes/agents';
import { connectionRoutes } from './routes/connections';
import { userRoutes } from './routes/users';
import { webhookRoutes } from './routes/webhooks';
import { authRoutes } from './routes/auth';
import { internalRoutes } from './routes/internal';
import { telegramBotRouter } from './services/telegram-bot';
import { botService } from './services/bot-service';
import type { AppContext } from './types';

// Initialize bot service on startup
botService.initialize().catch((err) => {
  console.error('[API] Failed to initialize bot service:', err);
});

const app = new Hono<AppContext>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow configured origins (comma-separated for multiple)
      const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim());

      if (origin && allowedOrigins.includes(origin)) return origin;
      // Allow localhost on any port for development
      if (origin?.startsWith('http://localhost:')) return origin;
      // Return first allowed origin as fallback
      return allowedOrigins[0];
    },
    credentials: true,
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/agents', agentRoutes);
app.route('/api/connections', connectionRoutes);
app.route('/api/users', userRoutes);
app.route('/api/webhooks', webhookRoutes);
app.route('/api/internal', internalRoutes);
app.route('/api/telegram', telegramBotRouter);

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);

  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message, code: err.status },
      err.status
    );
  }

  return c.json(
    { error: 'Internal server error', code: 500 },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found', code: 404 }, 404);
});

const port = parseInt(process.env.PORT || '4000', 10);

console.log(`Starting API server on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
