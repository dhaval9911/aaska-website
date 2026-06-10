import type { Metadata, Viewport } from 'next';

import './globals.css';

import { CartDrawer } from '@/components/cart-drawer';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Providers } from '@/components/providers';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { defaultSEO } from '@/config/seo';

export const metadata: Metadata = {
  metadataBase: new URL(defaultSEO.siteUrl),
  title: {
    default: defaultSEO.defaultTitle,
    template: '%s | Resin Dreams',
  },
  description: defaultSEO.defaultDescription,
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    siteName: defaultSEO.siteName,
    type: 'website',
    images: [defaultSEO.defaultOGImage],
  },
  twitter: {
    card: 'summary_large_image',
    site: defaultSEO.twitterHandle,
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'Resin Dreams',
              description: 'Handcrafted resin art and raw materials',
              url: defaultSEO.siteUrl,
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Ahmedabad',
                addressRegion: 'Gujarat',
                addressCountry: 'IN',
              },
            }),
          }}
        />
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
