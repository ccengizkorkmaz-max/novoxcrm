'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Check, ExternalLink, Globe, Users, Briefcase, FileText, Calculator, ShieldCheck, Headphones } from 'lucide-react'
import { useState } from 'react'

interface ExternalLink {
    name: string
    path: string
    description: string
    icon: React.ReactNode
    category: 'portal' | 'marketing' | 'legal'
    isPublic: boolean
}

const EXTERNAL_LINKS: ExternalLink[] = [
    // ── Portaller ──
    {
        name: 'Broker Portal — Giriş',
        path: '/tr/broker/login',
        description: 'Dış broker\'ların sisteme giriş yaptığı sayfa.',
        icon: <Briefcase className="h-4 w-4 text-purple-500" />,
        category: 'portal',
        isPublic: true
    },
    {
        name: 'Broker Portal — Dashboard',
        path: '/tr/broker',
        description: 'Broker\'ın lead, komisyon, proje ve paylaşım araçlarını gördüğü ana panel.',
        icon: <Briefcase className="h-4 w-4 text-purple-500" />,
        category: 'portal',
        isPublic: false
    },
    {
        name: 'Broker Başvuru Formu',
        path: '/tr/broker/apply',
        description: 'Yeni dış broker\'ların sisteme başvuru yaptığı herkese açık form.',
        icon: <Users className="h-4 w-4 text-blue-500" />,
        category: 'portal',
        isPublic: true
    },
    {
        name: 'Broker Profil Sayfası',
        path: '/p/{broker-slug}',
        description: 'Her broker\'ın müşterilerine paylaştığı kişisel profil ve iletişim formu sayfası.',
        icon: <Users className="h-4 w-4 text-blue-500" />,
        category: 'portal',
        isPublic: true
    },
    {
        name: 'Müşteri Hizmetleri — Giriş',
        path: '/tr/customerservices/login',
        description: 'Müşterilerin sözleşme, ödeme ve destek bilgilerine eriştiği portal girişi.',
        icon: <Headphones className="h-4 w-4 text-emerald-500" />,
        category: 'portal',
        isPublic: true
    },
    {
        name: 'Müşteri Hizmetleri — Dashboard',
        path: '/tr/customerservices',
        description: 'Müşteri portalı: Finansal durum, belgeler, destek talepleri ve teslimat takibi.',
        icon: <Headphones className="h-4 w-4 text-emerald-500" />,
        category: 'portal',
        isPublic: false
    },
    // ── Marketing ──
    {
        name: 'Ana Sayfa (Landing Page)',
        path: '/tr',
        description: 'NovoxCRM ürün tanıtım ve pazarlama ana sayfası.',
        icon: <Globe className="h-4 w-4 text-sky-500" />,
        category: 'marketing',
        isPublic: true
    },
    {
        name: 'Çözümler',
        path: '/tr/solutions',
        description: 'Sektörel çözüm ve kullanım senaryoları sayfası.',
        icon: <Globe className="h-4 w-4 text-sky-500" />,
        category: 'marketing',
        isPublic: true
    },
    {
        name: 'Ödeme Planı Hesaplayıcı',
        path: '/tr/payment-plan-calculator',
        description: 'Herkese açık taksit / ödeme planı hesaplama aracı.',
        icon: <Calculator className="h-4 w-4 text-amber-500" />,
        category: 'marketing',
        isPublic: true
    },
    {
        name: 'Sektör Raporları',
        path: '/tr/industry-reports',
        description: 'AI destekli sektör analizi ve raporları.',
        icon: <FileText className="h-4 w-4 text-indigo-500" />,
        category: 'marketing',
        isPublic: true
    },
    {
        name: 'Bilgi Bankası (Wiki)',
        path: '/tr/wiki',
        description: 'Gayrimenkul sektörüne yönelik bilgi bankası makaleleri.',
        icon: <FileText className="h-4 w-4 text-indigo-500" />,
        category: 'marketing',
        isPublic: true
    },
    // ── Legal ──
    {
        name: 'Gizlilik Sözleşmesi',
        path: '/tr/gizlilik-sozlesmesi',
        description: 'KVKK ve gizlilik politikası.',
        icon: <ShieldCheck className="h-4 w-4 text-slate-500" />,
        category: 'legal',
        isPublic: true
    },
    {
        name: 'Mesafeli Satış Sözleşmesi',
        path: '/tr/mesafeli-satis-sozlesmesi',
        description: 'Mesafeli satış sözleşme koşulları.',
        icon: <ShieldCheck className="h-4 w-4 text-slate-500" />,
        category: 'legal',
        isPublic: true
    },
    {
        name: 'Teslimat ve İade Şartları',
        path: '/tr/teslimat-ve-iade-sartlari',
        description: 'Teslimat ve iade politikası.',
        icon: <ShieldCheck className="h-4 w-4 text-slate-500" />,
        category: 'legal',
        isPublic: true
    }
]

const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
    portal: { label: 'Portal', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    marketing: { label: 'Pazarlama', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    legal: { label: 'Hukuki', color: 'bg-slate-100 text-slate-600 border-slate-200' }
}

export default function ExternalLinksTab() {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const domain = 'https://www.novoxcrm.com'

    const copyUrl = (path: string, id: string) => {
        const fullUrl = path.startsWith('http') ? path : `${domain}${path}`
        navigator.clipboard.writeText(fullUrl)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const grouped = EXTERNAL_LINKS.reduce((acc, link) => {
        if (!acc[link.category]) acc[link.category] = []
        acc[link.category].push(link)
        return acc
    }, {} as Record<string, ExternalLink[]>)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-sky-500" />
                    Dış Sayfalar & Portallar
                </CardTitle>
                <CardDescription>
                    Uygulamanın dışarıya açık tüm sayfaları, portalleri ve herkese açık linkleri.
                    URL'leri tıklayarak kopyalayabilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    {Object.entries(grouped).map(([category, links]) => {
                        const catInfo = CATEGORY_INFO[category]
                        return (
                            <div key={category}>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Badge variant="outline" className={`text-[10px] font-bold ${catInfo.color}`}>
                                        {catInfo.label}
                                    </Badge>
                                    <div className="h-px flex-1 bg-border" />
                                </div>
                                <div className="grid gap-2">
                                    {links.map((link, i) => {
                                        const fullUrl = link.path.startsWith('http') ? link.path : `${domain}${link.path}`
                                        const linkId = `${category}-${i}`
                                        return (
                                            <div
                                                key={linkId}
                                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                                            >
                                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 shrink-0">
                                                    {link.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">{link.name}</span>
                                                        {link.isPublic ? (
                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">Herkese Açık</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">Giriş Gerekli</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                                                    <code className="text-[10px] text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded mt-1 inline-block font-mono">
                                                        {fullUrl}
                                                    </code>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => copyUrl(link.path, linkId)}
                                                    >
                                                        {copiedId === linkId
                                                            ? <Check className="h-3.5 w-3.5 text-green-600" />
                                                            : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                        }
                                                    </Button>
                                                    <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
