import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { TOURS, tourKeyForPath } from './tours.js';
import { emitTourUi } from './tourBus.js';

const TourContext = createContext({
  startTour: () => {},
  startPageTour: () => {},
  hasPageTour: false,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isVisible = (el) => Boolean(el) && el.getClientRects().length > 0;

/** Espera a que aparezca (y sea visible) un elemento, por ejemplo tras abrir un modal o cargar datos. */
function waitForElement(selector, timeout) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (isVisible(el)) return resolve(el);
      if (performance.now() - start >= timeout) return resolve(null);
      return setTimeout(tick, 60);
    };
    tick();
  });
}

/**
 * Crea y ejecuta un tour. Devuelve la instancia de driver.js para poder cancelarlo.
 *
 * driver.js dibuja el overlay y el popover; acá solo agregamos la lógica propia:
 *  - antes de mostrar cada paso, pedir a la UI el estado que necesita (abrir modal, sidebar, etc.)
 *  - esperar a que el elemento exista y saltear el paso si no aparece
 */
function runTour(tour, onFinish) {
  const { steps, keepUi = false } = tour;

  // Estado de UI que asumimos al arrancar. El botón Ayuda vive en el sidebar, así que en mobile
  // arranca abierto: lo marcamos como tal para que el primer paso lo cierre si hace falta.
  let current = keepUi ? null : { ui: 'base', sidebar: true };
  let busy = false;
  let isDestroyed = false;

  /** Deja la UI lista para el paso y devuelve true si el paso se puede mostrar. */
  const prepare = async (step) => {
    let changed = false;

    if (!keepUi) {
      const want = { ui: step.ui || 'base', sidebar: Boolean(step.sidebar) };
      if (want.ui !== current.ui || want.sidebar !== current.sidebar) {
        emitTourUi(want);
        current = want;
        changed = true;
        await sleep(120); // deja que React aplique el cambio
      }
    }

    if (!step.element) {
      if (changed) await sleep(300);
      return true;
    }

    // Los pasos que abren un modal pueden depender de una API (ficha, historial): damos más margen
    const el = await waitForElement(step.element, step.ui && step.ui !== 'base' ? 4500 : 1500);
    if (!el) return false;
    if (changed) await sleep(320); // espera la animación del modal / sidebar
    return true;
  };

  /** Va al paso `target`, salteando los que no se puedan mostrar en la dirección del movimiento. */
  const go = async (target, dir, first = false) => {
    if (busy || isDestroyed) return;
    busy = true;
    try {
      let i = target;
      while (i >= 0 && i < steps.length) {
        if (isDestroyed) return;
        // eslint-disable-next-line no-await-in-loop
        if (await prepare(steps[i])) {
          if (isDestroyed) return;
          if (first) drv.drive(i);
          else drv.moveTo(i);
          return;
        }
        i += dir;
      }
      if (dir > 0 && !isDestroyed) drv.destroy(); // no quedan pasos hacia adelante: fin del tour
    } finally {
      busy = false;
    }
  };

  const cleanup = () => {
    if (isDestroyed) return;
    isDestroyed = true;
    window.removeEventListener('keydown', handleKeyDown, true);
    // Cerramos cualquier modal / menú que el tour haya abierto
    if (!keepUi) emitTourUi({ ui: 'base', sidebar: false });
    onFinish?.();
  };

  const handleKeyDown = (e) => {
    if (isDestroyed) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      if (busy) return;

      const activeEl = document.activeElement;
      // Si el foco está explícitamente en el botón de retroceso "Atrás", va hacia atrás
      if (activeEl?.closest?.('.driver-popover-prev-btn')) {
        const idx = drv.getActiveIndex() ?? 0;
        if (!drv.isFirstStep()) {
          go(idx - 1, -1);
        }
        return;
      }

      // Enter avanza siempre al siguiente paso (o finaliza si es el último).
      // El cierre se reserva exclusivamente para la tecla Escape o el click en (✕).
      if (drv.isLastStep()) {
        drv.destroy();
      } else {
        const idx = drv.getActiveIndex() ?? -1;
        go(idx + 1, 1);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      drv.destroy();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      if (drv.isLastStep()) {
        drv.destroy();
      } else {
        const idx = drv.getActiveIndex() ?? -1;
        go(idx + 1, 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      const idx = drv.getActiveIndex() ?? 0;
      if (!drv.isFirstStep()) {
        go(idx - 1, -1);
      }
    }
  };

  const drv = driver({
    animate: true,
    smoothScroll: true,
    showProgress: true,
    allowClose: true,
    allowKeyboardControl: false, // Controlamos el teclado con keydown para Enter, Escape y flechas
    overlayOpacity: 0.78,
    stagePadding: 8,
    stageRadius: 12,
    // No se puede interactuar con lo resaltado ni cerrar clickeando el fondo: evita salir sin querer
    disableActiveInteraction: true,
    overlayClickBehavior: 'none',
    popoverClass: 'hayya-tour',
    progressText: 'Paso {{current}} de {{total}}',
    nextBtnText: 'Siguiente <kbd class="tour-kbd">↵</kbd>',
    prevBtnText: 'Atrás',
    doneBtnText: 'Finalizar <kbd class="tour-kbd">↵</kbd>',
    closeBtnLabel: 'Cerrar tutorial (Esc)',
    onPopoverRender: (popover) => {
      if (popover?.closeButton) {
        popover.closeButton.title = 'Cerrar tutorial (Esc)';
      }
      if (popover?.previousButton) {
        popover.previousButton.title = 'Paso anterior (←)';
      }
      if (popover?.nextButton) {
        popover.nextButton.title = 'Siguiente paso (Enter o →)';
      }

      // driver.js internamente le hace focus al primer botón disponible (el botón cerrar ✕).
      // Asignamos el focus de inmediato al botón "Siguiente" / "Finalizar" para que apenas aparezca
      // el cartel el usuario pueda presionar Enter de una sin tocar Tab.
      const focusNext = () => {
        if (popover?.nextButton && isVisible(popover.nextButton)) {
          popover.nextButton.focus();
        }
      };

      requestAnimationFrame(() => {
        focusNext();
        setTimeout(focusNext, 40);
      });
    },
    steps: steps.map((s) => ({
      element: s.element ? () => document.querySelector(s.element) : undefined,
      popover: {
        title: s.title,
        description: s.description,
        side: s.side,
        align: s.align,
      },
    })),
    onNextClick: () => go((drv.getActiveIndex() ?? -1) + 1, 1),
    onPrevClick: () => go((drv.getActiveIndex() ?? 1) - 1, -1),
    onDestroyed: cleanup,
  });

  window.addEventListener('keydown', handleKeyDown, true);

  go(0, 1, true);
  return drv;
}

export function TourProvider({ children }) {
  const { pathname } = useLocation();
  const activeRef = useRef(null);
  const pageKey = tourKeyForPath(pathname);
  const pageKeyRef = useRef(pageKey);
  pageKeyRef.current = pageKey;

  const startTour = useCallback((key) => {
    const tour = TOURS[key];
    if (!tour) return;
    activeRef.current?.destroy();
    const drv = runTour(tour, () => {
      if (activeRef.current === drv) activeRef.current = null;
    });
    activeRef.current = drv;
  }, []);

  const startPageTour = useCallback(() => {
    if (pageKeyRef.current) startTour(pageKeyRef.current);
  }, [startTour]);

  // Si el usuario navega a otra página con un tour abierto, lo cerramos
  useEffect(() => {
    activeRef.current?.destroy();
  }, [pathname]);

  const value = useMemo(
    () => ({ startTour, startPageTour, hasPageTour: Boolean(pageKey) }),
    [startTour, startPageTour, pageKey]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export const useTour = () => useContext(TourContext);
