'use client';

import { useEffect, useState } from 'react';

interface HeroCarouselProps {
  images: string[];
  intervalMs?: number;
}

export default function HeroCarousel({ images, intervalMs = 5000 }: HeroCarouselProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: i === active ? 1 : 0,
            transition: 'opacity 1.5s ease',
          }}
        />
      ))}
    </div>
  );
}
