import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Ascent Capital Partners - Next Gen Platform',
    template: '%s | Ascent Capital Partners',
  },
  description: 'Preparing heirs to be wise stewards of family wealth through education, mentorship, and practical experience.',
  keywords: ['wealth education', 'family office', 'next generation', 'stewardship', 'financial literacy'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
