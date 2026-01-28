import { Footer } from '@/components/marketing/Footer'
import { Navbar } from '@/components/marketing/Navbar'

export const metadata: Metadata = {
    title: {
        default: 'NovoxCRM - İnşaat ve Gayrimenkul Proje Satış Yazılımı',
        template: '%s | NovoxCRM'
    },
    description: 'Orta ölçekli inşaat firmaları için Proje Satış CRM\'i. Satış ofisi, broker yönetimi ve ödeme planı takibini tek platformda birleştirin.',
    keywords: ['gayrimenkul crm', 'inşaat crm', 'proje satış crm', 'konut satış crm', 'real estate crm turkey', 'broker yönetim sistemi'],
    openGraph: {
        type: 'website',
        locale: 'tr_TR',
        url: 'https://novoxcrm.com',
        title: 'NovoxCRM - Konut Satışlarını Hızlandırın',
        description: 'Excel karmaşasına son verin. Satış, pazarlama ve broker yönetimini dijitalleştirin.',
        siteName: 'NovoxCRM',
    }
}

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans antialiased text-foreground">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    )
}
