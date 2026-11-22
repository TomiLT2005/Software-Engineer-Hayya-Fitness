import { useEffect, useRef } from 'react';

/**
 * Matriz 3D interactiva de partículas ondulantes (Dot Matrix Wave).
 * - Ocupa estrictamente desde la mitad de la pantalla (50%) hacia abajo.
 * - Al pasar el cursor del mouse, los puntos reaccionan con repulsión magnética
 *   y se iluminan en el color naranja oficial de Hayya Fitness Club (#E85D26 / #EE743F).
 */
export default function ParticleWave() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setupCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setupCanvasSize();

    // Seguimiento del cursor
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
      radius: 155, // Radio de influencia del cursor
    };

    // Ondas expansivas por clics (shockwave)
    const ripples = [];

    const handleResize = () => {
      if (!canvas) return;
      setupCanvasSize();
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    const handleClick = (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        r: 0,
        maxR: Math.max(width, height) * 0.45,
        speed: 6,
        alpha: 0.85,
      });
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.active = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Parámetros de la grilla (densa y fina)
    const COLS = Math.min(115, Math.max(76, Math.floor(width / 14)));
    const ROWS = 55;
    const SPACING_X = Math.max(16, width / (COLS * 0.84));
    const SPACING_Z = 22;
    const FOV = 520; // Longitud focal

    let time = 0;

    const render = () => {
      time += 0.015;

      // Suavizado del movimiento del mouse (lerp)
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.12;
        mouse.y += (mouse.targetY - mouse.y) * 0.12;
      } else {
        mouse.x += (-9999 - mouse.x) * 0.08;
        mouse.y += (-9999 - mouse.y) * 0.08;
      }

      // Actualizar ondas de clics
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rp.speed;
        rp.alpha *= 0.965;
        if (rp.alpha < 0.02 || rp.r > rp.maxR) {
          ripples.splice(i, 1);
        }
      }

      // Limpiar fondo
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, width, height);

      // Centro de proyección: la mitad exacta de la pantalla
      const centerX = width * 0.5;
      const centerY = height * 0.50; // Horizonte en el 50% vertical
      const halfCols = COLS / 2;

      for (let iz = ROWS - 1; iz >= 0; iz--) {
        const z = iz * SPACING_Z + 80;
        const scale = FOV / (FOV + z);
        const depthRatio = 1 - iz / ROWS; // 1 cerca (abajo), 0 lejos (horizonte medio)

        for (let ix = 0; ix < COLS; ix++) {
          const x = (ix - halfCols) * SPACING_X;

          // Ondulación fluida
          const yWave =
            Math.sin(x * 0.0028 + time * 0.8) * 16 +
            Math.cos(z * 0.0036 + time * 0.65) * 18 +
            Math.sin((x + z) * 0.0018 + time * 0.9) * 9;

          // Elevación base de la superficie para que se expanda desde el centro hacia abajo
          const yElevation = (1 - depthRatio) * 10 + depthRatio * 320;

          // Posición proyectada en 2D
          let projX = centerX + x * scale;
          let projY = centerY + (yWave + yElevation) * scale;

          // Filtrar cualquier punto que intente subir de la mitad de la pantalla
          if (projY < height * 0.50) {
            continue;
          }

          // Desvanecimiento suave en la línea del horizonte medio (entre 50% y 53%)
          const horizonFade = Math.min(1, Math.max(0, (projY - height * 0.50) / 28));
          if (horizonFade <= 0.01) continue;

          // Interacción reactiva con el cursor del mouse
          let mouseFactor = 0;
          if (mouse.x > -500) {
            const dx = projX - mouse.x;
            const dy = projY - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < mouse.radius) {
              mouseFactor = Math.pow(1 - dist / mouse.radius, 1.7);
              const angle = Math.atan2(dy, dx);
              const pushForce = mouseFactor * 28; // Repulsión
              projX += Math.cos(angle) * pushForce;
              projY += Math.sin(angle) * pushForce - mouseFactor * 12;
            }
          }

          // Interacción con ondas de clic (shockwave)
          for (let k = 0; k < ripples.length; k++) {
            const rp = ripples[k];
            const rDist = Math.hypot(projX - rp.x, projY - rp.y);
            const waveDelta = Math.abs(rDist - rp.r);
            if (waveDelta < 50) {
              const wavePower = (1 - waveDelta / 50) * rp.alpha;
              projY -= wavePower * 18;
              mouseFactor = Math.max(mouseFactor, wavePower * 0.7);
            }
          }

          // Tamaño del punto fino
          const baseDotSize = 0.6 + scale * 0.8;
          const dotSize = Math.max(0.4, baseDotSize * (1 + mouseFactor * 0.9));

          // Opacidad base atenuada por el fade del horizonte
          let alpha = Math.min(0.72, Math.max(0.04, depthRatio * 0.42 + mouseFactor * 0.45)) * horizonFade;

          // COLOR: Naranja oficial de Hayya (#E85D26 = 232, 93, 38 / #F4956B = 244, 149, 107) al pasar el cursor
          if (mouseFactor > 0.05) {
            const t = Math.min(1, mouseFactor * 1.5);
            // Transición suave al naranja de Hayya
            const r = Math.round(175 + (232 - 175) * t); // 232
            const g = Math.round(175 + (93 - 175) * t);  // 93
            const b = Math.round(180 + (38 - 180) * t);  // 38
            const orangeAlpha = Math.min(0.95, (alpha + 0.35 * t)) * horizonFade;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${orangeAlpha})`;
          } else {
            // Partícula ambiental perlada
            const brightness = Math.round(140 + depthRatio * 70);
            ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 8}, ${alpha})`;
          }

          // Dibujar partícula
          ctx.beginPath();
          ctx.arc(projX, projY, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
