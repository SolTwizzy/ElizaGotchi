'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Mail, Wallet } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const body = isSignup
        ? { email, password, name: name || undefined }
        : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      toast({ title: isSignup ? 'Account created!' : 'Welcome back!' });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Authentication failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhantomConnect = async () => {
    setLoading(true);

    try {
      // Check if Phantom is installed
      const phantom = (window as any).phantom?.solana;

      if (!phantom) {
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet not found. Please install Phantom.');
      }

      // Connect to Phantom
      const { publicKey } = await phantom.connect();
      const walletAddress = publicKey.toString();

      // Get nonce from server
      const nonceRes = await fetch(`${API_URL}/api/auth/wallet/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!nonceRes.ok) {
        throw new Error('Failed to get nonce');
      }

      const { nonce } = await nonceRes.json();

      // Sign the nonce with Phantom
      const encodedMessage = new TextEncoder().encode(nonce);
      const { signature } = await phantom.signMessage(encodedMessage, 'utf8');

      // Convert signature to base58
      const signatureBase58 = encodeBase58(signature);

      // Verify signature with server
      const verifyRes = await fetch(`${API_URL}/api/auth/wallet/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          walletAddress,
          signature: signatureBase58,
          nonce,
        }),
      });

      const data = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(data.message || 'Wallet verification failed');
      }

      toast({ title: 'Connected with Phantom!' });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Wallet connection failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Bot className="h-8 w-8" />
        <span className="text-2xl font-bold font-diediedi">ElizaGotchi OS</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{isSignup ? 'Create account' : 'Welcome back'}</CardTitle>
          <CardDescription>
            {isSignup
              ? 'Sign up to start deploying AI agents'
              : 'Sign in to manage your AI agents'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2">
                <Wallet className="h-4 w-4" />
                Wallet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 pt-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (optional)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={isSignup ? 'Min 8 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isSignup ? 8 : undefined}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
                </Button>
              </form>

              <div className="text-center text-sm">
                {isSignup ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="text-primary underline hover:no-underline"
                      onClick={() => setIsSignup(false)}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="text-primary underline hover:no-underline"
                      onClick={() => setIsSignup(true)}
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4 pt-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Connect your Solana wallet to sign in or create an account automatically.
              </div>
              <Button
                onClick={handlePhantomConnect}
                disabled={loading}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 128 128" fill="currentColor">
                  <circle cx="64" cy="64" r="64" fill="currentColor" fillOpacity="0.1"/>
                  <path d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.6612 23 14.8716 41.3057 14.4169 64.0026C13.9504 87.2909 33.2111 107 56.7724 107H63.3047C84.4878 107 110.584 89.1917 110.584 64.9142Z" fill="url(#paint0_linear)"/>
                  <path d="M77.5261 62.9959C77.5261 66.8844 74.3742 70.0362 70.4857 70.0362C66.5972 70.0362 63.4454 66.8844 63.4454 62.9959C63.4454 59.1074 66.5972 55.9556 70.4857 55.9556C74.3742 55.9556 77.5261 59.1074 77.5261 62.9959Z" fill="white"/>
                  <path d="M97.3248 62.9959C97.3248 66.8844 94.173 70.0362 90.2845 70.0362C86.396 70.0362 83.2441 66.8844 83.2441 62.9959C83.2441 59.1074 86.396 55.9556 90.2845 55.9556C94.173 55.9556 97.3248 59.1074 97.3248 62.9959Z" fill="white"/>
                  <defs>
                    <linearGradient id="paint0_linear" x1="62.4463" y1="107" x2="62.4463" y2="23" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#534BB1"/>
                      <stop offset="1" stopColor="#551BF9"/>
                    </linearGradient>
                  </defs>
                </svg>
                {loading ? 'Connecting...' : 'Connect Phantom'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Don't have Phantom?{' '}
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  Download here
                </a>
              </p>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground pt-6">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Base58 encoding for signature
function encodeBase58(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const BASE = 58;

  if (bytes.length === 0) return '';

  // Convert to BigInt for easier math
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }

  // Convert to base58
  let result = '';
  while (num > 0) {
    const remainder = Number(num % BigInt(BASE));
    num = num / BigInt(BASE);
    result = ALPHABET[remainder] + result;
  }

  // Add leading 1s for leading zero bytes
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) {
      result = '1' + result;
    } else {
      break;
    }
  }

  return result;
}
