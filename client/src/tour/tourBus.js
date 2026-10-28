import { useEffect, useRef } from 'react';

/**
 * Bus de eventos entre el guided tour y los componentes.
 *
 * El tour necesita abrir/cerrar modales, el menú de Ajustes o el sidebar móvil para poder
 * mostrarlos. En lugar de acoplarlo a cada componente, emite un evento con el estado de UI que
 * necesita el paso actual y cada componente reacciona al que le corresponde.
 *
 * detail = { ui: 'base' | 'ajustes' | 'socio-nuevo' | ..., sidebar: boolean }
 */
export const TOUR_UI_EVENT = 'hayya:tour-ui';

export function emitTourUi(detail) {
  window.dispatchEvent(new CustomEvent(TOUR_UI_EVENT, { detail }));
}

/** Suscribe un componente a los cambios de UI que pide el tour (siempre usa el handler más reciente). */
export function useTourUi(handler) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const onEvent = (e) => ref.current?.(e.detail || {});
    window.addEventListener(TOUR_UI_EVENT, onEvent);
    return () => window.removeEventListener(TOUR_UI_EVENT, onEvent);
  }, []);
}
