'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface MagiPortraitProps {
  magiId: string;
  fullName: string;
  domain: string;
  color: string;
  href: string;
}

export default function MagiPortrait({ magiId, fullName, domain, color, href }: MagiPortraitProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative',
        aspectRatio: '3 / 4',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}>
        <Image
          src={`/magi/${magiId.toLowerCase()}.png`}
          alt={fullName}
          fill
          sizes="25vw"
          style={{
            objectFit: 'cover',
            objectPosition: 'center top',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
          }}
        />

        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.72)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1rem',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}>
          {/* Top accent line */}
          <div style={{ width: '2rem', height: '1px', background: color, marginBottom: '0.5rem' }} />

          <div style={{
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            color: '#fff',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.3,
          }}>
            {fullName}
          </div>

          <div style={{
            fontSize: '0.55rem',
            letterSpacing: '0.12em',
            color: color,
            textAlign: 'center',
            lineHeight: 1.6,
            opacity: 0.85,
          }}>
            {domain}
          </div>
        </div>
      </div>
    </Link>
  );
}
