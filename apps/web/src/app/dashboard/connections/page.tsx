'use client';

import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useConnections,
  useDeleteConnection,
  useValidateConnection,
  useRefreshConnection,
  useAddWallet,
} from '@/hooks/use-connections';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Link2,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Wallet,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Provider configurations
const OAUTH_PROVIDERS = [
  {
    id: 'github',
    name: 'GitHub',
    icon: '/icons/github.svg',
    color: 'bg-gray-900',
    description: 'Connect your GitHub account for issue triaging and changelog',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '/icons/discord.svg',
    color: 'bg-indigo-600',
    description: 'Connect your Discord server for community management',
  },
  {
    id: 'google',
    name: 'Google',
    icon: '/icons/google.svg',
    color: 'bg-white border',
    description: 'Connect your Google account for calendar and docs',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: '/icons/twitch.svg',
    color: 'bg-purple-600',
    description: 'Connect your Twitch account for stream assistance',
  },
];

const WALLET_CHAINS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'base', name: 'Base' },
  { id: 'solana', name: 'Solana' },
];

function ProviderIcon({ provider }: { provider: string }) {
  const config = OAUTH_PROVIDERS.find((p) => p.id === provider);
  if (!config) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <Link2 className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full ${config.color}`}
    >
      <span className="text-white font-bold">{config.name[0]}</span>
    </div>
  );
}

export default function ConnectionsPage() {
  const { data, isLoading } = useConnections();
  const deleteConnection = useDeleteConnection();
  const validateConnection = useValidateConnection();
  const refreshConnection = useRefreshConnection();
  const addWallet = useAddWallet();

  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletChain, setWalletChain] = useState('ethereum');
  const [walletLabel, setWalletLabel] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);

  const connections = data?.connections ?? [];

  const oauthConnections = connections.filter(
    (c) => !c.provider.startsWith('wallet-')
  );
  const walletConnections = connections.filter((c) =>
    c.provider.startsWith('wallet-')
  );

  const handleOAuthConnect = (provider: string) => {
    window.location.href = `${API_URL}/api/connections/${provider}/connect`;
  };

  const handleValidate = async (id: string) => {
    setValidating(id);
    try {
      await validateConnection.mutateAsync(id);
    } finally {
      setValidating(null);
    }
  };

  const handleAddWallet = async () => {
    await addWallet.mutateAsync({
      address: walletAddress,
      chain: walletChain,
      label: walletLabel || undefined,
    });
    setWalletDialogOpen(false);
    setWalletAddress('');
    setWalletLabel('');
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteConnection.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Connections" description="Manage your linked accounts and wallets" />

      <div className="p-6 space-y-8">
        {/* OAuth Connections */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-white">OAuth Accounts</h2>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {OAUTH_PROVIDERS.map((provider) => {
                const connection = oauthConnections.find(
                  (c) => c.provider === provider.id
                );
                const isConnected = !!connection;
                const isExpired =
                  connection?.expiresAt &&
                  new Date(connection.expiresAt) < new Date();

                return (
                  <Card key={provider.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <ProviderIcon provider={provider.id} />
                        <div>
                          <CardTitle className="text-base text-white">
                            {provider.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-white/60">
                            {provider.description}
                          </CardDescription>
                        </div>
                      </div>
                      {isConnected && (
                        <Badge
                          variant={isExpired ? 'destructive' : 'default'}
                          className={isExpired ? '' : 'bg-green-500/20 text-green-400 border-green-500/30'}
                        >
                          {isExpired ? 'Expired' : 'Connected'}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      {isConnected ? (
                        <div className="space-y-3">
                          <p className="text-sm text-white/60">
                            {(connection.metadata as { username?: string })?.username ||
                              (connection.metadata as { email?: string })?.email ||
                              connection.providerId}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleValidate(connection.id)}
                              disabled={validating === connection.id}
                              className="gap-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              {validating === connection.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              Validate
                            </Button>
                            {isExpired && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  refreshConnection.mutate(connection.id)
                                }
                                className="gap-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Refresh
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(connection.id)}
                              className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3 w-3" />
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleOAuthConnect(provider.id)}
                          className="w-full gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Connect {provider.name}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Wallet Connections */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Wallets</h2>
            <Button
              onClick={() => setWalletDialogOpen(true)}
              size="sm"
              className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
            >
              <Plus className="h-4 w-4" />
              Add Wallet
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 bg-white/5" />
              ))}
            </div>
          ) : walletConnections.length === 0 ? (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="py-8 text-center">
                <Wallet className="mx-auto h-12 w-12 text-white/40" />
                <h3 className="mt-4 font-semibold text-white">No wallets connected</h3>
                <p className="text-sm text-white/60">
                  Add your wallet addresses for portfolio tracking and alerts
                </p>
                <Button
                  className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                  onClick={() => setWalletDialogOpen(true)}
                >
                  Add Wallet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {walletConnections.map((wallet) => (
                <Card key={wallet.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                        <Wallet className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {(wallet.metadata as { label?: string })?.label ||
                            'Wallet'}
                        </p>
                        <p className="text-sm text-white/60 font-mono">
                          {wallet.providerId.slice(0, 6)}...
                          {wallet.providerId.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-white/20 text-white/70">
                        {wallet.provider.replace('wallet-', '')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(wallet.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Wallet Dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent className="bg-[#1a1033] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add Wallet</DialogTitle>
            <DialogDescription className="text-white/60">
              Add a wallet address to track balances and transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-white">Wallet Address</Label>
              <Input
                id="address"
                placeholder="0x... or So1ana..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chain" className="text-white">Chain</Label>
              <Select value={walletChain} onValueChange={setWalletChain}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_CHAINS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label" className="text-white">Label (optional)</Label>
              <Input
                id="label"
                placeholder="e.g., Main Wallet, Trading"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWalletDialogOpen(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWallet}
              disabled={!walletAddress || addWallet.isPending}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
            >
              {addWallet.isPending ? 'Adding...' : 'Add Wallet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1a1033] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Disconnect Account</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to disconnect this account? Any agents using
              this connection will stop working until you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
