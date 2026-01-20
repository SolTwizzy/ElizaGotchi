'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      toast({ title: 'Password reset successfully!' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1a1033] via-[#0d1a2d] to-[#1a0d2e] p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Bot className="h-8 w-8 text-purple-400" />
        <span className="text-2xl font-bold font-diediedi bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">ElizaGotchi OS</span>
      </Link>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-white">
            {success ? 'Password reset!' : error ? 'Invalid link' : 'Set new password'}
          </CardTitle>
          <CardDescription className="text-white/60">
            {success
              ? 'Your password has been updated'
              : error
              ? 'This reset link is invalid or has expired'
              : 'Enter your new password below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/20 p-3">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <p className="text-white/70 text-sm">
                You can now sign in with your new password.
              </p>
              <Link href="/login" className="block pt-4">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0 text-white">
                  Sign in
                </Button>
              </Link>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-500/20 p-3">
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Please request a new password reset link.
              </p>
              <Link href="/forgot-password" className="block pt-4">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0 text-white">
                  Request new link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/80">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0 text-white"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </Button>
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/5">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a1033] via-[#0d1a2d] to-[#1a0d2e]">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
