'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const typeConfig: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: '✓',
      text: 'text-emerald-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '✕',
      text: 'text-red-800',
    },
    info: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      icon: 'ℹ',
      text: 'text-sky-800',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: '⚠',
      text: 'text-amber-800',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const config = typeConfig[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-lg backdrop-blur-sm animate-[slideUp_0.3s_ease-out] ${config.bg} ${config.border}`}
              style={{
                minWidth: 280,
                maxWidth: 420,
              }}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  toast.type === 'success'
                    ? 'bg-emerald-500 text-white'
                    : toast.type === 'error'
                    ? 'bg-red-500 text-white'
                    : toast.type === 'warning'
                    ? 'bg-amber-500 text-white'
                    : 'bg-sky-500 text-white'
                }`}
              >
                {config.icon}
              </span>
              <p className={`flex-1 text-sm font-semibold ${config.text}`}>
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className={`ml-2 shrink-0 text-sm font-bold opacity-50 transition hover:opacity-100 ${config.text}`}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
