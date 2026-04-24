'use client'

import { useEffect, useState } from 'react'

const SLOGANS = {
    tr: [
        { line1: 'Satış Ofisiniz Artık', line2: '7/24 Çalışıyor.' },
        { line1: 'Rakipleriniz Uyurken', line2: 'Siz Satıyorsunuz.' },
        { line1: 'Her Müşteri Fırsatı', line2: 'Yakalanıyor.' },
        { line1: 'Daha Az Ekiple', line2: 'Daha Fazla Satış.' },
        { line1: 'Satış Gücünüzü', line2: 'İkiye Katlayın.' },
    ],
    en: [
        { line1: 'Your Sales Office', line2: 'Never Closes.' },
        { line1: 'While Competitors Sleep,', line2: 'You Keep Selling.' },
        { line1: 'Every Lead', line2: 'Gets Captured.' },
        { line1: 'Fewer People,', line2: 'More Sales.' },
        { line1: 'Double Your', line2: 'Sales Power.' },
    ],
}

interface AnimatedHeroHeadlineProps {
    locale?: string
}

export function AnimatedHeroHeadline({ locale = 'tr' }: AnimatedHeroHeadlineProps) {
    const slogans = locale === 'en' ? SLOGANS.en : SLOGANS.tr
    const [index, setIndex] = useState(0)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false)
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % slogans.length)
                setVisible(true)
            }, 450)
        }, 3200)

        return () => clearInterval(interval)
    }, [slogans.length])

    const style = {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(14px)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
    }

    return (
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-8 leading-[1.1]">
            <span className="inline-block" style={style}>
                {slogans[index].line1}
            </span>
            <br className="hidden md:block" />
            <span
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]"
                style={style}
            >
                {slogans[index].line2}
            </span>
        </h1>
    )
}
