import type { Metadata } from 'next';
import { Orbitron, Share_Tech_Mono, Kode_Mono } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/NavBar';

const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

const shareTechMono = Share_Tech_Mono({
  variable: '--font-mono-nmc',
  subsets: ['latin'],
  weight: '400',
});

const kodeMono = Kode_Mono({
  variable: '--font-kode-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'MAGI CODEX — Author Dashboard',
  description: 'Generative narrative system: 12 MAGI, 200+ years, one channel.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${shareTechMono.variable} ${kodeMono.variable}`}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
