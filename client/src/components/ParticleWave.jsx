import { useEffect, useRef } from 'react';

/**
 * Superficie continua de partículas en perspectiva 3D (Océano digital / Terreno ondulado).
 * - Geometría en perspectiva 3D con cámara inclinada (pitch) que mira hacia el horizonte.
 * - Ondas orgánicas y armónicas continuas sin efecto de cuadrícula plana ni pared vertical.
 * - Ocupa todo el ancho horizontal de borde a borde comenzando desde el 40% de la pantalla hacia abajo.
 * - Interacción de mouse: genera perturbaciones ondulantes superficiales (sin deformaciones circulares 2D)
 *   e iluminación progresiva en naranja #F15A24 con degradado suave hacia partículas cercanas.
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

    // Seguimiento del cursor con suavizado
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
      radius: 200, // Radio amplio de iluminación y perturbación
    };

    // Ondulaciones propagadas por pulsos
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
        speed: 5.5,
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

    // Parámetros de la cámara en 3D
    const FOV = 550; // Longitud focal
    const pitchAngle = 20 * (Math.PI / 180); // Inclinación de 20 grados mirando hacia abajo
    const cosPitch = Math.cos(pitchAngle);
    const sinPitch = Math.sin(pitchAngle);
    const tanPitch = Math.tan(pitchAngle);

    // Grilla continua en 3D
    const COLS = Math.min(135, Math.max(85, Math.floor(width / 14)));
    const ROWS = 60;
    const Z_STEP = 34;
    const Z_NEAR = 240;

    let time = 0;

    const render = () => {
      time += 0.014;

      // Suavizado del movimiento del mouse
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

      // Fondo negro profundo
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, width, height);

      // Posición del horizonte óptico: elevado un 10% (al 40% de la altura de la pantalla)
      const horizonY = height * 0.40;
      const centerY = horizonY + FOV * tanPitch;
      const centerX = width * 0.5;

      // Altura base de la cámara sobre el plano de agua
      const camHeight = 350;

      // Renderizado ordenado desde el fondo hacia el frente (Painter's Algorithm)
      for (let iz = ROWS - 1; iz >= 0; iz--) {
        const zWorld = (ROWS - 1 - iz) * Z_STEP + Z_NEAR;
        const depthRatio = 1 - iz / (ROWS - 1); // 0 en horizonte (lejos), 1 en frente (abajo)

        // Calcular el factor de escala proyectada de la fila para abarcar de extremo a extremo
        const cY_row = camHeight;
        const yRot_row = cY_row * cosPitch - zWorld * sinPitch;
        const zRot_row = cY_row * sinPitch + zWorld * cosPitch;
        if (zRot_row <= 20) continue;
        const scale_row = FOV / zRot_row;

        // Ancho calculado para que la fila cubra todo el ancho de la pantalla sin cortes laterales
        const halfWidthIn3D = (width * 0.56) / scale_row;

        for (let ix = 0; ix < COLS; ix++) {
          const xWorld = ((ix / (COLS - 1)) - 0.5) * 2 * halfWidthIn3D;

          // 1. ONDAS ORGÁNICAS MÚLTIPLES (Sensación de océano digital / terreno fluido)
          const w1 = Math.sin(xWorld * 0.0017 + zWorld * 0.0022 + time * 1.05) * 38;
          const w2 = Math.cos(xWorld * 0.0024 - zWorld * 0.0019 + time * 0.85) * 32;
          const w3 = Math.sin((xWorld + zWorld) * 0.0013 + time * 0.7) * 20;
          const w4 = Math.cos(zWorld * 0.0031 + time * 1.2) * 16;
          let yTerrain = w1 + w2 + w3 + w4;

          // Estimación 2D previa para calcular interacción con mouse antes de la proyección final
          const cY_init = yTerrain + camHeight;
          const yRot_init = cY_init * cosPitch - zWorld * sinPitch;
          const zRot_init = cY_init * sinPitch + zWorld * cosPitch;
          if (zRot_init <= 10) continue;
          const scale_init = FOV / zRot_init;

          const estProjX = centerX + xWorld * scale_init;
          const estProjY = centerY + yRot_init * scale_init;

          // 2. INTERACCIÓN CON EL CURSOR: Perturbación de altura en el océano
          let mouseFactor = 0;
          if (mouse.x > -500) {
            const dx = estProjX - mouse.x;
            const dy = estProjY - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < mouse.radius) {
              const u = 1 - dist / mouse.radius;
              // Smoothstep para transiciones suaves sin bordes circulares marcados
              mouseFactor = u * u * (3 - 2 * u);

              // Perturbación vertical suave sobre la superficie del océano (sube y baja como agua)
              const surfaceRipple = Math.sin(dist * 0.04 - time * 3.2) * mouseFactor * 26;
              yTerrain -= surfaceRipple;
            }
          }

          // Interacción con ondas expansivas por clic
          for (let k = 0; k < ripples.length; k++) {
            const rp = ripples[k];
            const rDist = Math.hypot(estProjX - rp.x, estProjY - rp.y);
            const delta = Math.abs(rDist - rp.r);
            if (delta < 55) {
              const power = (1 - delta / 55) * rp.alpha;
              yTerrain -= Math.sin(delta * 0.1) * power * 24;
              mouseFactor = Math.max(mouseFactor, power * 0.6);
            }
          }

          // 3. TRANSFORMACIÓN 3D REAL (Cámara inclinada mirando hacia abajo)
          const cY = yTerrain + camHeight;
          const yRot = cY * cosPitch - zWorld * sinPitch;
          const zRot = cY * sinPitch + zWorld * cosPitch;
          if (zRot <= 10) continue;

          const scale = FOV / zRot;
          const projX = centerX + xWorld * scale;
          const projY = centerY + yRot * scale;

          // Limitar estrictamente a la mitad inferior de la pantalla
          if (projY < horizonY - 4) {
            continue;
          }

          // Desvanecimiento suave en la línea del horizonte medio
          const horizonFade = Math.min(1, Math.max(0, (projY - horizonY) / 32));
          if (horizonFade <= 0.01) continue;

          // 4. TAMAÑO DE PARTÍCULA EN PERSPECTIVA
          // Pequeñas y compactas en la distancia, más grandes en primer plano
          const baseDotSize = 0.65 + scale * 1.35;
          const dotSize = Math.max(0.4, baseDotSize * (1 + mouseFactor * 0.45));

          // Realce de luz natural en las crestas de las olas
          const crestBonus = Math.max(0, -yTerrain / 90) * 0.18;

          // Opacidad base atenuada con la profundidad
          let alpha = Math.min(0.85, Math.max(0.04, depthRatio * 0.46 + crestBonus)) * horizonFade;

          // 5. COLOR E ILUMINACIÓN: Naranja #F15A24 (o #E85D26) que se difumina suavemente
          if (mouseFactor > 0.02) {
            const t = mouseFactor; // Caída suave progresiva
            // Partículas se iluminan progresivamente hacia el naranja #F15A24 (241, 90, 36)
            const r = Math.round(180 + (241 - 180) * t); // 241
            const g = Math.round(180 + (90 - 180) * t);  // 90
            const b = Math.round(190 + (36 - 190) * t);  // 36
            const orangeAlpha = Math.min(0.98, alpha + 0.55 * t) * horizonFade;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${orangeAlpha})`;
          } else {
            // Partícula ambiental tenue: blanco perlado y gris en valles
            const brightness = Math.round(135 + depthRatio * 80 + crestBonus * 90);
            ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 4}, ${alpha})`;
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
