import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Coordinates } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface RangerAiChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoords: Coordinates | null;
  weatherSummary?: string;
}

const QUICK_QUESTIONS = [
  'What should I pack for a day hike?',
  'How can I check trail conditions before leaving?',
  'How can I plan a turnaround time?',
];

export const RangerAiChat: React.FC<RangerAiChatProps> = ({
  isOpen,
  onClose,
  currentCoords,
  weatherSummary
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sendError, setSendError] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, sendError]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setSendError(false);

    try {
      const response = await fetch('/api/ranger-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map(m => ({ role: m.role, text: m.text })),
          context: {
            coords: currentCoords ? `${currentCoords.latitude.toFixed(4)}°, ${currentCoords.longitude.toFixed(4)}°` : undefined,
            elevation: currentCoords?.altitude == null ? undefined : `${Math.round(currentCoords.altitude)} m`,
            weather: weatherSummary
          }
        })
      });

      if (!response.ok) throw new Error('Ranger chat request failed');
      const data = await response.json();
      if (data?.isFallback || typeof data?.reply !== 'string' || !data.reply.trim()) {
        throw new Error('Ranger AI is unavailable');
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.reply.trim(),
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => prev.filter(item => item.id !== userMsg.id));
      setInput(previous => previous || text);
      setSendError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-t-2xl sm:rounded-2xl w-full max-w-xl h-[85vh] sm:h-[620px] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-100">Ranger AI Copilot</h3>
              </div>
              <div className="text-[11px] text-stone-400">
                Experimental AI for general hiking questions
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Ranger AI"
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 leading-relaxed relative group ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                    : 'bg-stone-950 border border-stone-800 text-stone-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.role === 'model' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="absolute top-2 right-2 p-1 text-stone-500 hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-stone-400 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Waiting for Ranger AI</span>
            </div>
          )}

          {sendError && <p role="alert" className="text-amber-300">Ranger AI unavailable. Try sending your question again.</p>}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-3 py-2 bg-stone-950/90 border-t border-stone-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-emerald-500/60 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a general hiking question"
            aria-label="Ask Ranger AI"
            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            aria-label="Send question"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition-colors shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
