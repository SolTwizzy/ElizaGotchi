'use client';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription, usePlans, useUsage } from '@/hooks/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, CreditCard, Zap, Building, Sparkles, Rocket, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  starter: Rocket,
  pro: Sparkles,
  team: Users,
  enterprise: Building,
};

export default function BillingPage() {
  const { data: subscriptionData, isLoading: subscriptionLoading } = useSubscription();
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: usageData, isLoading: usageLoading } = useUsage();

  const subscription = subscriptionData?.subscription;
  const currentPlan = subscriptionData?.plan;
  const plans = plansData?.plans ?? {};

  const handleUpgrade = (planId: string) => {
    window.location.href = `${API_URL}/api/billing/checkout?plan=${planId}`;
  };

  const handleManage = () => {
    window.location.href = `${API_URL}/api/billing/portal`;
  };

  const isLoading = subscriptionLoading || plansLoading || usageLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Billing" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Billing" description="Manage your subscription and usage" />

      <div className="p-6 space-y-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  {currentPlan && PLAN_ICONS[currentPlan.name.toLowerCase()] ? (
                    (() => {
                      const Icon = PLAN_ICONS[currentPlan.name.toLowerCase()];
                      return <Icon className="h-6 w-6 text-primary" />;
                    })()
                  ) : (
                    <Zap className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {currentPlan?.name ?? 'Free'} Plan
                  </h3>
                  {subscription && (
                    <p className="text-sm text-muted-foreground">
                      {subscription.status === 'active' ? (
                        <>
                          Renews on{' '}
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </>
                      ) : (
                        <Badge variant="warning">{subscription.status}</Badge>
                      )}
                    </p>
                  )}
                </div>
              </div>
              {subscription && (
                <Button variant="outline" onClick={handleManage}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
              )}
            </div>

            {/* Usage */}
            {usageData && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Usage</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Agents</span>
                      <span>
                        {usageData.agents.total} / {usageData.agents.limit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (usageData.agents.total / usageData.agents.limit) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(plans).map(([planId, plan]) => {
              const Icon = PLAN_ICONS[planId] ?? Zap;
              const isCurrentPlan =
                currentPlan?.name.toLowerCase() === planId.toLowerCase();

              return (
                <Card
                  key={planId}
                  className={isCurrentPlan ? 'border-primary' : ''}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 text-primary" />
                      {isCurrentPlan && <Badge>Current</Badge>}
                    </div>
                    <CardTitle className="capitalize">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {plan.price !== null ? (
                        <>
                          ${plan.price}
                          <span className="text-sm font-normal text-muted-foreground">
                            /month
                          </span>
                        </>
                      ) : (
                        <span className="text-lg">Contact us</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <ul className="space-y-3">
                      {plan.features?.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={isCurrentPlan}
                      onClick={() => handleUpgrade(planId)}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8 text-muted-foreground">
              No billing history yet.
            </p>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <Button variant="outline" onClick={handleManage}>
                Manage Payment Methods
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a payment method when you upgrade to a paid plan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
