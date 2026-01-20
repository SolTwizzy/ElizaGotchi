import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db, users, subscriptions } from '@elizagotchi/database';
import { PLANS } from '@elizagotchi/shared';

export const webhookRoutes = new Hono();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
});

// Stripe webhook endpoint
webhookRoutes.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    throw new HTTPException(400, { message: 'Missing Stripe signature' });
  }

  let event: Stripe.Event;

  try {
    const body = await c.req.text();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new HTTPException(400, { message: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw new HTTPException(500, { message: 'Webhook processing failed' });
  }
});

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as 'free' | 'starter' | 'pro' | 'team' | 'enterprise';

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Create or update subscription record
  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      plan,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        plan,
        updatedAt: new Date(),
      },
    });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId),
  });

  if (!existingSub) {
    console.error('Subscription not found for customer:', customerId);
    return;
  }

  // Get plan from price
  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId) as 'free' | 'starter' | 'pro' | 'team' | 'enterprise';

  await db
    .update(subscriptions)
    .set({
      plan,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId),
  });

  if (!existingSub) {
    return;
  }

  // Downgrade to free plan on cancellation
  await db
    .update(subscriptions)
    .set({
      plan: 'free',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Update subscription timestamp on successful payment
  await db
    .update(subscriptions)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Log failed payment - consider adding a status column if payment tracking needed
  console.warn(`Invoice payment failed for customer: ${customerId}`);

  await db
    .update(subscriptions)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}

function getPlanFromPriceId(priceId: string): string {
  // Map Stripe price IDs to plan IDs
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO || '']: 'pro',
    [process.env.STRIPE_PRICE_TEAM || '']: 'team',
  };

  return priceMap[priceId] || 'hobby';
}

// GitHub webhook types
interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
  };
  sender?: {
    id: number;
    login: string;
  };
  issue?: {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    user: { login: string };
    labels: Array<{ name: string }>;
  };
  pull_request?: {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    user: { login: string };
    merged: boolean;
    draft: boolean;
  };
  comment?: {
    id: number;
    body: string;
    user: { login: string };
  };
  ref?: string;
  commits?: Array<{
    id: string;
    message: string;
    author: { name: string; email: string };
  }>;
}

// Webhook event handlers store (for registered agents)
const githubEventHandlers = new Map<string, (event: string, payload: GitHubWebhookPayload) => Promise<void>>();
const discordEventHandlers = new Map<string, (payload: DiscordInteractionPayload) => Promise<void>>();

// Verify GitHub webhook signature
async function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}

// GitHub webhook endpoint
webhookRoutes.post('/github', async (c) => {
  const signature = c.req.header('x-hub-signature-256');
  const event = c.req.header('x-github-event');
  const deliveryId = c.req.header('x-github-delivery');

  if (!signature || !event) {
    throw new HTTPException(400, { message: 'Missing GitHub headers' });
  }

  const body = await c.req.text();
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // Verify signature if secret is configured
  if (secret) {
    const isValid = await verifyGitHubSignature(body, signature, secret);
    if (!isValid) {
      throw new HTTPException(401, { message: 'Invalid signature' });
    }
  }

  const payload: GitHubWebhookPayload = JSON.parse(body);

  console.log(`GitHub webhook [${deliveryId}]: ${event}${payload.action ? `.${payload.action}` : ''}`);

  try {
    // Process based on event type
    switch (event) {
      case 'issues':
        await handleGitHubIssueEvent(payload);
        break;

      case 'pull_request':
        await handleGitHubPullRequestEvent(payload);
        break;

      case 'issue_comment':
      case 'pull_request_review_comment':
        await handleGitHubCommentEvent(payload);
        break;

      case 'push':
        await handleGitHubPushEvent(payload);
        break;

      case 'release':
        await handleGitHubReleaseEvent(payload);
        break;

      case 'ping':
        console.log('GitHub webhook ping received');
        break;

      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }

    // Notify registered handlers
    for (const handler of githubEventHandlers.values()) {
      try {
        await handler(event, payload);
      } catch (err) {
        console.error('Error in GitHub event handler:', err);
      }
    }

    return c.json({ received: true, event, deliveryId });
  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    throw new HTTPException(500, { message: 'Webhook processing failed' });
  }
});

async function handleGitHubIssueEvent(payload: GitHubWebhookPayload): Promise<void> {
  const { action, issue, repository, sender } = payload;

  if (!issue || !repository) return;

  const eventInfo = {
    action,
    issue: {
      number: issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user.login,
      labels: issue.labels.map((l) => l.name),
    },
    repository: repository.full_name,
    triggeredBy: sender?.login,
  };

  console.log('GitHub Issue Event:', eventInfo);

  // Could trigger agent actions here based on the event
  // e.g., auto-label issues, respond to new issues, etc.
}

async function handleGitHubPullRequestEvent(payload: GitHubWebhookPayload): Promise<void> {
  const { action, pull_request, repository, sender } = payload;

  if (!pull_request || !repository) return;

  const eventInfo = {
    action,
    pr: {
      number: pull_request.number,
      title: pull_request.title,
      state: pull_request.state,
      author: pull_request.user.login,
      merged: pull_request.merged,
      draft: pull_request.draft,
    },
    repository: repository.full_name,
    triggeredBy: sender?.login,
  };

  console.log('GitHub Pull Request Event:', eventInfo);
}

async function handleGitHubCommentEvent(payload: GitHubWebhookPayload): Promise<void> {
  const { action, comment, issue, pull_request, repository, sender } = payload;

  if (!comment || !repository) return;

  const eventInfo = {
    action,
    comment: {
      id: comment.id,
      body: comment.body.substring(0, 100),
      author: comment.user.login,
    },
    onIssue: issue?.number,
    onPR: pull_request?.number,
    repository: repository.full_name,
    triggeredBy: sender?.login,
  };

  console.log('GitHub Comment Event:', eventInfo);
}

async function handleGitHubPushEvent(payload: GitHubWebhookPayload): Promise<void> {
  const { ref, commits, repository, sender } = payload;

  if (!repository) return;

  const eventInfo = {
    ref,
    commitCount: commits?.length ?? 0,
    commits: commits?.slice(0, 5).map((c) => ({
      id: c.id.substring(0, 7),
      message: c.message.split('\n')[0],
      author: c.author.name,
    })),
    repository: repository.full_name,
    pushedBy: sender?.login,
  };

  console.log('GitHub Push Event:', eventInfo);
}

async function handleGitHubReleaseEvent(payload: GitHubWebhookPayload): Promise<void> {
  const { action, repository, sender } = payload;
  const release = (payload as any).release;

  if (!release || !repository) return;

  const eventInfo = {
    action,
    release: {
      tagName: release.tag_name,
      name: release.name,
      prerelease: release.prerelease,
      draft: release.draft,
    },
    repository: repository.full_name,
    triggeredBy: sender?.login,
  };

  console.log('GitHub Release Event:', eventInfo);
}

// Discord webhook types
interface DiscordInteractionPayload {
  type: number;
  id: string;
  application_id: string;
  token: string;
  guild_id?: string;
  channel_id?: string;
  member?: {
    user: {
      id: string;
      username: string;
      discriminator: string;
    };
    roles: string[];
    permissions: string;
  };
  user?: {
    id: string;
    username: string;
    discriminator: string;
  };
  data?: {
    id: string;
    name: string;
    type: number;
    options?: Array<{
      name: string;
      value: string | number | boolean;
      type: number;
    }>;
    custom_id?: string;
    component_type?: number;
  };
  message?: {
    id: string;
    content: string;
    author: { id: string; username: string };
  };
}

// Discord interaction types
const DISCORD_INTERACTION_TYPES = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
};

// Discord response types
const DISCORD_RESPONSE_TYPES = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
};

// Verify Discord request signature
async function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  publicKey: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + body);

    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const keyBytes = new Uint8Array(
      publicKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify('Ed25519', key, signatureBytes, message);
  } catch {
    return false;
  }
}

// Discord webhook endpoint
webhookRoutes.post('/discord', async (c) => {
  const signature = c.req.header('x-signature-ed25519');
  const timestamp = c.req.header('x-signature-timestamp');

  const body = await c.req.text();
  const payload: DiscordInteractionPayload = JSON.parse(body);

  // Handle ping (verification request)
  if (payload.type === DISCORD_INTERACTION_TYPES.PING) {
    return c.json({ type: DISCORD_RESPONSE_TYPES.PONG });
  }

  // Verify signature if public key is configured
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (publicKey && signature && timestamp) {
    const isValid = await verifyDiscordSignature(body, signature, timestamp, publicKey);
    if (!isValid) {
      throw new HTTPException(401, { message: 'Invalid signature' });
    }
  }

  console.log(`Discord interaction: type=${payload.type}, id=${payload.id}`);

  try {
    // Process based on interaction type
    switch (payload.type) {
      case DISCORD_INTERACTION_TYPES.APPLICATION_COMMAND:
        return await handleDiscordSlashCommand(c, payload);

      case DISCORD_INTERACTION_TYPES.MESSAGE_COMPONENT:
        return await handleDiscordComponent(c, payload);

      case DISCORD_INTERACTION_TYPES.MODAL_SUBMIT:
        return await handleDiscordModalSubmit(c, payload);

      default:
        console.log(`Unhandled Discord interaction type: ${payload.type}`);
        return c.json({
          type: DISCORD_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Interaction received', flags: 64 },
        });
    }
  } catch (error) {
    console.error('Error processing Discord webhook:', error);
    return c.json({
      type: DISCORD_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: 'An error occurred processing this interaction', flags: 64 },
    });
  }
});

async function handleDiscordSlashCommand(c: any, payload: DiscordInteractionPayload) {
  const commandName = payload.data?.name;
  const options = payload.data?.options ?? [];
  const userId = payload.member?.user.id ?? payload.user?.id;

  console.log(`Discord slash command: /${commandName}`, { options, userId });

  // Notify registered handlers
  for (const handler of discordEventHandlers.values()) {
    try {
      await handler(payload);
    } catch (err) {
      console.error('Error in Discord event handler:', err);
    }
  }

  // Default response - actual command handling would be done by registered agents
  return c.json({
    type: DISCORD_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Command \`/${commandName}\` received and is being processed...`,
      flags: 64, // Ephemeral
    },
  });
}

async function handleDiscordComponent(c: any, payload: DiscordInteractionPayload) {
  const customId = payload.data?.custom_id;
  const componentType = payload.data?.component_type;
  const userId = payload.member?.user.id ?? payload.user?.id;

  console.log(`Discord component interaction: ${customId}`, { componentType, userId });

  // Notify registered handlers
  for (const handler of discordEventHandlers.values()) {
    try {
      await handler(payload);
    } catch (err) {
      console.error('Error in Discord event handler:', err);
    }
  }

  return c.json({
    type: DISCORD_RESPONSE_TYPES.DEFERRED_UPDATE_MESSAGE,
  });
}

async function handleDiscordModalSubmit(c: any, payload: DiscordInteractionPayload) {
  const customId = payload.data?.custom_id;
  const userId = payload.member?.user.id ?? payload.user?.id;

  console.log(`Discord modal submit: ${customId}`, { userId });

  // Notify registered handlers
  for (const handler of discordEventHandlers.values()) {
    try {
      await handler(payload);
    } catch (err) {
      console.error('Error in Discord event handler:', err);
    }
  }

  return c.json({
    type: DISCORD_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: 'Form submitted successfully!',
      flags: 64,
    },
  });
}

// Export functions for registering webhook handlers
export function registerGitHubHandler(
  agentId: string,
  handler: (event: string, payload: GitHubWebhookPayload) => Promise<void>
): () => void {
  githubEventHandlers.set(agentId, handler);
  return () => githubEventHandlers.delete(agentId);
}

export function registerDiscordHandler(
  agentId: string,
  handler: (payload: DiscordInteractionPayload) => Promise<void>
): () => void {
  discordEventHandlers.set(agentId, handler);
  return () => discordEventHandlers.delete(agentId);
}
