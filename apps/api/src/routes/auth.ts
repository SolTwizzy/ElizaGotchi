import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq, or, and, gt } from 'drizzle-orm';
import { lucia } from '../lib/auth';
import { db, users, subscriptions, passwordResetTokens } from '@elizagotchi/database';
import { sessionMiddleware, requireAuth } from '../middleware/auth';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../lib/email';
import type { AppContext } from '../types';
import { generateId } from 'lucia';
import { z } from 'zod';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

export const authRoutes = new Hono<AppContext>();

// Apply session middleware to all routes
authRoutes.use('*', sessionMiddleware);

// Get current user
authRoutes.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({ user });
});

// Logout
authRoutes.post('/logout', requireAuth, async (c) => {
  const session = c.get('session');
  await lucia.invalidateSession(session.id);
  const cookie = lucia.createBlankSessionCookie();
  c.header('Set-Cookie', cookie.serialize());
  return c.json({ success: true });
});

// Email/Password Signup
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

authRoutes.post('/signup', async (c) => {
  const body = await c.req.json();
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    throw new HTTPException(400, { message: 'Invalid input' });
  }

  const { email, password, name } = result.data;

  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new HTTPException(400, { message: 'Email already registered' });
  }

  // Hash password using Bun's built-in
  const passwordHash = await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  // Create user
  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    name: name || email.split('@')[0],
  });

  // Create default free subscription
  await db.insert(subscriptions).values({
    userId,
    plan: 'free',
    maxAgents: 1,
    maxMessagesPerMonth: 100,
  });

  // Send welcome email (async, don't wait)
  sendWelcomeEmail(email, name || email.split('@')[0]);

  // Create session
  const session = await lucia.createSession(userId, {});
  const cookie = lucia.createSessionCookie(session.id);
  c.header('Set-Cookie', cookie.serialize());

  return c.json({ success: true });
});

// Email/Password Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    throw new HTTPException(400, { message: 'Invalid input' });
  }

  const { email, password } = result.data;

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.passwordHash) {
    throw new HTTPException(401, { message: 'Invalid email or password' });
  }

  // Verify password
  const validPassword = await Bun.password.verify(password, user.passwordHash);
  if (!validPassword) {
    throw new HTTPException(401, { message: 'Invalid email or password' });
  }

  // Create session
  const session = await lucia.createSession(user.id, {});
  const cookie = lucia.createSessionCookie(session.id);
  c.header('Set-Cookie', cookie.serialize());

  return c.json({ success: true });
});

// Phantom Wallet Authentication
// Step 1: Get nonce to sign
authRoutes.post('/wallet/nonce', async (c) => {
  const { walletAddress } = await c.req.json();

  if (!walletAddress) {
    throw new HTTPException(400, { message: 'Wallet address required' });
  }

  // Generate a nonce (random message to sign)
  const nonce = `Sign this message to authenticate with AgentForge.\n\nNonce: ${generateId(32)}\nTimestamp: ${Date.now()}`;

  // Store nonce temporarily (in production, use Redis or DB)
  // For now, we'll include timestamp in nonce and verify it's recent
  return c.json({ nonce });
});

// Step 2: Verify signature and create session
const walletAuthSchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
  nonce: z.string(),
});

authRoutes.post('/wallet/verify', async (c) => {
  const body = await c.req.json();
  const result = walletAuthSchema.safeParse(body);

  if (!result.success) {
    throw new HTTPException(400, { message: 'Invalid input' });
  }

  const { walletAddress, signature, nonce } = result.data;

  // Verify the nonce is recent (within 5 minutes)
  const timestampMatch = nonce.match(/Timestamp: (\d+)/);
  if (timestampMatch) {
    const timestamp = parseInt(timestampMatch[1]);
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      throw new HTTPException(400, { message: 'Nonce expired' });
    }
  }

  // Verify signature
  try {
    const messageBytes = new TextEncoder().encode(nonce);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      throw new HTTPException(401, { message: 'Invalid signature' });
    }
  } catch (err) {
    throw new HTTPException(401, { message: 'Invalid signature' });
  }

  // Find or create user
  let user = await db.query.users.findFirst({
    where: eq(users.walletAddress, walletAddress),
  });

  if (!user) {
    // Create new user with wallet
    const userId = crypto.randomUUID();
    const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

    await db.insert(users).values({
      id: userId,
      walletAddress,
      name: shortAddress,
    });

    // Create default free subscription
    await db.insert(subscriptions).values({
      userId,
      plan: 'free',
      maxAgents: 1,
      maxMessagesPerMonth: 100,
    });

    user = await db.query.users.findFirst({
      where: eq(users.walletAddress, walletAddress),
    });
  }

  if (!user) {
    throw new HTTPException(500, { message: 'Failed to create user' });
  }

  // Create session
  const session = await lucia.createSession(user.id, {});
  const cookie = lucia.createSessionCookie(session.id);
  c.header('Set-Cookie', cookie.serialize());

  return c.json({ success: true, user });
});

// Forgot Password - Request reset link
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

authRoutes.post('/forgot-password', async (c) => {
  const body = await c.req.json();
  const result = forgotPasswordSchema.safeParse(body);

  if (!result.success) {
    throw new HTTPException(400, { message: 'Invalid email' });
  }

  const { email } = result.data;

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return c.json({ success: true });
  }

  // Generate reset token
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store token
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  // Send password reset email
  sendPasswordResetEmail(email, token);

  return c.json({ success: true });
});

// Reset Password - Set new password with token
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

authRoutes.post('/reset-password', async (c) => {
  const body = await c.req.json();
  const result = resetPasswordSchema.safeParse(body);

  if (!result.success) {
    throw new HTTPException(400, { message: 'Invalid input' });
  }

  const { token, password } = result.data;

  // Find valid token
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, token),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
  });

  if (!resetToken || resetToken.usedAt) {
    throw new HTTPException(400, { message: 'Invalid or expired reset token' });
  }

  // Hash new password
  const passwordHash = await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  // Update user password
  await db.update(users)
    .set({ passwordHash })
    .where(eq(users.id, resetToken.userId));

  // Mark token as used
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));

  // Invalidate all existing sessions for security
  await lucia.invalidateUserSessions(resetToken.userId);

  return c.json({ success: true });
});
