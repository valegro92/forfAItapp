import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ForfAIt | Il tuo cruscotto forfettario',
  description: 'La Cassetta degli AI-trezzi - Cruscotto fiscale per freelancer in regime forfettario',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${inter.className} bg-[#0f172a] text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
