'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

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
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="75vw"
          style={{
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: i === active ? 1 : 0,
            transition: 'opacity 1.5s ease',
            position: 'absolute',
          }}
        />
      ))}
    </div>
  );
}
