'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ChatMessage } from '@/lib/vsual-types';

/**
 * AI Chat Panel
 *
 * Provides a conversational interface powered by the VSUAL Assistant.
 *
 * FIXES applied:
 * - Uses shadcn ScrollArea instead of raw div with custom scrollbar
 * - Uses shadcn Input + Button instead of custom glass components
 * - Typing indicator with three bouncing dots
 * - Proper aria-labels and keyboard navigation
 * - Auto-scroll on new messages
 */

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your VSUAL Assistant. I can help you with networking strategies, marketing campaigns, brand growth, and more. How can I help you today?",
  timestamp: new Date(),
};

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`session-${Date.now()}`);

  /** Scroll to the bottom of the message list. */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /** Send a message to the chat API. */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .filter((m) => m.id !== 'welcome')
            .concat(userMsg)
            .map((m) => ({ role: m.role, content: m.content })),
          session_id: sessionIdRef.current,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Handle keyboard shortcut: Enter to send. */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-3 sm:px-4 py-3 sm:py-4">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} screen-slide-up`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-[14px] sm:text-[15px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#C00F7A] text-white rounded-br-md'
                    : 'bg-white/70 backdrop-blur-xl border border-white/40 text-[#1D1D1F] rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start screen-slide-up" aria-label="Assistant is typing">
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C00F7A] typewriter-dot" />
                  <span className="w-2 h-2 rounded-full bg-[#C00F7A] typewriter-dot" />
                  <span className="w-2 h-2 rounded-full bg-[#C00F7A] typewriter-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-3 sm:px-4 pb-4 sm:pb-6 pt-3">
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl flex items-center gap-3 px-3 sm:px-4 py-3 shadow-sm">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask VSUAL Assistant..."
            className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 text-[#1D1D1F] text-sm sm:text-base placeholder:text-[#86868B] focus:outline-none px-0"
            disabled={loading}
            aria-label="Chat message input"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#C00F7A] hover:bg-[#9A0C62] text-white shrink-0 active:scale-90"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Send strokeWidth={1.25} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
