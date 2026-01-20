export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxAgents: 1,
    maxMessagesPerMonth: 100,
    features: [
      '1 agent',
      '100 messages/month',
      'Basic support',
    ],
    stripePriceId: null,
  },
  starter: {
    name: 'Starter',
    price: 9,
    maxAgents: 3,
    maxMessagesPerMonth: 1000,
    features: [
      '3 agents',
      '1,000 messages/month',
      'Email support',
      'Discord integration',
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  pro: {
    name: 'Pro',
    price: 29,
    maxAgents: 10,
    maxMessagesPerMonth: 10000,
    features: [
      '10 agents',
      '10,000 messages/month',
      'Priority support',
      'All integrations',
      'Custom agent personalities',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  team: {
    name: 'Team',
    price: 99,
    maxAgents: 50,
    maxMessagesPerMonth: 100000,
    features: [
      '50 agents',
      '100,000 messages/month',
      'Dedicated support',
      'All integrations',
      'Custom agent personalities',
      'Team management',
      'Analytics dashboard',
    ],
    stripePriceId: process.env.STRIPE_PRICE_TEAM,
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Custom pricing
    maxAgents: -1, // Unlimited
    maxMessagesPerMonth: -1, // Unlimited
    features: [
      'Unlimited agents',
      'Unlimited messages',
      '24/7 dedicated support',
      'All integrations',
      'Custom agent personalities',
      'Team management',
      'Analytics dashboard',
      'Custom integrations',
      'SLA guarantee',
    ],
    stripePriceId: null,
  },
} as const;

export type Plan = keyof typeof PLANS;
export type PlanConfig = (typeof PLANS)[Plan];
