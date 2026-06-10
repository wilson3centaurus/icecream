import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { InstallPwaPrompt } from '@/components/pwa/install-pwa-prompt';
import { PwaLaunchSplash } from '@/components/pwa/launch-splash';
import { Providers } from '@/providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'Absolute Ice Cream ERP',
  description:
    "Manufacturing ERP for Zimbabwe's ice cream industry, from procurement to production, branches, and sales.",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Absolute Ice Cream ERP'
  },
  icons: {
    icon: [
      { url: '/branding/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/branding/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/branding/apple-touch-icon.png',
    shortcut: '/branding/icon-192.png',
  }
};

export const viewport: Viewport = {
  themeColor: '#f97316'
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
        <PwaLaunchSplash />
        <InstallPwaPrompt />
      </body>
    </html>
  );
}
