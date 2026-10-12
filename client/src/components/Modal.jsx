import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Modal base reutilizable: overlay con blur, cierre con Escape y bloqueo de scroll. */
export default function Modal({ open, onClose, title, subtitle, icon: Icon, children, footer, size = 'lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-3xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-2xl border border-line bg-ink-800 shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)] animate-scale-in`}
      >
        <div className="flex items-start gap-3 border-b border-line px-6 py-5">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
              <Icon className="h-5 w-5 text-brand" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-ink-850/60 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
