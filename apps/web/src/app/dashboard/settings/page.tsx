'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser, useUpdateUser, useDeleteUser, useNotificationSettings, useUpdateNotificationSettings, useGenerateTelegramLinkCode } from '@/hooks/use-user';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Key, Bell, Shield, Trash2, MessageCircle, Send } from 'lucide-react';
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

export default function SettingsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { data: notificationSettings, isLoading: notificationsLoading } = useNotificationSettings();
  const updateNotifications = useUpdateNotificationSettings();
  const generateLinkCode = useGenerateTelegramLinkCode();

  const [name, setName] = useState(user?.name ?? '');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Notification settings
  const [telegramChatId, setTelegramChatId] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);

  // Load notification settings when data is available
  useEffect(() => {
    if (notificationSettings) {
      setTelegramEnabled(notificationSettings.telegram.enabled);
      setTelegramChatId(notificationSettings.telegram.chatId || '');
      setDiscordEnabled(notificationSettings.discord.enabled);
      setDiscordWebhook(notificationSettings.discord.webhookUrl || '');
    }
  }, [notificationSettings]);

  const handleSaveNotifications = async () => {
    await updateNotifications.mutateAsync({
      telegramEnabled,
      telegramChatId: telegramChatId || undefined,
      discordEnabled,
      discordWebhook: discordWebhook || undefined,
    });
  };

  const handleGenerateLinkCode = async () => {
    const result = await generateLinkCode.mutateAsync();
    setLinkCode(result.code);
  };

  const handleUpdateProfile = async () => {
    await updateUser.mutateAsync({ name });
  };

  const handleDeleteAccount = () => {
    deleteUser.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Settings" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Settings" description="Manage your account and preferences" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Profile */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-white" />
              <CardTitle className="text-white">Profile</CardTitle>
            </div>
            <CardDescription className="text-white/60">Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-2xl bg-purple-500/20 text-purple-400">
                  {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-white">{user?.email}</p>
                <p className="text-sm text-white/60 capitalize">
                  {user?.plan} plan
                </p>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateUser.isPending || name === user?.name}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                >
                  {updateUser.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <Input value={user?.email ?? ''} disabled className="bg-white/5 border-white/10 text-white/60" />
              <p className="text-xs text-white/50">
                Email cannot be changed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-white" />
              <CardTitle className="text-white">Email Notifications</CardTitle>
            </div>
            <CardDescription className="text-white/60">Configure email alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Error Alerts</p>
                <p className="text-sm text-white/60">
                  Receive alerts when agents have errors
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Weekly Summary</p>
                <p className="text-sm text-white/60">
                  Get a weekly digest of agent activity
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Marketing Emails</p>
                <p className="text-sm text-white/60">
                  Product updates and new features
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Telegram & Discord Notifications */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <CardTitle className="text-white">Telegram & Discord</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Receive real-time alerts from your agents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Telegram Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <Send className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Telegram Notifications</p>
                  <p className="text-sm text-white/60">
                    {telegramEnabled && telegramChatId
                      ? '✓ Connected'
                      : 'Get alerts via @elizagotchi_bot'}
                  </p>
                </div>
                {telegramEnabled && telegramChatId && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Linked</Badge>
                )}
              </div>

              {telegramEnabled && telegramChatId ? (
                <div className="ml-13 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-400">
                    ✓ Your Telegram is linked and will receive notifications
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTelegramEnabled(false);
                      setTelegramChatId('');
                    }}
                    className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Unlink Telegram
                  </Button>
                </div>
              ) : (
                <div className="ml-13 space-y-3">
                  <p className="text-sm text-white/60">
                    Link your Telegram to receive agent alerts:
                  </p>

                  {linkCode ? (
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-sm text-white/80 mb-2">
                        Send this to <a href="https://t.me/elizagotchi_bot" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">@elizagotchi_bot</a>:
                      </p>
                      <code className="block p-2 rounded bg-black/30 text-purple-300 font-mono text-lg">
                        /link {linkCode}
                      </code>
                      <p className="text-xs text-white/50 mt-2">
                        Code expires in 10 minutes
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleGenerateLinkCode}
                      disabled={generateLinkCode.isPending}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                    >
                      {generateLinkCode.isPending ? 'Generating...' : 'Generate Link Code'}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <Separator className="bg-white/10" />

            {/* Discord Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                    <MessageCircle className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Discord Notifications</p>
                    <p className="text-sm text-white/60">
                      Get alerts via Discord webhook
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={discordEnabled}
                  onChange={(e) => setDiscordEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              {discordEnabled && (
                <div className="ml-13 space-y-2">
                  <Label htmlFor="discordWebhook" className="text-white">Webhook URL</Label>
                  <Input
                    id="discordWebhook"
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  <p className="text-xs text-white/50">
                    Server Settings → Integrations → Webhooks → New Webhook → Copy URL
                  </p>
                </div>
              )}
            </div>

            {discordEnabled && (
              <Button
                onClick={handleSaveNotifications}
                disabled={updateNotifications.isPending || !discordWebhook}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
              >
                {updateNotifications.isPending ? 'Saving...' : 'Save Discord Settings'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-white" />
              <CardTitle className="text-white">Security</CardTitle>
            </div>
            <CardDescription className="text-white/60">Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-sm text-white/60">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">Enable</Button>
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Active Sessions</p>
                <p className="text-sm text-white/60">
                  Manage devices where you're logged in
                </p>
              </div>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">View Sessions</Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-white" />
              <CardTitle className="text-white">API Keys</CardTitle>
            </div>
            <CardDescription className="text-white/60">Manage your API access</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/60 mb-4">
              API keys allow you to interact with ElizaGotchi OS programmatically.
            </p>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">Generate API Key</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-red-500/5 border-red-500/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Delete Account</p>
                <p className="text-sm text-white/60">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#1a1033] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-white/60">
              <p>
                This action cannot be undone. This will permanently delete your
                account and remove all data including:
              </p>
              <ul className="list-disc list-inside text-sm">
                <li>All your agents and their configurations</li>
                <li>All connected accounts and wallets</li>
                <li>Your subscription and billing history</li>
              </ul>
              <p>
                Type <strong className="text-white">DELETE</strong> to confirm:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE'}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
