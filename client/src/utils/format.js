/** "42109832" -> "42.109.832" */
export const formatDni = (dni) => String(dni ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');

export const PLANES = ['Mensual', 'Quincenal', 'Diario'];

const TZ = 'America/Argentina/Buenos_Aires';

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: TZ });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  });

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ });

/** "hace 3 min" */
export function timeAgo(iso) {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 45) return 'recién';
  if (diff < 3600) return `hace ${Math.round(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.round(diff / 3600)} h`;
  return `hace ${Math.round(diff / 86400)} d`;
}
