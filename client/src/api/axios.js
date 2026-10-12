import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Si una ruta protegida responde 401, avisamos a la app para cerrar sesión.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && (url.startsWith('/admin') || url.startsWith('/acceso'))) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

/** Extrae un mensaje legible de un error de axios. */
export function getErrorMessage(err, fallback = 'Ocurrió un error inesperado') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder';
  if (err?.request && !err?.response) return 'No se pudo conectar con el servidor';
  return fallback;
}

export default api;
