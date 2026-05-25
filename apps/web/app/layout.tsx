import type { Metadata, Viewport } from 'next';

import { appConfig } from '@aaska/config';

import './globals.css';

import { CartDrawer } from '@/components/cart-drawer';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Providers } from '@/components/providers';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: `${appConfig.name} | Resin Art`,
  description: appConfig.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {/*
           * CartDrawer sits outside ResponsiveLayout so it renders as a
           * full-viewport overlay on both mobile and desktop.
           */}
          <CartDrawer />

          {/*
           * SiteHeader and SiteFooter are server components passed as props
           * so they stay server-rendered while ResponsiveLayout (a client
           * component) decides which shell to render based on viewport size.
           */}
          <ResponsiveLayout header={<SiteHeader />} footer={<SiteFooter />}>
            {children}
          </ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
