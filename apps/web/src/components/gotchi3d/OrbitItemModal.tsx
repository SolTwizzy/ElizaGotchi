'use client';

import { useState } from 'react';
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
import {
  MessageSquare,
  Clock,
  Trash2,
  Edit2,
  Check,
  X,
  Archive,
  ArchiveRestore,
  Loader2,
} from 'lucide-react';
import { useUpdateOrbitItem, useDeleteOrbitItem } from '@/hooks/use-orbit-items';
import type { OrbitItem } from '@/lib/api';
import { cn } from '@/lib/utils';

interface OrbitItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrbitItem | null;
  agentId: string;
  agentName: string;
}

export function OrbitItemModal({ isOpen, onClose, item, agentId, agentName }: OrbitItemModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateMutation = useUpdateOrbitItem(agentId);
  const deleteMutation = useDeleteOrbitItem(agentId);

  if (!item) return null;

  const messages = item.snapshotData?.messages || [];
  const createdAt = new Date(item.createdAt);

  const handleStartEdit = () => {
    setEditName(item.name);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || editName === item.name) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(
      { itemId: item.id, data: { name: editName.trim() } },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleToggleArchive = () => {
    updateMutation.mutate({
      itemId: item.id,
      data: { isArchived: !item.isArchived },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!updateMutation.isPending && !deleteMutation.isPending) {
      setIsEditing(false);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between pr-8">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-8"
                  maxLength={100}
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                {item.name}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleStartEdit}
                  className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </DialogTitle>
            )}
          </div>
          <DialogDescription className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString()}
            </span>
            <span className="text-white/40">|</span>
            <span>{messages.length} messages</span>
            {item.isArchived && (
              <>
                <span className="text-white/40">|</span>
                <span className="text-amber-400">Archived</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={cn(
                'rounded-lg p-3',
                msg.role === 'user' ? 'bg-blue-500/10 ml-4' : 'bg-purple-500/10 mr-4'
              )}
            >
              <p className="text-xs font-medium mb-1">
                <span className={msg.role === 'user' ? 'text-blue-400' : 'text-purple-400'}>
                  {msg.role === 'user' ? 'You' : agentName}
                </span>
                <span className="text-white/30 ml-2">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </p>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-shrink-0 border-t border-white/10 pt-4">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <p className="text-sm text-red-400">Delete this orbit item?</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteMutation.isPending}
                  className="bg-white/5 border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleArchive}
                disabled={updateMutation.isPending}
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                {item.isArchived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
