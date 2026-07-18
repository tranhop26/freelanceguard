import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DemoBanner } from '@/components/DemoBanner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'FreelanceGuard — AI-powered USDC escrow for freelancers',
  description: 'Get paid in minutes, not weeks. 2% fee vs 15-20% on Upwork. AI Judge for disputes. Built on Arc blockchain.',
  keywords: ['freelance', 'USDC', 'escrow', 'Arc blockchain', 'AI arbitration', 'ERC-8004'],
  openGraph: {
    title: 'FreelanceGuard',
    description: 'AI-powered USDC escrow for freelancers on Arc',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreelanceGuard',
    description: 'AI-powered USDC escrow for freelancers on Arc',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 font-sans">
        <Providers>
          <DemoBanner />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
