/** "42109832" -> "42.109.832" */
export const formatDni = (dni) => String(dni ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');

/** 10000 -> "$10.000,00" | 10500.5 -> "$10.500,50" */
export const formatMoney = (amount) => {
  const num = Number(amount) || 0;
  return `$${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Formateo genérico de números con decimales (es-AR) */
export const formatNumber = (val, decimals = 2) => {
  const num = Number(val) || 0;
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/** Formateo de porcentajes (ej. 95.5 -> "95,5%") */
export const formatPercent = (val, decimals = 1) => {
  const num = Number(val) || 0;
  return `${num.toLocaleString('es-AR', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : decimals,
    maximumFractionDigits: decimals,
  })}%`;
};

export const PLANES = ['Mensual', 'Quincenal', '1 Día', 'Mujeres', 'Kids', 'Infanto'];

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
