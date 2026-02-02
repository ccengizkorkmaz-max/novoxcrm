'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';
import { useParams } from 'next/navigation';

export default function LanguageSwitcher() {
    const t = useTranslations('LanguageSwitcher');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();

    function onLanguageChange(newLocale: string) {
        // @ts-ignore
        router.replace(pathname, { locale: newLocale });
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onLanguageChange('tr')}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${locale === 'tr'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                TR
            </button>
            <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${locale === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                EN
            </button>
        </div>
    );
}
