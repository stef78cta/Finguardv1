import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinGuard - Analiză Financiară Automată',
  description: 'Platformă SaaS pentru analiza automată a situațiilor financiare pentru companiile din România',
  keywords: ['contabilitate', 'analiză financiară', 'KPI', 'balanță contabilă', 'România'],
  authors: [{ name: 'FinGuard Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
