import React, { useEffect, useRef, useState } from 'react';
import { useAutoplayAllowed } from './scroll';

// 'auto' corre solo si se puede (sin movimiento reducido ni ahorro de datos); 'play' y 'pause' los elige la persona
export type VideoChoice = 'auto' | 'play' | 'pause';

interface LoopVideoProps {
  src: string;
  poster: string;
  label: string; // qué muestra el video, para lectores de pantalla
  width: number;
  height: number;
  className?: string;
  cover?: boolean; // llena su caja recortando, como una foto de fondo
  choice?: VideoChoice; // si llega, el control vive afuera (varios videos con un solo botón)
  controlClassName?: string; // dónde va el botón propio de pausa
}

const playIcon = <path d="M5 3l8 5-8 5z" />;
const pauseIcon = <path d="M4 3h3v10H4zM9 3h3v10H9z" />;

export const VideoToggleIcon: React.FC<{ playing: boolean }> = ({ playing }) => (
  <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
    {playing ? pauseIcon : playIcon}
  </svg>
);

// Video corto sin sonido que corre solo cuando al menos la mitad está a la vista.
// Con movimiento reducido o ahorro de datos se queda en el póster, salvo que la persona lo reproduzca.
export const LoopVideo: React.FC<LoopVideoProps> = ({
  src,
  poster,
  label,
  width,
  height,
  className = '',
  cover = false,
  choice,
  controlClassName = 'bottom-2.5 right-2.5',
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const allowed = useAutoplayAllowed();
  const [ownChoice, setOwnChoice] = useState<VideoChoice>('auto');
  const [playing, setPlaying] = useState(false);
  const current = choice ?? ownChoice;
  const shouldPlay = current === 'play' || (current === 'auto' && allowed);

  useEffect(() => {
    const video = ref.current;
    if (!video || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && shouldPlay) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [shouldPlay]);

  return (
    <div className={`relative ${cover ? 'size-full' : ''}`}>
      <video
        ref={ref}
        className={`block ${cover ? 'size-full object-cover' : 'w-full'} ${className}`}
        poster={poster}
        width={width}
        height={height}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={src} type="video/mp4" />
      </video>
      {choice === undefined && (
        <button
          type="button"
          onClick={() => setOwnChoice(playing ? 'pause' : 'play')}
          aria-label={playing ? 'Pausar video' : 'Reproducir video'}
          className={`absolute ${controlClassName} grid place-items-center size-8 rounded-full bg-night/75 text-white transition-[background-color,transform] duration-150 hover:bg-night active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
        >
          <VideoToggleIcon playing={playing} />
        </button>
      )}
    </div>
  );
};
