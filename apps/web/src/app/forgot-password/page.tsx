'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSubmitted(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reset email',
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
            {submitted ? 'Check your email' : 'Reset password'}
          </CardTitle>
          <CardDescription className="text-white/60">
            {submitted
              ? 'We sent you a password reset link'
              : 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/20 p-3">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <p className="text-white/70 text-sm">
                If an account exists with <span className="text-white font-medium">{email}</span>, you'll receive an email with instructions to reset your password.
              </p>
              <p className="text-white/50 text-xs">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setSubmitted(false)}
                >
                  Try another email
                </Button>
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/5">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0 text-white"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link'}
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
