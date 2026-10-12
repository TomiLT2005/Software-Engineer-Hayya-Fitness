import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, cls: 'text-emerald-400', bar: 'bg-emerald-400' },
  error: { icon: XCircle, cls: 'text-red-400', bar: 'bg-red-400' },
  warning: { icon: AlertTriangle, cls: 'text-amber-400', bar: 'bg-amber-400' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, type = 'success', duration = 3500) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, message, type, duration }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-80 flex-col gap-3" aria-live="polite">
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.success;
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              className="pointer-events-auto relative overflow-hidden rounded-xl border border-line bg-ink-800/95 p-4 pr-10 shadow-2xl backdrop-blur animate-slide-up"
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.cls}`} />
                <p className="text-sm text-gray-200">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="absolute right-3 top-3 text-gray-500 hover:text-white"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
              <span
                className={`absolute bottom-0 left-0 h-0.5 w-full origin-left animate-shrink ${s.bar}`}
                style={{ animationDuration: `${t.duration}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
