import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from 'sonner';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import PWARegister from '@/components/PWARegister';
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host';
import { BrandProvider } from '@/components/providers/BrandProvider';
import { getCanonicalBaseUrl } from '@/lib/seo-constants';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const host = await getHostFromHeaders()
  const brandName = await getBrandNameFromHost(host)
  // Each domain is self-canonical for independent SEO indexing
  const baseUrl = getCanonicalBaseUrl(host)

  return {
    metadataBase: new URL(baseUrl),
    title: `${brandName} | Insaat & Gayrimenkul CRM - Konut Projeleri icin Satis Yonetimi`,
    description: `${brandName}, insaat ve gayrimenkul firmalari icin ozel gelistirilmis CRM yazilimidir. Konut projeleri, stok takibi, broker yonetimi ve satis sureclerini tek platformda yonetin.`,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brandName,
    },
    icons: {
      icon: "/icon-512.png",
      apple: "/icon-512.png",
    },
    formatDetection: {
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export const viewport = {
  themeColor: "#020617", // Dark background for PWA
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // For notch phones
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Resolve brand for BrandProvider
  const host = await getHostFromHeaders();
  const brandName = await getBrandNameFromHost(host);
  const brandDomain = host.split(':')[0];
  return (
    <html lang={locale} suppressHydrationWarning data-ui-style="spatial">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-FB3G9V25SP"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-FB3G9V25SP');
            `}
          </Script>
          <Toaster />
          <PWARegister />
          <BrandProvider brandName={brandName} brandDomain={brandDomain}>
            {children}
          </BrandProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
