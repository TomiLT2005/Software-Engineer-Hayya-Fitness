import { useEffect, useRef } from 'react';

/**
 * Lienzo 3D interactivo de matriz de partículas ondulantes (Dot Matrix Wave).
 * Al mover el mouse, los puntos cercanos reaccionan con repulsión magnética,
 * perturbación de altura y un brillo cálido en la paleta naranja de Hayya.
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

    // Seguimiento del mouse
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
      radius: 140, // Radio sutil de influencia del cursor
    };

    // Ondas expansivas por clics (efecto shockwave)
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
        maxR: Math.max(width, height) * 0.4,
        speed: 5.5,
        alpha: 0.8,
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

    // Parámetros de la grilla de partículas en 3D (mayor densidad y finura)
    const COLS = Math.min(105, Math.max(72, Math.floor(width / 15)));
    const ROWS = 54;
    const SPACING_X = Math.max(16, width / (COLS * 0.82));
    const SPACING_Z = 24;
    const FOV = 540; // Longitud focal de la cámara

    let time = 0;

    const render = () => {
      time += 0.014;

      // Suavizado del movimiento del mouse (lerp)
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;
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

      // Fondo oscuro profundo
      ctx.fillStyle = '#07080c';
      ctx.fillRect(0, 0, width, height);

      // Centro de proyección de cámara (mitad inferior)
      const centerX = width * 0.5;
      const centerY = height * 0.63;

      // Precalcular límites
      const halfCols = COLS / 2;

      for (let iz = ROWS - 1; iz >= 0; iz--) {
        const z = iz * SPACING_Z + 110; // Profundidad Z
        const scale = FOV / (FOV + z);
        const depthRatio = 1 - iz / ROWS; // 1 en primer plano, 0 en el fondo lejano

        for (let ix = 0; ix < COLS; ix++) {
          const x = (ix - halfCols) * SPACING_X;

          // Ecuación de onda senoidal más suave y sutil
          let y =
            Math.sin(x * 0.0028 + time * 0.85) * 18 +
            Math.cos(z * 0.0036 + time * 0.7) * 22 +
            Math.sin((x + z) * 0.0018 + time * 0.95) * 10;

          // Posición proyectada básica en 2D
          let projX = centerX + x * scale;
          let projY = centerY + (y + 115) * scale;

          // Interacción sutil con el cursor del mouse
          let mouseFactor = 0;
          if (mouse.x > -500) {
            const dx = projX - mouse.x;
            const dy = projY - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < mouse.radius) {
              mouseFactor = Math.pow(1 - dist / mouse.radius, 1.8);
              const angle = Math.atan2(dy, dx);
              const pushForce = mouseFactor * 26; // Repulsión suave
              projX += Math.cos(angle) * pushForce;
              projY += Math.sin(angle) * pushForce - mouseFactor * 12;
            }
          }

          // Interacción con ondas de clic (shockwave)
          for (let k = 0; k < ripples.length; k++) {
            const rp = ripples[k];
            const rdx = projX - rp.x;
            const rdy = projY - rp.y;
            const rDist = Math.hypot(rdx, rdy);
            const waveDelta = Math.abs(rDist - rp.r);
            if (waveDelta < 50) {
              const wavePower = (1 - waveDelta / 50) * rp.alpha;
              projY -= wavePower * 18;
              mouseFactor = Math.max(mouseFactor, wavePower * 0.65);
            }
          }

          // Tamaño del punto más fino y delicado (no tan grande)
          const baseDotSize = 0.65 + scale * 0.85;
          const dotSize = Math.max(0.4, baseDotSize * (1 + mouseFactor * 0.7));

          // Opacidad y brillo delicados
          let alpha = Math.min(0.65, Math.max(0.03, depthRatio * 0.36 + mouseFactor * 0.4));

          if (mouseFactor > 0.15) {
            // Brillo naranja suave de Hayya
            const orangeIntensity = Math.min(1, mouseFactor * 1.2);
            ctx.fillStyle = `rgba(${Math.round(232 + 23 * orangeIntensity)}, ${Math.round(
              93 + 60 * (1 - orangeIntensity)
            )}, ${Math.round(38 * (1 - orangeIntensity))}, ${Math.min(0.85, alpha + 0.15)})`;
          } else {
            // Partícula ambiental perlada sutil
            const brightness = Math.round(145 + depthRatio * 65);
            ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 10}, ${alpha})`;
          }

          // Dibujar el punto
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
