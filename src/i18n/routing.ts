import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'tr'],

    // Used when no locale matches
    defaultLocale: 'tr',

    // Use a prefix for all routes except the default locale
    localePrefix: 'as-needed',

    // Disable automatic locale detection from browser headers
    localeDetection: false,

    // Localized pathnames for dynamic SEO URL structure
    pathnames: {
        '/': '/',
        '/cozum': {
            tr: '/cozum',
            en: '/solutions'
        },
        '/cozum/[slug]': {
            tr: '/cozum/[slug]',
            en: '/solutions/[slug]'
        },
        '/cozum/insaat-crm': {
            tr: '/cozum/insaat-crm',
            en: '/solutions/insaat-crm'
        },
        '/cozum/gayrimenkul-crm': {
            tr: '/cozum/gayrimenkul-crm',
            en: '/solutions/gayrimenkul-crm'
        },
        '/payment-plan-calculator': {
            tr: '/araclar/odeme-plani-hesaplayici',
            en: '/tools/payment-plan-calculator'
        },
        '/system-details': {
            tr: '/guvenlik-ve-altyapi',
            en: '/security-and-infrastructure'
        },
        '/broker/apply': {
            tr: '/broker/basvuru',
            en: '/broker/apply'
        }
    }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing as any);
