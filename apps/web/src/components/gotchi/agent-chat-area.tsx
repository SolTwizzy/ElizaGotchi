'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { getAgentTheme } from './agent-environment';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentChatAreaProps {
  agentType: string;
  agentName: string;
  status: string;
  messages?: Message[];
  onSendMessage?: (content: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function AgentChatArea({
  agentType,
  agentName,
  status,
  messages = [],
  onSendMessage,
  isLoading,
  className,
}: AgentChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = getAgentTheme(agentType);

  const canSend = status === 'running' && input.trim() && !isLoading;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!canSend) return;
    onSendMessage?.(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mock messages for demo
  const displayMessages: Message[] = messages.length > 0 ? messages : [
    {
      id: '1',
      role: 'assistant',
      content: `Hey there! I'm ${agentName}. How can I help you today?`,
      timestamp: new Date(),
    },
  ];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {displayMessages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar for assistant */}
            {message.role === 'assistant' && (
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
                style={{ backgroundColor: `${theme.accentColor}30` }}
              >
                🤖
              </div>
            )}

            {/* Message bubble */}
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-4 py-2',
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white'
                  : 'bg-white/10 text-white/90'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs text-white/40 mt-1 block">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
              style={{ backgroundColor: `${theme.accentColor}30` }}
            >
              🤖
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        {status !== 'running' ? (
          <div className="text-center py-2">
            <p className="text-sm text-white/50">
              {status === 'paused' ? 'Agent is sleeping. Resume to chat.' :
               status === 'error' ? 'Agent needs attention. Fix errors to chat.' :
               'Start the agent to begin chatting.'}
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
