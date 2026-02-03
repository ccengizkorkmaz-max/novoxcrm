'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';
import { useParams } from 'next/navigation';

interface LanguageSwitcherProps {
    variant?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'dark' }: LanguageSwitcherProps) {
    const t = useTranslations('LanguageSwitcher');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    function onLanguageChange(newLocale: string) {
        // @ts-ignore
        router.replace(pathname, { locale: newLocale });
    }

    const baseClasses = "px-2 py-1 text-xs font-bold rounded transition-colors";
    const activeClasses = "bg-blue-600 text-white";
    const inactiveClasses = variant === 'light'
        ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        : "text-slate-400 hover:text-white hover:bg-white/5";

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onLanguageChange('tr')}
                className={`${baseClasses} ${locale === 'tr' ? activeClasses : inactiveClasses}`}
            >
                TR
            </button>
            <button
                onClick={() => onLanguageChange('en')}
                className={`${baseClasses} ${locale === 'en' ? activeClasses : inactiveClasses}`}
            >
                EN
            </button>
        </div>
    );
}
