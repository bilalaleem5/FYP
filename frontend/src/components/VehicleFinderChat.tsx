'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard';
import { useAuth } from '@/context/AuthContext';
import { getClientApiBaseUrl } from '@/lib/apiBase';
import { intentToSearchParams } from '@/lib/intentToSearchParams';

type ChatVehicle = {
  id: number;
  title: string;
  price: number;
  currency?: string;
  location?: string;
  model_year?: number;
  mileage?: number;
  transmission?: string;
  fuel_type?: string;
  image_url?: string;
  source_url?: string;
};

type Msg =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; vehicles: ChatVehicle[]; intent: Record<string, unknown> };

function toListingProps(v: ChatVehicle) {
  return {
    id: v.id,
    title: v.title ?? 'Listing',
    price: typeof v.price === 'number' ? v.price : 0,
    currency: v.currency || 'PKR',
    location: v.location || '',
    model_year: v.model_year ?? 0,
    mileage: v.mileage ?? 0,
    transmission: v.transmission || '',
    fuel_type: v.fuel_type || '',
    image_url: v.image_url || '',
    source_url: v.source_url || '#',
  };
}

const SAMPLE_PROMPTS = [
  'Honda Civic under 55 Lakh in Lahore',
  'Automatic 7-seater SUV in Islamabad',
  'Best fuel average hybrid under 40 Lakh',
  'Toyota Prado 4x4 clean condition',
];

export default function VehicleFinderChat() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history from existing messages for multi-turn context
      const conversationHistory = messages.map((msg) => {
        if (msg.role === 'user') {
          return { role: 'user' as const, content: msg.text };
        } else {
          return { role: 'assistant' as const, content: msg.text };
        }
      });

      const res = await fetch(`${getClientApiBaseUrl()}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          user_id: user?.id ?? null,
          conversation_history: conversationHistory,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text: `Something went wrong (${res.status}). ${errText.slice(0, 200)}`,
            vehicles: [],
            intent: {},
          },
        ]);
        return;
      }

      const data = await res.json();
      const vehicles: ChatVehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
      const intent = data.intent && typeof data.intent === 'object' ? data.intent : {};

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.ai_response || 'Here are the matching vehicles found from our verified inventory.',
          vehicles,
          intent,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `Could not reach the AI service at ${getClientApiBaseUrl()}. Please ensure the backend server is running.`,
          vehicles: [],
          intent: {},
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating High-Tech Action Button with Radar Ping */}
      <div className="fixed bottom-6 right-6 z-[60] md:bottom-8 md:right-8 flex items-center gap-3">
        {!open && (
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-sky-400/30 bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-sky-300 shadow-xl backdrop-blur-md animate-float">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Car Advisor</span>
          </div>
        )}
        <button
          type="button"
          aria-label={open ? 'Close AI assistant' : 'Open AI car finder'}
          onClick={() => setOpen((v) => !v)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-sky-500/40 ring-2 ring-white/80 transition-all duration-300 hover:scale-105 active:scale-95 md:h-16 md:w-16 animate-radar"
        >
          {open ? (
            <svg className="h-6 w-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-xl">✨</span>
              <span className="text-[9px] font-black uppercase tracking-wider">AI</span>
            </div>
          )}
        </button>
      </div>

      {/* Modern Slide-Up Chat Drawer */}
      {open && (
        <div
          className="fixed bottom-24 right-4 z-[60] flex w-[min(100vw-2rem,430px)] flex-col overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/95 shadow-[0_25px_60px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5 backdrop-blur-2xl md:bottom-28 md:right-8 animate-[slideUp_0.25s_ease-out]"
          style={{ height: 'min(580px, 82vh)' }}
        >
          {/* Frosted Glass Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-md">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <p className="text-sm font-black tracking-tight flex items-center gap-2">
                  VehicleWalay AI
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    Online
                  </span>
                </p>
                <p className="text-[11px] font-medium text-slate-400">Groq Llama 3.3 Engine • Multi-Turn Memory</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm" style={{ minHeight: 220 }}>
            {messages.length === 0 && (
              <div className="space-y-4 pt-2">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
                  <p className="text-xs font-bold text-sky-900">👋 Welcome to AI Discovery!</p>
                  <p className="mt-1 text-xs text-sky-800 leading-relaxed">
                    Ask anything naturally in English or Urdu. I remember previous context so you can say “Show cheaper options” or “Filter only Automatic”.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Try asking:</p>
                  <div className="flex flex-col gap-1.5">
                    {SAMPLE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void send(prompt)}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                      >
                        ⚡ “{prompt}”
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex flex-col gap-2'}>
                {msg.role === 'user' && (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 font-medium text-white shadow-md shadow-sky-500/20">
                    {msg.text}
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <>
                    <div className="max-w-[95%] rounded-2xl rounded-tl-sm border border-slate-200/80 bg-slate-50/90 p-4 leading-relaxed text-slate-800 shadow-sm">
                      <p className="whitespace-pre-line text-sm">{msg.text}</p>
                    </div>

                    {/* Intent Quick Navigation Button */}
                    {(() => {
                      const qs = intentToSearchParams(msg.intent);
                      return (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {qs ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false);
                                router.push(`/search?${qs}`);
                              }}
                              className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-black"
                            >
                              Explore all {msg.vehicles.length} in search grid →
                            </button>
                          ) : null}
                        </div>
                      );
                    })()}

                    {/* Embedded Card Preview Scroll */}
                    {msg.vehicles.length > 0 && (
                      <div className="grid max-h-[300px] grid-cols-1 gap-2.5 overflow-y-auto pt-1">
                        {msg.vehicles.slice(0, 5).map((v) => (
                          <div key={v.id} className="scale-[0.98] origin-top">
                            <ListingCard vehicle={toListingProps(v)} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 max-w-[160px]">
                <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                <span className="text-xs font-bold text-slate-500">AI Thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Console */}
          <form
            className="border-t border-slate-100 bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about price, city, model..."
                className="min-w-0 flex-1 rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
