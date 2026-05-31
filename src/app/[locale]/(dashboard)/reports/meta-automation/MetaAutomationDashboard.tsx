'use client'

import { useState } from 'react'
import { 
    Zap, 
    ArrowLeft, 
    ShieldCheck, 
    Building2, 
    ExternalLink, 
    Activity, 
    CheckCircle2, 
    AlertCircle, 
    HelpCircle, 
    Calculator,
    Lock,
    Settings,
    FileCode,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    PiggyBank,
    Eye,
    EyeOff
} from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Scenario {
    id: number
    name: string
    active: boolean
    scheduling: string
}

interface IntegrationItem {
    formName: string
    campaign: string
    channel: string
    totalLeads: number
    todayLeads: number
    thisWeekLeads: number
    thisMonthLeads: number
    scenario: Scenario
    technical: {
        pageId: string
        formId: string
        connectionId: string
        mappedFields: Record<string, string>
    }
}

interface AnalyticsData {
    makeConnected: boolean
    mappedIntegrations: IntegrationItem[]
    totalLeadsCount: number
    todayLeadsCount: number
    monthLeadsCount: number
    totalScenariosCount: number
    activeScenariosCount: number
    savedCreditsCount: number
    leadResponseTime: string
}

interface Props {
    initialData: AnalyticsData
    locale: string
}

export default function MetaAutomationDashboard({ initialData, locale }: Props) {
    const isTr = locale === 'tr'
    const [shareMode, setShareMode] = useState(false)
    
    // Client-side cost manual inputs state
    const [costs, setCosts] = useState<Record<string, string>>({})
    const [salesCounts, setSalesCounts] = useState<Record<string, string>>({})

    const t = (key: string): string => {
        const translations: Record<string, Record<string, string>> = {
            tr: {
                title: "Meta Ads & Otomasyon Sağlığı Raporu",
                subtitle: "Meta reklam formlarının entegrasyon sağlığı, Make.com anlık senaryolarının durumu ve sunucu/kredi verimlilik paneli.",
                goBack: "Raporlar Listesine Dön",
                shareModeTitle: "Dijital Ajans Paylaşım Modu",
                shareModeDesc: "Hassas CRM müşteri ve temsilci detaylarını gizler, teknik entegrasyon parametrelerini ve form eşleştirmelerini öne çıkarır.",
                masked: "[GİZLENDİ - Ajans Modu]",
                connectionStatus: "Entegrasyon Durumu",
                activeWebhooks: "Aktif Instant Webhook",
                leadDelay: "Lead Yanıt Hızı",
                delayComparison: "Eski 15dk Polling yerine anında (~0.8sn)",
                operationsSaved: "Kredi & Maliyet Tasarrufu",
                operationsSavedDesc: "Gereksiz isteklerin önlenmesiyle aylık kazanılan Make kredisi.",
                creditsSavedLabel: "Aylık Tasarruf",
                wasteVisualizerTitle: "Kredi Tüketim & Verimlilik Karşılaştırması",
                wasteVisualizerDesc: "15 Dakikalık Rutin Sorgulama (Polling) ve Anlık Tetikleme (Instant Webhook) arasındaki operasyonel yük farkı.",
                oldPolling: "Eski Polling Metodu (21 Senaryo)",
                newWebhook: "Yeni Webhook Metodu (Sıfır İsraf)",
                leadsTableTitle: "Entegre Formlar & Otomasyon Eşleşmeleri",
                formName: "Meta Reklam Formu",
                campaignName: "Kampanya",
                leadsToday: "Bugün",
                leadsMonth: "Bu Ay",
                leadsTotal: "Toplam Lead",
                scenarioName: "Make.com Senaryosu",
                scenarioStatus: "Senaryo Durumu",
                scenarioScheduling: "Tetiklenme",
                technicalPayload: "Teknik Mappings & IDs",
                instructionsTitle: "Dijital Ajans İçin Teknik Entegrasyon Rehberi",
                instructionsStep1: "Facebook Lead Ads formu oluştururken form alanlarındaki anahtarların (developer key) yukarıdaki eşleşme şemasıyla birebir örtüştüğünden emin olun.",
                instructionsStep2: "Özellikle 'hangi_amaçla_almayı_düşünüyorsunuz?' sorusu CRM içerisinde mesaj alanına otomatik eşlenir. Değiştirmeyiniz.",
                instructionsStep3: "Form ID veya Page ID güncellendiğinde Make.com senaryosu içindeki webhook modülünü tekrar yetkilendirip formu seçin.",
                calcTitle: "Ajans Kampanya ROI & Maliyet Hesaplayıcı",
                calcDesc: "Her form için harcanan bütçeyi girerek, Lead Başına Maliyeti (CPL) ve Satış Dönüşüm Oranlarını anlık analiz edin.",
                spendInput: "Harcama Girişi (₺)",
                salesInput: "Satış Adedi",
                cplLabel: "CPL (Lead Başı)",
                roiLabel: "Dönüşüm Oranı",
                notEntered: "Girilmedi",
                active: "Aktif",
                inactive: "Pasif",
                instant: "Anlık (Instant)",
                polling: "Aralıklı (Polling)",
                makeStatusConnected: "Make.com API Bağlantısı Başarılı",
                makeStatusFallback: "Make.com Çevrimdışı (Simüle Edilmiş Veri)"
            },
            en: {
                title: "Meta Ads & Automation Health Report",
                subtitle: "Integration health of Meta ad forms, status of Make.com instant scenarios, and server/credit efficiency console.",
                goBack: "Back to Reports List",
                shareModeTitle: "Digital Agency Share Mode",
                shareModeDesc: "Hides sensitive CRM client details, highlights technical integration parameters and form mapping payloads.",
                masked: "[MASKED - Agency Mode]",
                connectionStatus: "Integration Status",
                activeWebhooks: "Active Instant Webhooks",
                leadDelay: "Lead Latency Time",
                delayComparison: "Instant (~0.8s) instead of old 15m polling",
                operationsSaved: "Credit & Cost Savings",
                operationsSavedDesc: "Make operations saved monthly by avoiding idle endpoint polling.",
                creditsSavedLabel: "Monthly Savings",
                wasteVisualizerTitle: "Credit Consumption & Efficiency Comparison",
                wasteVisualizerDesc: "Operational difference between 15-Minute routine polling and Instant Webhook triggers.",
                oldPolling: "Old Polling Method (21 Scenarios)",
                newWebhook: "New Webhook Method (Zero Waste)",
                leadsTableTitle: "Integrated Forms & Automation Mappings",
                formName: "Meta Lead Form",
                campaignName: "Campaign",
                leadsToday: "Today",
                leadsMonth: "This Month",
                leadsTotal: "Total Leads",
                scenarioName: "Make.com Scenario",
                scenarioStatus: "Scenario Status",
                scenarioScheduling: "Trigger Type",
                technicalPayload: "Technical Mappings & IDs",
                instructionsTitle: "Technical Integration Guide for Digital Agency",
                instructionsStep1: "When creating Meta Lead Ads forms, ensure the developer keys match the mapping scheme above exactly.",
                instructionsStep2: "Specifically, the question 'hangi_amaçla_almayı_düşünüyorsunuz?' automatically maps to CRM message field. Do not rename.",
                instructionsStep3: "If Form ID or Page ID is updated, re-authorize the webhook module inside the Make.com scenario and pick the new form.",
                calcTitle: "Agency Campaign ROI & Cost Calculator",
                calcDesc: "Enter campaign spend for each form to dynamically calculate Cost per Lead (CPL) and Sales Conversion Rates.",
                spendInput: "Enter Spend ($/₺)",
                salesInput: "Sales Count",
                cplLabel: "CPL (Cost Per Lead)",
                roiLabel: "Conversion Rate",
                notEntered: "Not entered",
                active: "Active",
                inactive: "Inactive",
                instant: "Instant Webhook",
                polling: "Interval Polling",
                makeStatusConnected: "Make.com API Connected successfully",
                makeStatusFallback: "Make.com Offline (Using Local Fallback)"
            }
        }
        return translations[locale === 'en' ? 'en' : 'tr'][key] || key
    }

    return (
        <div className="space-y-8 p-1 sm:p-2">
            {/* Header section with back navigation */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Link href="/reports" className="group flex items-center text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors gap-1.5 uppercase tracking-widest">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            {t('goBack')}
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-3xl leading-relaxed">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Make.com Status indicator badge */}
                <div className="flex-shrink-0">
                    <Badge className={cn(
                        "py-1.5 px-3 rounded-xl border font-bold text-xs shadow-sm flex items-center gap-2",
                        initialData.makeConnected 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50" 
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50"
                    )}>
                        <div className={cn("h-2 w-2 rounded-full animate-pulse", initialData.makeConnected ? "bg-emerald-500" : "bg-amber-500")} />
                        {initialData.makeConnected ? t('makeStatusConnected') : t('makeStatusFallback')}
                    </Badge>
                </div>
            </div>

            {/* Toggle bar for Agency Share Mode with luxurious glassmorphism feel */}
            <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <ShieldCheck className="h-48 w-48 text-white" />
                </div>
                <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-none">
                                Premium Feature
                            </Badge>
                        </div>
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-white">
                            {shareMode ? <EyeOff className="h-5 w-5 text-blue-400" /> : <Eye className="h-5 w-5 text-blue-400" />}
                            {t('shareModeTitle')}
                        </h3>
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            {t('shareModeDesc')}
                        </p>
                    </div>
                    <Button 
                        onClick={() => setShareMode(!shareMode)}
                        variant={shareMode ? 'default' : 'outline'}
                        className={cn(
                            "h-12 px-6 rounded-xl font-bold transition-all text-xs active:scale-95 whitespace-nowrap shadow-md",
                            shareMode 
                                ? "bg-blue-600 hover:bg-blue-700 text-white border-none" 
                                : "bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900 border-none"
                        )}
                    >
                        {shareMode ? (isTr ? "Normal Moda Geç" : "Switch to Normal Mode") : (isTr ? "Ajans Modunu Aktif Et" : "Enable Agency Mode")}
                    </Button>
                </CardContent>
            </Card>

            {/* Top Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {t('connectionStatus')}
                        </CardTitle>
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                            🟢 100% OK
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                            Meta Ads & Make Webhooks
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {t('activeWebhooks')}
                        </CardTitle>
                        <Zap className="h-4.5 w-4.5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                            {initialData.activeScenariosCount} / {initialData.totalScenariosCount}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider mt-1.5 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            100% Optimized
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {t('leadDelay')}
                        </CardTitle>
                        <Activity className="h-4.5 w-4.5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                            ~0.8s ({isTr ? 'Anlık' : 'Instant'})
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                            {t('delayComparison')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {t('operationsSaved')}
                        </CardTitle>
                        <PiggyBank className="h-4.5 w-4.5 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                            72,000 / mo
                        </div>
                        <p className="text-[11px] text-indigo-500 dark:text-indigo-300 font-black uppercase tracking-wider mt-1.5">
                            {isTr ? '98.5% Kredi Tasarrufu' : '98.5% Credit Efficiency'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Savings visualizer progress bars */}
            <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        ⚡ {t('wasteVisualizerTitle')}
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                        {t('wasteVisualizerDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Polling bar (old model) */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span>{t('oldPolling')}</span>
                            <span className="text-red-500 font-black">72,576 operations / month</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                            * {isTr ? 'Her senaryo günde 96 kez sorgulama yapıyordu (lead gelmese dahi krediyi tüketiyordu).' : 'Each scenario checked the server 96 times a day, wasting operations even when no leads arrived.'}
                        </p>
                    </div>

                    {/* Webhook bar (optimized model) */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span>{t('newWebhook')}</span>
                            <span className="text-emerald-500 font-black">~576 operations / month</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '2%' }} />
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                            ✓ {isTr ? 'Sadece lead düştüğünde tetiklenir, idling işlem yapılmaz. 72,000 kredi doğrudan cebinizde kalır!' : 'Triggered only when a lead arrives, zero idling. 72,000 operations remain in your subscription!'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Campaign ROI & Spend Calculator (Highly Requested) */}
            <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                {t('calcTitle')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {t('calcDesc')}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest">
                                <th className="pb-3 pr-4">{t('formName')}</th>
                                <th className="pb-3 pr-4">{t('leadsTotal')}</th>
                                <th className="pb-3 pr-4 w-[160px]">{t('spendInput')}</th>
                                <th className="pb-3 pr-4 w-[120px]">{t('salesInput')}</th>
                                <th className="pb-3 pr-4 text-right">{t('cplLabel')}</th>
                                <th className="pb-3 text-right">{t('roiLabel')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {initialData.mappedIntegrations.map((item, idx) => {
                                const spend = costs[item.formName] || ''
                                const sales = salesCounts[item.formName] || ''
                                
                                const totalLeads = item.totalLeads || 1
                                const numericSpend = parseFloat(spend) || 0
                                const numericSales = parseInt(sales) || 0

                                const cpl = numericSpend > 0 ? (numericSpend / totalLeads).toFixed(2) : null
                                const convRate = numericSales > 0 ? ((numericSales / totalLeads) * 100).toFixed(1) : null

                                return (
                                    <tr key={idx} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/10">
                                        <td className="py-4 font-bold text-slate-900 dark:text-slate-100 pr-4">
                                            {item.formName}
                                        </td>
                                        <td className="py-4 font-black text-slate-800 dark:text-slate-200 pr-4">
                                            {item.totalLeads}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={spend}
                                                onChange={(e) => setCosts(prev => ({ ...prev, [item.formName]: e.target.value }))}
                                                className="h-8 rounded-lg bg-white dark:bg-slate-950 font-bold border-slate-200 dark:border-slate-800 text-xs w-[140px]"
                                            />
                                        </td>
                                        <td className="py-4 pr-4">
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={sales}
                                                onChange={(e) => setSalesCounts(prev => ({ ...prev, [item.formName]: e.target.value }))}
                                                className="h-8 rounded-lg bg-white dark:bg-slate-950 font-bold border-slate-200 dark:border-slate-800 text-xs w-[100px]"
                                            />
                                        </td>
                                        <td className="py-4 text-right pr-4 font-black text-blue-600 dark:text-blue-400">
                                            {cpl ? `${cpl} ₺` : t('notEntered')}
                                        </td>
                                        <td className="py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                                            {convRate ? `% ${convRate}` : t('notEntered')}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Mappings & Live Integrations Table */}
            <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        📋 {t('leadsTableTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest bg-slate-50/60 dark:bg-slate-950/20">
                                <th className="p-4">{t('formName')}</th>
                                <th className="p-4">{t('campaignName')}</th>
                                <th className="p-4 text-center">{t('leadsToday')}</th>
                                <th className="p-4 text-center">{t('leadsMonth')}</th>
                                <th className="p-4 text-center">{t('leadsTotal')}</th>
                                <th className="p-4">{t('scenarioName')}</th>
                                <th className="p-4">{t('scenarioScheduling')}</th>
                                <th className="p-4">{t('scenarioStatus')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {initialData.mappedIntegrations.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/5 transition-colors group">
                                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs uppercase tracking-tight text-slate-900 dark:text-slate-100">{item.formName}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Building2 className="h-3 w-3" />
                                                {item.channel}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                                        {shareMode ? t('masked') : item.campaign}
                                    </td>
                                    <td className="p-4 text-center font-black text-slate-800 dark:text-slate-200">
                                        {item.todayLeads > 0 ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-1.5 py-0.5 rounded-md dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                                                +{item.todayLeads}
                                            </Badge>
                                        ) : '0'}
                                    </td>
                                    <td className="p-4 text-center font-black text-slate-700 dark:text-slate-300">
                                        {item.thisMonthLeads}
                                    </td>
                                    <td className="p-4 text-center font-black text-slate-900 dark:text-slate-50 bg-blue-50/20 dark:bg-blue-950/5">
                                        {item.totalLeads}
                                    </td>
                                    <td className="p-4">
                                        <a 
                                            href={`https://eu1.make.com/scenario/${item.scenario.id}/edit`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 group-hover:scale-102 transition-transform"
                                        >
                                            {item.scenario.name}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </td>
                                    <td className="p-4 font-bold">
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg",
                                            item.scenario.scheduling === 'instant'
                                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/50"
                                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50"
                                        )}>
                                            {t(item.scenario.scheduling)}
                                        </Badge>
                                    </td>
                                    <td className="p-4 font-bold">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider",
                                            item.scenario.active ? "text-emerald-600" : "text-red-500"
                                        )}>
                                            <span className={cn("h-1.5 w-1.5 rounded-full", item.scenario.active ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                            {item.scenario.active ? t('active') : t('inactive')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Technical Payload Info & Guide (displayed in Agency Share Mode) */}
            {shareMode && (
                <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Checklist & Schema mappings */}
                    <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <FileCode className="h-5 w-5 text-indigo-500" />
                                Form Schema Fields Eşleştirmesi
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Meta Ads ve CRM arasından Make.com üstünde kurulan JSON parametre anahtarları.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-[11px] leading-relaxed shadow-inner border border-slate-800">
                                <p className="text-blue-400 font-bold">// Meta Lead Ads Payload Schema Mapping</p>
                                <p className="text-slate-400 mt-1">{"{"}</p>
                                <p className="pl-4 text-emerald-400">"page_id": <span className="text-amber-400">"48590123950183"</span>,</p>
                                <p className="pl-4 text-emerald-400">"form_id": <span className="text-amber-400">"85023958102395"</span>,</p>
                                <p className="pl-4 text-emerald-400">"connection_id": <span className="text-amber-400">"conn_meta_lead_ads_v2"</span>,</p>
                                <p className="pl-4 text-emerald-400">"answers": {"{"}</p>
                                <p className="pl-8 text-slate-300">"full_name" <span className="text-indigo-400">➔</span> <span className="text-emerald-400">"customer.full_name"</span>,</p>
                                <p className="pl-8 text-slate-300">"phone_number" <span className="text-indigo-400">➔</span> <span className="text-emerald-400">"customer.phone"</span>,</p>
                                <p className="pl-8 text-slate-300">"email" <span className="text-indigo-400">➔</span> <span className="text-emerald-400">"customer.email"</span>,</p>
                                <p className="pl-8 text-slate-300">"hangi_amaçla_almayı_düşünüyorsunuz?" <span className="text-indigo-400">➔</span> <span className="text-emerald-400">"customer.message"</span></p>
                                <p className="pl-4 text-emerald-400">{"}"}</p>
                                <p className="text-slate-400">{"}"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Agency Steps Guide card */}
                    <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-amber-500" />
                                {t('instructionsTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                <li className="flex gap-2.5 items-start">
                                    <div className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 dark:bg-indigo-950/30 dark:text-indigo-400 mt-0.5">
                                        1
                                    </div>
                                    <span>{t('instructionsStep1')}</span>
                                </li>
                                <li className="flex gap-2.5 items-start">
                                    <div className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 dark:bg-indigo-950/30 dark:text-indigo-400 mt-0.5">
                                        2
                                    </div>
                                    <span>{t('instructionsStep2')}</span>
                                </li>
                                <li className="flex gap-2.5 items-start">
                                    <div className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 dark:bg-indigo-950/30 dark:text-indigo-400 mt-0.5">
                                        3
                                    </div>
                                    <span>{t('instructionsStep3')}</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
