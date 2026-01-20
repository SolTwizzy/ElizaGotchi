'use client';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAgents, useAgentActions, useDeleteAgent } from '@/hooks/use-agents';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot,
  Play,
  Pause,
  Square,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { Agent } from '@/lib/api';

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
    case 'starting':
      return <Badge variant="outline">Starting...</Badge>;
    case 'configuring':
      return <Badge variant="outline">Configuring...</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function AgentCard({ agent }: { agent: Agent }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { start, stop, pause, resume } = useAgentActions(agent.id);
  const deleteAgent = useDeleteAgent();

  const handleAction = async (action: 'start' | 'stop' | 'pause' | 'resume') => {
    const mutation = { start, stop, pause, resume }[action];
    mutation.mutate();
  };

  const handleDelete = () => {
    deleteAgent.mutate(agent.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Link href={`/dashboard/agents/${agent.id}`}>
                <CardTitle className="text-base hover:underline cursor-pointer">
                  {agent.name}
                </CardTitle>
              </Link>
              <CardDescription className="capitalize">
                {agent.type.replace(/-/g, ' ')}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/agents/${agent.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/agents/${agent.id}/edit`}>Edit Config</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {agent.status === 'stopped' && (
                <DropdownMenuItem onClick={() => handleAction('start')}>
                  <Play className="mr-2 h-4 w-4" /> Start
                </DropdownMenuItem>
              )}
              {agent.status === 'running' && (
                <>
                  <DropdownMenuItem onClick={() => handleAction('pause')}>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction('stop')}>
                    <Square className="mr-2 h-4 w-4" /> Stop
                  </DropdownMenuItem>
                </>
              )}
              {agent.status === 'paused' && (
                <>
                  <DropdownMenuItem onClick={() => handleAction('resume')}>
                    <Play className="mr-2 h-4 w-4" /> Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction('stop')}>
                    <Square className="mr-2 h-4 w-4" /> Stop
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <StatusBadge status={agent.status} />
            <span className="text-xs text-muted-foreground">
              Updated {new Date(agent.updatedAt).toLocaleDateString()}
            </span>
          </div>
          {agent.status === 'error' && agent.lastError && (
            <p className="mt-2 text-xs text-destructive truncate">
              {agent.lastError}
            </p>
          )}
        </CardContent>
      </Card>

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
    </>
  );
}

export default function AgentsPage() {
  const { data, isLoading } = useAgents();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const agents = data?.agents ?? [];
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.type.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || agent.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = agents.reduce(
    (acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex flex-col">
      <Header
        title="Agents"
        description={`${agents.length} agents deployed`}
        action={{ label: 'New Agent', href: '/dashboard/agents/new' }}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(null)}
            >
              All ({agents.length})
            </Button>
            <Button
              variant={filter === 'running' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('running')}
            >
              Running ({statusCounts.running || 0})
            </Button>
            <Button
              variant={filter === 'paused' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('paused')}
            >
              Paused ({statusCounts.paused || 0})
            </Button>
            <Button
              variant={filter === 'error' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('error')}
            >
              Errors ({statusCounts.error || 0})
            </Button>
          </div>
        </div>

        {/* Agent Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {search || filter ? 'No matching agents' : 'No agents yet'}
            </h3>
            <p className="text-muted-foreground">
              {search || filter
                ? 'Try adjusting your filters'
                : 'Deploy your first AI agent to get started'}
            </p>
            {!search && !filter && (
              <Link href="/dashboard/agents/new">
                <Button className="mt-4">Create Agent</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
