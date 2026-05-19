// app/layout.tsx
// Layout raíz — fuentes Syne + DM Sans, AuthHydrator global
// crafted by JR ♥

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import AuthHydrator from '@/components/AuthHydrator';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WinPredict — Pronósticos del Mundial',
  description: 'Crea grupos, predice resultados y compite con tus amigos.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <AuthHydrator />
        {children}
      </body>
    </html>
  );
}
