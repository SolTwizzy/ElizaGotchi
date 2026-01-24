'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, Sparkles, Loader2 } from 'lucide-react';
import { useSuggestOrbitName, useCreateOrbitItem } from '@/hooks/use-orbit-items';

// Local message type that accepts both Date and string timestamps
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
}

interface SendToOrbitModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  messages: Message[];
  onSuccess?: (itemName: string) => void;
}

export function SendToOrbitModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  messages,
  onSuccess,
}: SendToOrbitModalProps) {
  const [name, setName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const suggestNameMutation = useSuggestOrbitName(agentId);
  const createOrbitMutation = useCreateOrbitItem(agentId);

  // Generate name suggestion when modal opens
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setIsGenerating(true);
      const simplifiedMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      suggestNameMutation.mutate(simplifiedMessages, {
        onSuccess: (data) => {
          setName(data.suggestedName);
          setIsGenerating(false);
        },
        onError: () => {
          // Fallback to first user message
          const firstUserMsg = messages.find((m) => m.role === 'user');
          setName(firstUserMsg?.content.slice(0, 30) || 'Chat Session');
          setIsGenerating(false);
        },
      });
    }
  }, [isOpen, messages.length]);

  const handleSave = () => {
    if (!name.trim()) return;

    const snapshotData = {
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      })),
    };

    const trimmedName = name.trim();
    createOrbitMutation.mutate(
      {
        name: trimmedName,
        type: 'chat',
        snapshotData,
      },
      {
        onSuccess: () => {
          onSuccess?.(trimmedName);
          onClose();
          setName('');
        },
      }
    );
  };

  const handleClose = () => {
    if (!createOrbitMutation.isPending) {
      onClose();
      setName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            Send to Orbit
          </DialogTitle>
          <DialogDescription>
            Save this conversation to orbit around {agentName}'s planet. You can retrieve it anytime
            by clicking the bubble.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orbit-name" className="text-white/80">
              Name this conversation
            </Label>
            <div className="relative">
              <Input
                id="orbit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name..."
                disabled={isGenerating || createOrbitMutation.isPending}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 pr-10"
                maxLength={100}
              />
              {isGenerating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>
              )}
            </div>
            {isGenerating && (
              <p className="text-xs text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI is generating a name suggestion...
              </p>
            )}
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-white/50 mb-2">Preview ({messages.length} messages)</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {messages.slice(-3).map((msg, i) => (
                <p key={i} className="text-xs text-white/70 truncate">
                  <span className={msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}>
                    {msg.role === 'user' ? 'You' : agentName}:
                  </span>{' '}
                  {msg.content.slice(0, 50)}
                  {msg.content.length > 50 ? '...' : ''}
                </p>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createOrbitMutation.isPending}
            className="bg-white/5 border-white/10 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isGenerating || createOrbitMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {createOrbitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Send to Orbit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
