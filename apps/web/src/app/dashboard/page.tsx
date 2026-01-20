'use client';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgents } from '@/hooks/use-agents';
import { useUsage } from '@/hooks/use-user';
import { useConnections } from '@/hooks/use-connections';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Link2, Activity, TrendingUp, AlertCircle, CheckCircle, Pause, Play } from 'lucide-react';
import Link from 'next/link';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'running':
      return <Badge variant="success">Running</Badge>;
    case 'paused':
      return <Badge variant="warning">Paused</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    case 'stopped':
      return <Badge variant="secondary">Stopped</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function DashboardPage() {
  const { data: agentsData, isLoading: agentsLoading } = useAgents();
  const { data: usageData, isLoading: usageLoading } = useUsage();
  const { data: connectionsData, isLoading: connectionsLoading } = useConnections();

  const agents = agentsData?.agents ?? [];
  const connections = connectionsData?.connections ?? [];

  const runningAgents = agents.filter((a) => a.status === 'running').length;
  const pausedAgents = agents.filter((a) => a.status === 'paused').length;
  const errorAgents = agents.filter((a) => a.status === 'error').length;

  return (
    <div className="flex flex-col">
      <Header
        title="Dashboard"
        description="Overview of your agents and activity"
        action={{ label: 'New Agent', href: '/dashboard/agents/new' }}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {usageData?.agents.total ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {usageData?.agents.limit ?? 0} available
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{runningAgents}</div>
                  <p className="text-xs text-muted-foreground">
                    {pausedAgents} paused, {errorAgents} errors
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {connectionsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{connections.length}</div>
                  <p className="text-xs text-muted-foreground">
                    OAuth & wallets linked
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold capitalize">
                    {usageData?.plan ?? 'Free'}
                  </div>
                  <Link href="/dashboard/billing">
                    <span className="text-xs text-primary hover:underline">
                      Upgrade plan
                    </span>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Your Agents</CardTitle>
            <CardDescription>
              Quick access to your deployed agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No agents yet</h3>
                <p className="text-muted-foreground">
                  Deploy your first AI agent to get started
                </p>
                <Link href="/dashboard/agents/new">
                  <Button className="mt-4">Create Agent</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/dashboard/agents/${agent.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.type.replace(/-/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={agent.status} />
                      {agent.status === 'error' && agent.lastError && (
                        <span className="text-xs text-destructive truncate max-w-[200px]">
                          {agent.lastError}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {agents.length > 5 && (
                  <Link href="/dashboard/agents">
                    <Button variant="outline" className="w-full">
                      View all {agents.length} agents
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/agents/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Bot className="h-4 w-4" />
                  Deploy New Agent
                </Button>
              </Link>
              <Link href="/dashboard/connections" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Link2 className="h-4 w-4" />
                  Connect Account
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Server</span>
                  <span className="flex items-center gap-1 text-sm text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Agent Runtime</span>
                  <span className="flex items-center gap-1 text-sm text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhooks</span>
                  <span className="flex items-center gap-1 text-sm text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Operational
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
