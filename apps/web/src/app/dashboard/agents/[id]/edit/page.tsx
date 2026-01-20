'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgent, useAgentTypes, useUpdateAgent } from '@/hooks/use-agents';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bot, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: agentData, isLoading: agentLoading } = useAgent(id);
  const { data: typesData, isLoading: typesLoading } = useAgentTypes();
  const updateAgent = useUpdateAgent();

  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, unknown>>({});

  const agent = agentData?.agent;
  const types = typesData?.types ?? {};
  const typeConfig = agent ? types[agent.type] : null;

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setConfig(agent.config);
    }
  }, [agent]);

  const handleSave = async () => {
    await updateAgent.mutateAsync({
      id,
      data: { name, config },
    });
    router.push(`/dashboard/agents/${id}`);
  };

  const isLoading = agentLoading || typesLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Edit Agent" />
        <div className="p-6 max-w-2xl mx-auto w-full">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!agent || !typeConfig) {
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
      <Header title={`Edit ${agent.name}`} />

      <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
        <Link href={`/dashboard/agents/${id}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Agent
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{typeConfig.name}</CardTitle>
                <CardDescription>{typeConfig.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Agent"
              />
            </div>

            {/* Config fields */}
            {Object.entries(
              typeConfig.configSchema as Record<
                string,
                { type: string; default?: unknown; description?: string; required?: boolean }
              >
            ).map(([key, schema]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                  {schema.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                {schema.type === 'array' ? (
                  <Input
                    id={key}
                    placeholder="Comma-separated values"
                    value={
                      Array.isArray(config[key])
                        ? (config[key] as string[]).join(', ')
                        : ''
                    }
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        [key]: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                ) : schema.type === 'number' ? (
                  <Input
                    id={key}
                    type="number"
                    value={(config[key] as number) ?? schema.default ?? ''}
                    onChange={(e) =>
                      setConfig({ ...config, [key]: Number(e.target.value) })
                    }
                  />
                ) : schema.type === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={(config[key] as boolean) ?? (schema.default as boolean)}
                      onChange={(e) =>
                        setConfig({ ...config, [key]: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor={key} className="font-normal">
                      Enable
                    </Label>
                  </div>
                ) : (
                  <Input
                    id={key}
                    value={(config[key] as string) ?? schema.default ?? ''}
                    onChange={(e) =>
                      setConfig({ ...config, [key]: e.target.value })
                    }
                  />
                )}
                {schema.description && (
                  <p className="text-xs text-muted-foreground">
                    {schema.description}
                  </p>
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSave}
                disabled={!name || updateAgent.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateAgent.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/agents/${id}`)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
