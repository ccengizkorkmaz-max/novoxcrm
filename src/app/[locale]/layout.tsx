export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import PWARegister from '@/components/PWARegister';
import { getBrandNameFromHost, getHostFromHeaders, adjustBranding } from '@/lib/tenant/resolve-brand-from-host';
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

  // Double-dipping strategy: target different search intents with the two brands
  let title = `${brandName} | İnşaat & Gayrimenkul CRM - Konut Projeleri İçin Satış Yönetimi`;
  let description = `${brandName}, inşaat ve gayrimenkul firmaları için özel geliştirilmiş CRM yazılımıdır. Konut projeleri, stok takibi, broker yönetimi ve satış süreçlerini tek platformda yönetin.`;

  if (brandName === 'Oikos CRM') {
    title = `Oikos CRM | Emlak Danışmanları ve Acenteler İçin Hızlı Gayrimenkul CRM`;
    description = `Oikos CRM, hızlı büyüyen emlak ofisleri ve danışmanlar için pratik ve uygun fiyatlı gayrimenkul CRM yazılımıdır. Yapay zeka destekli müşteri takibi ve portföy yönetimi.`;
  } else if (brandName === 'Novox CRM') {
    title = `Novox CRM | Kurumsal İnşaat Firmaları ve Geliştiriciler İçin Gayrimenkul CRM`;
    description = `Novox CRM, büyük ölçekli inşaat ve gayrimenkul geliştirme firmaları için ERP entegrasyonlu, gelişmiş proje ve satış yönetimi çözümüdür.`;
  }

  return {
    metadataBase: new URL(baseUrl),
    title: title,
    description: description,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brandName,
    },
    icons: {
      icon: brandName === 'Oikos CRM' ? '/oikos-logo.svg' : '/favicon.ico',
      apple: brandName === 'Oikos CRM' ? '/oikos-logo.svg' : '/icon-512.png',
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

  const rawMessages = await getMessages();

  // Resolve brand for BrandProvider
  const host = await getHostFromHeaders();
  const brandName = await getBrandNameFromHost(host);
  const brandDomain = host.split(':')[0];

  // Recursively apply brand name substitution to all i18n message strings
  // so the RSC payload never contains stale brand references (e.g. "Novo CRM" on oikoscrm.com)
  function brandifyMessages(obj: any): any {
    if (typeof obj === 'string') {
      return adjustBranding(obj, brandName);
    }
    if (Array.isArray(obj)) {
      return obj.map(brandifyMessages);
    }
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        result[key] = brandifyMessages(obj[key]);
      }
      return result;
    }
    return obj;
  }

  const messages = brandName === 'Novo CRM' ? rawMessages : brandifyMessages(rawMessages);
  return (
    <html lang={locale} suppressHydrationWarning data-ui-style="spatial">
      <head>
        {brandName === 'Oikos CRM' ? (
          <>
            <script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-563X2HFRBC"
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-563X2HFRBC');
                `
              }}
            />
          </>
        ) : (
          <>
            <script
              async
              src="https://www.googletagmanager.com/gtag/js?id=AW-18295920582"
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'AW-18295920582');
                  gtag('config', 'G-FB3G9V25SP');
                `
              }}
            />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
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
