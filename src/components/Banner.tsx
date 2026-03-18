'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Banner() {
  const pathname = usePathname();

  let subtitle = 'DASHBOARD';
  if (pathname === '/') {
    subtitle = 'THE TWELVE';
  } else if (pathname.startsWith('/dashboard/timeline')) {
    subtitle = 'TIMELINE';
  } else if (pathname.startsWith('/dashboard/dispatches')) {
    subtitle = 'DISPATCHES';
  } else if (pathname.match(/^\/dashboard\/[^/]+$/)) {
    subtitle = 'MAGI';
  } else if (pathname.startsWith('/login')) {
    subtitle = 'LOGIN';
  }

  return (
    <>
      <style>{`
        .nmc-banner-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 46px;
          z-index: 100;
          display: flex;
          font-family: var(--font-kode-mono), 'Courier New', monospace;
          background: #000;
        }

        .nmc-banner-left {
          display: flex;
          align-items: stretch;
          flex-shrink: 0;
        }

        .nmc-banner-icon-box {
          width: 46px;
          height: 46px;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nmc-banner-red-bar {
          width: 10px;
          height: 46px;
          background: #ff0000;
          flex-shrink: 0;
        }

        .nmc-banner-center {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          color: #000000;
          padding: 0 24px;
        }

        .nmc-banner-title-area {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nmc-banner-title {
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 1px;
          margin: 0;
          line-height: 1;
          color: #000000;
          text-decoration: none;
        }

        .nmc-banner-subtitle-sep {
          font-size: 16px;
          color: #7184a0;
          font-weight: 700;
        }

        .nmc-banner-subtitle {
          font-size: 20px;
          color: #7184a0;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .nmc-banner-links {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nmc-banner-link {
          font-family: var(--font-kode-mono), 'Courier New', monospace;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          color: #7184a0;
          letter-spacing: 0.08em;
          transition: opacity 0.2s;
        }

        .nmc-banner-link:hover {
          opacity: 0.7;
        }

        .nmc-banner-link-sep {
          font-size: 14px;
          color: #7184a0;
        }

        .nmc-banner-right {
          width: 120px;
          height: 46px;
          flex-shrink: 0;
          background: repeating-linear-gradient(
            -45deg,
            #ff0000 0px,
            #ff0000 12px,
            #000000 12px,
            #000000 24px
          );
        }

        body {
          padding-top: 46px;
        }
      `}</style>

      <div className="nmc-banner-wrapper">
        <div className="nmc-banner-left">
          <div className="nmc-banner-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0L13.1863 7.57259L18 1.6077L15.2411 8.75891L22.3923 6L16.4274 10.8137L24 12L16.4274 13.1863L22.3923 18L15.2411 15.2411L18 22.3923L13.1863 16.4274L12 24L10.8137 16.4274L6 22.3923L8.75891 15.2411L1.6077 18L7.57259 13.1863L0 12L7.57259 10.8137L1.6077 6L8.75891 8.75891L6 1.6077L10.8137 7.57259L12 0Z" fill="#7184A0" />
            </svg>
          </div>
          <div className="nmc-banner-red-bar" />
        </div>

        <div className="nmc-banner-center">
          <div className="nmc-banner-title-area">
            <Link href="/dashboard" className="nmc-banner-title">
              MAGI CODEX
            </Link>
            <span className="nmc-banner-subtitle-sep">:::</span>
            <span className="nmc-banner-subtitle">{subtitle}</span>
          </div>

          <div className="nmc-banner-links">
            <Link href="/dashboard" className="nmc-banner-link">DASHBOARD</Link>
            <span className="nmc-banner-link-sep">:::</span>
            <Link href="/dashboard/timeline" className="nmc-banner-link">TIMELINE</Link>
            <span className="nmc-banner-link-sep">:::</span>
            <Link href="/dashboard/dispatches" className="nmc-banner-link">DISPATCHES</Link>
          </div>
        </div>

        <div className="nmc-banner-right" />
      </div>
    </>
  );
}
