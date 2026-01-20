import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { GitHub, Discord } from 'arctic';
import { db, sessions, users } from '@elizagotchi/database';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      // Required for cross-origin cookies (frontend and API on different domains)
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      avatarUrl: attributes.avatar_url,
      walletAddress: attributes.wallet_address,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string | null;
      name: string | null;
      avatar_url: string | null;
      wallet_address: string | null;
    };
  }
}

// OAuth providers for agent connections (not for login)
export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID || '',
  process.env.GITHUB_CLIENT_SECRET || '',
  `${process.env.API_URL || 'http://localhost:4000'}/api/connections/github/callback`
);

export const discord = new Discord(
  process.env.DISCORD_CLIENT_ID || '',
  process.env.DISCORD_CLIENT_SECRET || '',
  `${process.env.API_URL || 'http://localhost:4000'}/api/connections/discord/callback`
);
