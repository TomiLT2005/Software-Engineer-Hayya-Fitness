/**
 * Emblema del corredor de Hayya Fitness Club (vectorizado del logo oficial).
 * Usa `currentColor`, así que se colorea con clases de texto (ej. text-brand).
 */
export function Emblem({ className = '', title, ...props }) {
  return (
    <svg
      viewBox="200 -5 545 550"
      fill="currentColor"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title && <title>{title}</title>}
      <polygon points="318,157 350,125 410,185 378,217" />
      <polygon points="363,112 478,0 575,98 680,2 735,58 572,213 478,118 422,170" />
      <polygon points="430,265 488,213 640,378 476,530 422,472 525,375" />
      <polygon points="208,483 368,322 424,380 265,538" />
    </svg>
  );
}

/** Logo completo: emblema + "Hayya" + "FITNESS CLUB" */
export function Wordmark({ className = '', emblemClass = 'text-brand', size = 'md' }) {
  const s = {
    sm: { e: 'h-8 w-8', t: 'text-2xl', c: 'text-[8px]' },
    md: { e: 'h-14 w-14', t: 'text-4xl', c: 'text-[10px]' },
    lg: { e: 'h-24 w-24', t: 'text-6xl', c: 'text-sm' },
  }[size];
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Emblem className={`${s.e} ${emblemClass}`} title="Hayya Fitness Club" />
      <span className={`mt-3 font-extrabold leading-none tracking-tight text-white ${s.t}`}>Hayya</span>
      <span className={`mt-2 font-medium tracking-[0.45em] text-gray-300 ${s.c}`}>FITNESS CLUB</span>
    </div>
  );
}

/** Insignia circular "HAYYA CLUB" del sidebar (según Figma) */
export function ClubBadge({ className = '' }) {
  return (
    <div
      className={`relative flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-brand bg-ink-900 shadow-[0_0_30px_-4px_rgba(255,85,0,.55)] ${className}`}
    >
      <span className="absolute inset-1 rounded-full border border-brand/20" />
      <Emblem className="mb-0.5 h-4 w-4 text-brand" />
      <span className="text-[13px] font-extrabold leading-none tracking-[0.12em] text-brand">HAYYA</span>
      <span className="mt-0.5 text-[8px] font-semibold tracking-[0.35em] text-brand/80">CLUB</span>
    </div>
  );
}
