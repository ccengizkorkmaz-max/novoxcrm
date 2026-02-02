import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from 'sonner';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://novoxcrm.com'),
  title: "NovoxCRM | İnşaat & Gayrimenkul CRM – Konut Projeleri için Satış Yönetimi",
  description: "NovoxCRM, inşaat ve gayrimenkul firmaları için özel geliştirilmiş CRM yazılımıdır. Konut projeleri, stok takibi, broker yönetimi ve satış süreçlerini tek platformda yönetin.",
  alternates: {
    canonical: '/',
    languages: {
      'tr': '/tr',
      'en': '/en',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NovoxCRM",
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
};

export const viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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


  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
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
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
