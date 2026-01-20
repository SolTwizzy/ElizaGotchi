'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgentTypes, useCreateAgent } from '@/hooks/use-agents';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot,
  ChevronRight,
  ArrowLeft,
  Coins,
  Search,
  Wrench,
  User,
  MessageSquare,
  Gamepad2,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { AI_MODELS, FREE_MODELS, DEFAULT_MODEL, type AIModel } from '@elizagotchi/shared';

// Available chains for wallet tracking
const EVM_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', color: '#FF0420' },
  { id: 'base', name: 'Base', color: '#0052FF' },
  { id: 'avalanche', name: 'Avalanche', color: '#E84142' },
  { id: 'bsc', name: 'BNB Chain', color: '#F0B90B' },
];

const SOLANA_CHAIN = { id: 'solana', name: 'Solana', color: '#9945FF' };

const ALL_CHAINS = [...EVM_CHAINS, SOLANA_CHAIN];

interface WalletEntry {
  address: string;
  chain: string;
}

// Agent avatar and color mappings matching the homepage
const agentConfig: Record<string, { avatar: string; color: string }> = {
  // Featured 9 agents (shown on homepage)
  'portfolio-tracker': { avatar: '/toma1.png', color: '#FF6B9D' },
  'whale-watcher': { avatar: '/toma2.png', color: '#9B6BFF' },
  'airdrop-hunter': { avatar: '/toma3.png', color: '#6BFFD4' },
  'bug-reporter': { avatar: '/toma4.png', color: '#FFD46B' },
  'treasury-watcher': { avatar: '/toma5.png', color: '#6BB5FF' },
  'contract-monitor': { avatar: '/toma6.png', color: '#FF6B6B' },
  'market-scanner': { avatar: '/toma7.png', color: '#B5FF6B' },
  'reading-list-manager': { avatar: '/toma8.png', color: '#FF9D6B' },
  'github-issue-triager': { avatar: '/toma9.png', color: '#6BFFA5' },
  // Additional agents (available in backend)
  'gas-monitor': { avatar: '/toma4.png', color: '#FFD46B' },
  'changelog-writer': { avatar: '/toma7.png', color: '#B5FF6B' },
  'community-manager': { avatar: '/toma2.png', color: '#9B6BFF' },
  'lore-keeper': { avatar: '/toma8.png', color: '#FF9D6B' },
};

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  crypto: { label: 'Crypto & DeFi', icon: Coins, color: '#FF6B9D' },
  research: { label: 'Research', icon: Search, color: '#B5FF6B' },
  developer: { label: 'Developer', icon: Wrench, color: '#6BFFA5' },
  personal: { label: 'Personal', icon: User, color: '#FF9D6B' },
  community: { label: 'Community', icon: MessageSquare, color: '#9B6BFF' },
  entertainment: { label: 'Entertainment', icon: Gamepad2, color: '#FFD46B' },
};

export default function NewAgentPage() {
  const router = useRouter();
  const { data: typesData, isLoading } = useAgentTypes();
  const createAgent = useCreateAgent();
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, unknown>>({});

  // Model selection
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [customApiKey, setCustomApiKey] = useState('');

  // Wallet entries for portfolio-tracker, airdrop-hunter, etc.
  const [wallets, setWallets] = useState<WalletEntry[]>([{ address: '', chain: 'ethereum' }]);

  // Selected chains for chain-based agents
  const [selectedChains, setSelectedChains] = useState<string[]>(['ethereum', 'polygon', 'arbitrum']);

  // Network type selection (EVM, Solana, or Both)
  const [networkType, setNetworkType] = useState<'evm' | 'solana' | 'both'>('evm');

  const types = typesData?.types ?? {};

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setName(types[type]?.name ?? '');

    // Initialize config with defaults from schema
    const typeConfig = types[type];
    const initialConfig: Record<string, unknown> = {};
    const schema = typeConfig.configSchema as Record<string, { default?: unknown }>;

    Object.entries(schema).forEach(([key, fieldSchema]) => {
      if (fieldSchema.default !== undefined) {
        initialConfig[key] = fieldSchema.default;
      }
    });

    setConfig(initialConfig);

    // Reset wallets and chains
    setWallets([{ address: '', chain: 'ethereum' }]);
    setSelectedChains(Array.isArray(initialConfig.chains) ? initialConfig.chains as string[] : ['ethereum']);
    setNetworkType('evm');

    // Reset model selection
    setSelectedModel(DEFAULT_MODEL);
    setCustomApiKey('');

    setStep('config');
  };

  // Check if selected model is premium (requires custom API key)
  const isPremiumModel = !FREE_MODELS.includes(selectedModel);
  const modelConfig = AI_MODELS[selectedModel];

  // Wallet management functions
  const addWallet = useCallback(() => {
    setWallets(prev => [...prev, { address: '', chain: networkType === 'solana' ? 'solana' : 'ethereum' }]);
  }, [networkType]);

  const removeWallet = useCallback((index: number) => {
    setWallets(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateWallet = useCallback((index: number, field: keyof WalletEntry, value: string) => {
    setWallets(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  }, []);

  // Chain toggle function
  const toggleChain = useCallback((chainId: string) => {
    setSelectedChains(prev =>
      prev.includes(chainId)
        ? prev.filter(c => c !== chainId)
        : [...prev, chainId]
    );
  }, []);

  // Get available chains based on network type
  const availableChains = useMemo(() => {
    if (networkType === 'evm') return EVM_CHAINS;
    if (networkType === 'solana') return [SOLANA_CHAIN];
    return ALL_CHAINS;
  }, [networkType]);

  const handleCreate = async () => {
    if (!selectedType || !name) return;

    // Build final config with wallets and chains
    const finalConfig = { ...config };

    // Add wallet addresses if this agent type uses them
    const typeConfig = types[selectedType];
    const schema = typeConfig.configSchema as Record<string, { type: string }>;

    if (schema.walletAddresses) {
      finalConfig.walletAddresses = wallets.filter(w => w.address.trim()).map(w => w.address.trim());
      // Also store chain info per wallet
      finalConfig.walletChains = wallets.filter(w => w.address.trim()).map(w => ({ address: w.address.trim(), chain: w.chain }));
    }

    if (schema.chains) {
      finalConfig.chains = selectedChains;
    }

    // Add model configuration
    finalConfig.model = selectedModel;
    finalConfig.modelProvider = modelConfig.provider;

    // Add custom API key if using premium model
    if (isPremiumModel && customApiKey) {
      finalConfig.customApiKey = customApiKey;
    }

    await createAgent.mutateAsync({
      name,
      type: selectedType,
      config: finalConfig,
    });

    router.push('/dashboard/agents');
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!selectedType) return false;

    const typeConfig = types[selectedType];
    if (!typeConfig) return false;

    const schema = typeConfig.configSchema as Record<string, { required?: boolean }>;

    // Check wallet addresses requirement
    if (schema.walletAddresses?.required) {
      const validWallets = wallets.filter(w => w.address.trim());
      if (validWallets.length === 0) return false;
    }

    // Check chains requirement
    if (schema.chains && selectedChains.length === 0) return false;

    // Premium models require custom API key
    if (isPremiumModel && !customApiKey.trim()) return false;

    return true;
  }, [name, selectedType, types, wallets, selectedChains, isPremiumModel, customApiKey]);

  // Group types by category
  const groupedTypes = useMemo(() => {
    return Object.entries(types).reduce(
      (acc, [key, value]) => {
        const category = value.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push({ key, ...value });
        return acc;
      },
      {} as Record<string, Array<{ key: string } & typeof types[string]>>
    );
  }, [types]);

  // Get available categories that have agents
  const availableCategories = useMemo(() => {
    return Object.keys(categoryConfig).filter(
      (cat) => groupedTypes[cat]?.length > 0
    );
  }, [groupedTypes]);

  // Get all agents for the "All" tab
  const allAgents = useMemo(() => {
    return Object.values(groupedTypes).flat();
  }, [groupedTypes]);

  const totalCount = allAgents.length;

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Create New Agent" />
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'config' && selectedType) {
    const typeConfig = types[selectedType];
    const agentStyle = agentConfig[selectedType] ?? { avatar: '/toma1.png', color: '#FF6B9D' };

    return (
      <div className="flex flex-col">
        <Header title="Configure Agent" />
        <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
          <Button
            variant="ghost"
            onClick={() => setStep('type')}
            className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to agent types
          </Button>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden"
                  style={{ backgroundColor: `${agentStyle.color}20` }}
                >
                  <Image
                    src={agentStyle.avatar}
                    alt={typeConfig.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <CardTitle className="text-white">{typeConfig.name}</CardTitle>
                  <CardDescription className="text-white/60">{typeConfig.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Agent Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Agent"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              {/* AI Model Selection */}
              <div className="space-y-3">
                <Label className="text-white">AI Model</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Free tier models */}
                  {FREE_MODELS.map((modelId) => {
                    const model = AI_MODELS[modelId];
                    const isSelected = selectedModel === modelId;
                    return (
                      <button
                        key={modelId}
                        type="button"
                        onClick={() => {
                          setSelectedModel(modelId);
                          setCustomApiKey(''); // Clear API key when switching to free
                        }}
                        className={`
                          p-3 rounded-lg text-left transition-all border
                          ${isSelected
                            ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-white/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white text-sm">{model.name}</span>
                          <Badge className="bg-green-500/20 text-green-400 text-xs border-0">
                            Free
                          </Badge>
                        </div>
                        <p className="text-xs text-white/50">{model.description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Premium models section */}
                <div className="pt-2">
                  <p className="text-xs text-white/40 mb-2">Premium Models (Bring Your Own Key)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(AI_MODELS)
                      .filter(([id]) => !FREE_MODELS.includes(id as AIModel))
                      .map(([modelId, model]) => {
                        const isSelected = selectedModel === modelId;
                        return (
                          <button
                            key={modelId}
                            type="button"
                            onClick={() => setSelectedModel(modelId as AIModel)}
                            className={`
                              p-3 rounded-lg text-left transition-all border
                              ${isSelected
                                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-white/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white text-sm">{model.name}</span>
                              <Badge className="bg-purple-500/20 text-purple-400 text-xs border-0">
                                Premium
                              </Badge>
                            </div>
                            <p className="text-xs text-white/50">{model.description}</p>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Custom API Key input for premium models */}
                {isPremiumModel && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="apiKey" className="text-white">
                      {modelConfig.provider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder={modelConfig.provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/50">
                      Your API key is encrypted and only used for this agent. Get your key from{' '}
                      {modelConfig.provider === 'openai' ? (
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                          OpenAI Dashboard
                        </a>
                      ) : (
                        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                          Anthropic Console
                        </a>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Required connections */}
              {typeConfig.requiredConnections.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white">Required Connections</Label>
                  <div className="flex flex-wrap gap-2">
                    {typeConfig.requiredConnections.map((conn) => (
                      <Badge key={conn} variant="outline" className="border-white/20 text-white/70">
                        {conn}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-white/50">
                    You'll need to connect these accounts before the agent can
                    start
                  </p>
                </div>
              )}

              {/* Config schema fields - rendered based on field type */}
              {Object.entries(typeConfig.configSchema as Record<string, { type: string; default?: unknown; description?: string; required?: boolean; enum?: string[] }>).map(
                ([key, schema]) => {
                  // Skip walletAddresses and chains - we handle them specially
                  if (key === 'walletAddresses') {
                    return (
                      <div key={key} className="space-y-4">
                        {/* Network Type Selection */}
                        <div className="space-y-2">
                          <Label>Network Type<span className="text-destructive">*</span></Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={networkType === 'evm' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setNetworkType('evm');
                                setSelectedChains(['ethereum', 'polygon', 'arbitrum']);
                                setWallets(prev => prev.map(w => ({ ...w, chain: 'ethereum' })));
                              }}
                              className={networkType === 'evm'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
                            >
                              EVM Only
                            </Button>
                            <Button
                              type="button"
                              variant={networkType === 'solana' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setNetworkType('solana');
                                setSelectedChains(['solana']);
                                setWallets(prev => prev.map(w => ({ ...w, chain: 'solana' })));
                              }}
                              className={networkType === 'solana'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
                            >
                              Solana Only
                            </Button>
                            <Button
                              type="button"
                              variant={networkType === 'both' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setNetworkType('both');
                                setSelectedChains(['ethereum', 'solana']);
                              }}
                              className={networkType === 'both'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
                            >
                              Both
                            </Button>
                          </div>
                          <p className="text-xs text-white/50">Choose which blockchain networks to track</p>
                        </div>

                        {/* Wallet Entries */}
                        <div className="space-y-2">
                          <Label>Wallet Addresses<span className="text-destructive">*</span></Label>
                          <p className="text-xs text-white/50 mb-2">Add at least one wallet address to track</p>
                          <div className="space-y-3">
                            {wallets.map((wallet, index) => (
                              <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-1">
                                  <Input
                                    placeholder={networkType === 'solana' ? 'Solana address...' : '0x... or ENS name'}
                                    value={wallet.address}
                                    onChange={(e) => updateWallet(index, 'address', e.target.value)}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                  />
                                </div>
                                <Select
                                  value={wallet.chain}
                                  onValueChange={(value) => updateWallet(index, 'chain', value)}
                                >
                                  <SelectTrigger className="w-36 bg-white/10 border-white/20 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableChains.map((chain) => (
                                      <SelectItem key={chain.id} value={chain.id}>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: chain.color }}
                                          />
                                          {chain.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {wallets.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeWallet(index)}
                                    className="text-white/60 hover:text-white hover:bg-white/10"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addWallet}
                            className="mt-2 gap-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <Plus className="h-3 w-3" />
                            Add Wallet
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  if (key === 'chains') {
                    return (
                      <div key={key} className="space-y-2">
                        <Label>Chains to Monitor{schema.required && <span className="text-destructive">*</span>}</Label>
                        <p className="text-xs text-white/50">Select which chains to monitor for this agent</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableChains.map((chain) => {
                            const isSelected = selectedChains.includes(chain.id);
                            return (
                              <button
                                key={chain.id}
                                type="button"
                                onClick={() => toggleChain(chain.id)}
                                className={`
                                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                                  ${isSelected
                                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white border border-white/20'
                                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                                  }
                                `}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: chain.color }}
                                />
                                {chain.name}
                                {isSelected && <span className="text-green-400">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                        {selectedChains.length === 0 && (
                          <p className="text-xs text-red-400 mt-1">Select at least one chain</p>
                        )}
                      </div>
                    );
                  }

                  // Handle enum fields with dropdown
                  if (schema.enum) {
                    return (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="capitalize text-white">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                          {schema.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Select
                          value={(config[key] as string) ?? (schema.default as string)}
                          onValueChange={(value) => setConfig({ ...config, [key]: value })}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {schema.enum.map((option) => (
                              <SelectItem key={option} value={option} className="capitalize">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {schema.description && (
                          <p className="text-xs text-white/50">{schema.description}</p>
                        )}
                      </div>
                    );
                  }

                  // Handle other array fields (not wallets or chains)
                  if (schema.type === 'array') {
                    return (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="capitalize text-white">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                          {schema.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          id={key}
                          placeholder="Comma-separated values"
                          defaultValue={Array.isArray(schema.default) ? schema.default.join(', ') : ''}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              [key]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                        {schema.description && (
                          <p className="text-xs text-white/50">{schema.description}</p>
                        )}
                      </div>
                    );
                  }

                  // Number fields
                  if (schema.type === 'number') {
                    return (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="capitalize text-white">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                          {schema.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          id={key}
                          type="number"
                          value={(config[key] as number) ?? schema.default ?? ''}
                          onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                        {schema.description && (
                          <p className="text-xs text-white/50">{schema.description}</p>
                        )}
                      </div>
                    );
                  }

                  // Boolean fields
                  if (schema.type === 'boolean') {
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={key}
                            checked={(config[key] as boolean) ?? (schema.default as boolean) ?? false}
                            onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                            className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
                          />
                          <Label htmlFor={key} className="capitalize text-white font-normal">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                        </div>
                        {schema.description && (
                          <p className="text-xs text-white/50 ml-7">{schema.description}</p>
                        )}
                      </div>
                    );
                  }

                  // String fields (default)
                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="capitalize text-white">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                        {schema.required && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id={key}
                        value={(config[key] as string) ?? (schema.default as string) ?? ''}
                        onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      />
                      {schema.description && (
                        <p className="text-xs text-white/50">{schema.description}</p>
                      )}
                    </div>
                  );
                }
              )}

              {/* Estimated cost */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                <p className="text-sm text-white">
                  <span className="font-medium">Estimated cost:</span>{' '}
                  <span className="text-white/70">{typeConfig.estimatedCost}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleCreate}
                  disabled={!isFormValid || createAgent.isPending}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                >
                  {createAgent.isPending ? 'Creating...' : 'Create Agent'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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

  return (
    <div className="flex flex-col">
      <Header title="Create New Agent" description="Choose an agent type to deploy" />
      <div className="p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start mb-6 h-auto flex-wrap gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            {/* All tab */}
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/10 hover:text-white hover:bg-white/5 transition-all"
            >
              <Bot className="h-4 w-4" />
              <span>All</span>
              <Badge className="ml-1 h-5 px-1.5 text-xs bg-white/10 text-white/70 hover:bg-white/10">
                {totalCount}
              </Badge>
            </TabsTrigger>

            {availableCategories.map((category) => {
              const config = categoryConfig[category];
              const CategoryIcon = config.icon;
              const count = groupedTypes[category]?.length || 0;
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/10 hover:text-white hover:bg-white/5 transition-all"
                >
                  <CategoryIcon className="h-4 w-4" style={{ color: config.color }} />
                  <span>{config.label}</span>
                  <Badge className="ml-1 h-5 px-1.5 text-xs bg-white/10 text-white/70 hover:bg-white/10">
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* All agents tab content */}
          <TabsContent value="all" className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allAgents.map((type) => {
                const agentStyle = agentConfig[type.key] ?? { avatar: '/toma1.png', color: '#FF6B9D' };
                return (
                  <Card
                    key={type.key}
                    className="cursor-pointer transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm group"
                    onClick={() => handleSelectType(type.key)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden"
                          style={{ backgroundColor: `${agentStyle.color}20` }}
                        >
                          <Image
                            src={agentStyle.avatar}
                            alt={type.name}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs border-white/20 text-white/70"
                            style={{ borderColor: `${categoryConfig[type.category]?.color}40` }}
                          >
                            {categoryConfig[type.category]?.label || type.category}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/70 transition-colors" />
                        </div>
                      </div>
                      <CardTitle className="text-base text-white">{type.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-white/60 line-clamp-2">
                        {type.description}
                      </p>
                      <p className="mt-2 text-xs text-white/40">
                        {type.estimatedCost}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {availableCategories.map((category) => {
            const categoryTypes = groupedTypes[category] || [];
            return (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryTypes.map((type) => {
                    const agentStyle = agentConfig[type.key] ?? { avatar: '/toma1.png', color: '#FF6B9D' };
                    return (
                      <Card
                        key={type.key}
                        className="cursor-pointer transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm group"
                        onClick={() => handleSelectType(type.key)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden"
                              style={{ backgroundColor: `${agentStyle.color}20` }}
                            >
                              <Image
                                src={agentStyle.avatar}
                                alt={type.name}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            </div>
                            <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/70 transition-colors" />
                          </div>
                          <CardTitle className="text-base text-white">{type.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-white/60 line-clamp-2">
                            {type.description}
                          </p>
                          <p className="mt-2 text-xs text-white/40">
                            {type.estimatedCost}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
