'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[250px] p-4 rounded-xl glass border-l-4 shadow-xl animate-slide-up flex items-center justify-between gap-4 ${
              t.type === 'success' ? 'border-[var(--color-success)] text-[var(--color-success)]' : 'border-[var(--color-danger)] text-[var(--color-danger)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{t.type === 'success' ? '✅' : '❌'}</span>
              <p className="text-sm font-semibold">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[var(--color-text-muted)] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
