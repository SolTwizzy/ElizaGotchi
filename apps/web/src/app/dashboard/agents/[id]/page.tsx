'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgent, useAgentLogs, useAgentActions, useDeleteAgent } from '@/hooks/use-agents';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot,
  Play,
  Pause,
  Square,
  Trash2,
  Settings,
  Activity,
  Terminal,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'running':
      return <Badge variant="success" className="text-sm">Running</Badge>;
    case 'paused':
      return <Badge variant="warning" className="text-sm">Paused</Badge>;
    case 'error':
      return <Badge variant="destructive" className="text-sm">Error</Badge>;
    case 'stopped':
      return <Badge variant="secondary" className="text-sm">Stopped</Badge>;
    case 'starting':
      return <Badge variant="outline" className="text-sm">Starting...</Badge>;
    default:
      return <Badge variant="outline" className="text-sm">{status}</Badge>;
  }
}

function LogLevelBadge({ level }: { level: string }) {
  switch (level) {
    case 'error':
      return <Badge variant="destructive" className="text-xs">ERROR</Badge>;
    case 'warn':
      return <Badge variant="warning" className="text-xs">WARN</Badge>;
    case 'info':
      return <Badge variant="secondary" className="text-xs">INFO</Badge>;
    case 'debug':
      return <Badge variant="outline" className="text-xs">DEBUG</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{level}</Badge>;
  }
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: agentData, isLoading: agentLoading } = useAgent(id);
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useAgentLogs(id);
  const { start, stop, pause, resume } = useAgentActions(id);
  const deleteAgent = useDeleteAgent();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const agent = agentData?.agent;
  const logs = logsData?.logs ?? [];

  const handleDelete = () => {
    deleteAgent.mutate(id, {
      onSuccess: () => router.push('/dashboard/agents'),
    });
  };

  if (agentLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Agent Details" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col">
        <Header title="Agent Not Found" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">This agent does not exist.</p>
          <Link href="/dashboard/agents">
            <Button className="mt-4">Back to Agents</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title={agent.name} />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Link href="/dashboard/agents">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Button>
        </Link>

        {/* Agent info card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{agent.name}</CardTitle>
                  <CardDescription className="capitalize">
                    {agent.type.replace(/-/g, ' ')}
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status={agent.status} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Error message */}
            {agent.status === 'error' && agent.lastError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {agent.lastError}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {agent.status === 'stopped' && (
                <Button
                  onClick={() => start.mutate()}
                  disabled={start.isPending}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              )}
              {agent.status === 'running' && (
                <>
                  <Button
                    onClick={() => pause.mutate()}
                    disabled={pause.isPending}
                    variant="outline"
                    className="gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    onClick={() => stop.mutate()}
                    disabled={stop.isPending}
                    variant="outline"
                    className="gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
              {agent.status === 'paused' && (
                <>
                  <Button
                    onClick={() => resume.mutate()}
                    disabled={resume.isPending}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                  <Button
                    onClick={() => stop.mutate()}
                    disabled={stop.isPending}
                    variant="outline"
                    className="gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
              {agent.status === 'error' && (
                <Button
                  onClick={() => start.mutate()}
                  disabled={start.isPending}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              )}
              <Link href={`/dashboard/agents/${id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configure
                </Button>
              </Link>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>

            {/* Metadata */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm">
                  {new Date(agent.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p className="text-sm">
                  {new Date(agent.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for config and logs */}
        <Tabs defaultValue="logs">
          <TabsList>
            <TabsTrigger value="logs" className="gap-2">
              <Terminal className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Agent Logs</CardTitle>
                  <CardDescription>
                    Real-time logs from your agent
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchLogs()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No logs yet. Start the agent to see activity.
                  </p>
                ) : (
                  <div className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-2 rounded hover:bg-muted"
                      >
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                        <LogLevelBadge level={log.level} />
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Current agent configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted overflow-auto text-sm">
                  {JSON.stringify(agent.config, null, 2)}
                </pre>
                <Link href={`/dashboard/agents/${id}/edit`}>
                  <Button className="mt-4">Edit Configuration</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>
                  Actions performed by this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Activity tracking coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{agent.name}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
