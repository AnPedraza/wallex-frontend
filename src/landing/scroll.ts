import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Utilidades de scroll de la landing. Sin librerías: scroll pasivo + requestAnimationFrame.

const subscribeMedia = (query: string) => (onChange: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false
  );
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

type NavigatorWithData = Navigator & { connection?: { saveData?: boolean } };

// Los videos corren solos si no hay movimiento reducido ni ahorro de datos
export const useAutoplayAllowed = () => {
  const still = useReducedMotion();
  return !still && !(navigator as NavigatorWithData).connection?.saveData;
};

// Avance de 0 a 1 mientras la sección recorre la pantalla (para escenas fijas con position: sticky)
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const value = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : rect.top < 0 ? 1 : 0;
      setProgress(value);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return [ref, progress] as const;
}

// true la primera vez que el elemento entra en pantalla (y se queda en true)
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(() => typeof window === 'undefined' || !('IntersectionObserver' in window));

  useEffect(() => {
    const el = ref.current;
    if (seen || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen, threshold]);

  return [ref, seen] as const;
}

// Interpolación del avance de un tramo [from, to] a 0..1
export const segment = (p: number, from: number, to: number) => Math.min(1, Math.max(0, (p - from) / (to - from)));

// Curva de salida exponencial, la misma de las animaciones del sistema
export const easeOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Entrada y salida suaves, para recorridos largos que no deben arrancar ni frenar de golpe
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Avance de 0 a 1 de una escena fija (sección alta con un escenario pegado arriba).
// stickyTop es la altura a la que se pega la escena (la barra mide 64 px).
export function sceneProgress(section: HTMLElement, stage: HTMLElement, stickyTop: number) {
  const rect = section.getBoundingClientRect();
  const travel = rect.height - stage.offsetHeight;
  return travel > 0 ? Math.min(1, Math.max(0, (stickyTop - rect.top) / travel)) : 0;
}

// Sigue al scroll con un poco de inercia, para que la escena no salte con cada giro de la rueda:
// en cada cuadro acerca el valor un 16 % a su objetivo y se detiene al llegar
export function followScroll(target: () => number, render: (value: number) => void) {
  let current = target();
  let frame = 0;
  const tick = () => {
    frame = 0;
    const goal = target();
    current += (goal - current) * 0.16;
    if (Math.abs(goal - current) < 0.0004) current = goal;
    else frame = requestAnimationFrame(tick);
    render(current);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };
  render(current);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  };
}

// Versión con estado de lo anterior, para escenas que se pintan con React
export function useSmoothSceneProgress<T extends HTMLElement, S extends HTMLElement>(stickyTop = 64) {
  const ref = useRef<T>(null);
  const stageRef = useRef<S>(null);
  const [progress, setProgress] = useState(0);

  useEffect(
    () =>
      followScroll(
        () => (ref.current && stageRef.current ? sceneProgress(ref.current, stageRef.current, stickyTop) : 0),
        setProgress
      ),
    [stickyTop]
  );

  return [ref, stageRef, progress] as const;
}

// Avance de 0 a 1 mientras la sección cruza la pantalla, de que asoma abajo a que sale arriba
export function useViewProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const value = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      setProgress(Math.min(1, Math.max(0, value)));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return [ref, progress] as const;
}

// Avance de 0 a 1 en el tiempo, una sola vez, desde que run pasa a true (cuentas en celular).
// delay deja que la cuenta empiece cuando la escena ya está armada.
export function useTimedProgress(run: boolean, duration = 1200, delay = 0) {
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!run) return;
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const value = Math.min(1, Math.max(0, (now - start) / duration));
      setT(value);
      if (value < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, duration, delay]);

  return t;
}
