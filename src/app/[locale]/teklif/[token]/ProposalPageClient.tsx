'use client'

import { useState } from 'react'
import { Download, Phone, Mail, MessageSquare, Building2, MapPin, Calendar, Ruler, Home, CreditCard, AlertTriangle, Shield, Clock } from 'lucide-react'
import type { ProposalData } from '@/app/[locale]/(dashboard)/offers/proposal-actions'

interface ProposalPageClientProps {
    data: ProposalData
    isExpired: boolean
}

// ─── Formatters ──────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'TRY'): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency === 'TL' ? 'TRY' : currency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    }).format(amount)
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

function getPaymentTypeLabel(type: string): string {
    const map: Record<string, string> = {
        'DownPayment': 'Peşinat',
        'Down Payment': 'Peşinat',
        'Installment': 'Taksit',
        'InterimPayment': 'Ara Ödeme',
        'Interim Payment': 'Ara Ödeme',
        'Balloon': 'Ara Ödeme',
        'DeliveryPayment': 'Teslim Ödemesi',
        'Delivery Payment': 'Teslim Ödemesi',
        'Other': 'Diğer'
    }
    return map[type] || type
}

// ─── PDF Download (browser print) ────────────────────────────────────────

function handlePdfDownload() {
    window.print()
}

// ─── Component ───────────────────────────────────────────────────────────

export default function ProposalPageClient({ data, isExpired }: ProposalPageClientProps) {
    const hasDiscount = data.listPrice > data.offerPrice
    const discountPercent = hasDiscount ? Math.round((1 - data.offerPrice / data.listPrice) * 100) : 0

    const totalPlanAmount = data.paymentPlan?.total_amount ||
        data.paymentPlan?.payment_items?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || data.offerPrice

    const installmentCount = data.paymentPlan?.installment_count ||
        data.paymentPlan?.payment_items?.filter(i => i.payment_type === 'Installment').length || 0

    const targetPhone = data.companyWhatsapp || data.consultantPhone
    const whatsappLink = targetPhone
        ? `https://wa.me/${targetPhone.replace(/\D/g, '').replace(/^0/, '90')}?text=${encodeURIComponent(`Merhaba, ${data.offerNumber} numaralı teklif hakkında bilgi almak istiyorum.`)}`
        : null

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-break { page-break-inside: avoid; }
                    .print-page-break-before { 
                        page-break-before: always !important; 
                        break-before: page !important;
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                {/* ── EXPIRED BANNER ── */}
                {isExpired && (
                    <div className="no-print bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
                        <div className="max-w-2xl mx-auto flex items-center gap-3 text-sm font-semibold">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <span>Bu teklifin geçerlilik süresi dolmuştur. Güncel teklif için danışmanınızla iletişime geçiniz.</span>
                        </div>
                    </div>
                )}

                {/* ── HEADER ── */}
                <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTEwIDEwaDQwdjQwSDEweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                        {/* Company & Offer Number */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase">{data.companyName}</h2>
                                <p className="text-slate-400 text-xs font-medium mt-1">Gayrimenkul Teklif Belgesi</p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teklif No</span>
                                <span className="text-base font-black text-blue-400">{data.offerNumber}</span>
                            </div>
                        </div>

                        {/* Customer Name */}
                        <div className="mb-2">
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Sayın</p>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{data.customerName}</h1>
                        </div>

                        {/* Dates */}
                        <div className="flex flex-wrap gap-4 mt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Tarih: {formatDate(data.generatedAt)}</span>
                            </div>
                            {data.validUntil && (
                                <div className={`flex items-center gap-2 text-xs ${isExpired ? 'text-amber-400' : 'text-slate-400'}`}>
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Geçerlilik: {formatDate(data.validUntil)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── CONTENT ── */}
                <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

                    {/* ── PROJECT & UNIT INFO ── */}
                    <section className="print-break bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 sm:px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                                    <Building2 className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{data.projectName}</h3>
                                    {data.projectCity && (
                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                            <MapPin className="h-3 w-3" /> {data.projectCity}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {data.unitBlock && (
                                    <InfoItem label="Blok" value={data.unitBlock} />
                                )}
                                <InfoItem label="Daire No" value={data.unitNumber} icon={<Home className="h-3.5 w-3.5" />} />
                                {data.unitType && (
                                    <InfoItem label="Tip" value={data.unitType} />
                                )}
                                {data.unitFloor !== null && data.unitFloor !== undefined && (
                                    <InfoItem label="Kat" value={String(data.unitFloor)} />
                                )}
                                {data.areaGross && (
                                    <InfoItem label="Brüt Alan" value={`${data.areaGross} m²`} icon={<Ruler className="h-3.5 w-3.5" />} />
                                )}
                                {data.areaNet && (
                                    <InfoItem label="Net Alan" value={`${data.areaNet} m²`} icon={<Ruler className="h-3.5 w-3.5" />} />
                                )}
                                {data.deliveryDate && (
                                    <InfoItem label="Planlanan Teslim" value={formatDate(data.deliveryDate)} icon={<Calendar className="h-3.5 w-3.5" />} />
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ── PRICING ── */}
                    <section className="print-break bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative">
                            {hasDiscount && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Liste Fiyatı</p>
                                        <p className="text-base text-slate-400 line-through">{formatCurrency(data.listPrice, data.listCurrency)}</p>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold w-fit">
                                        %{discountPercent} İndirim
                                    </span>
                                </div>
                            )}

                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    {hasDiscount ? 'Teklif Fiyatı' : 'Fiyat'}
                                </p>
                                <p className="text-3xl sm:text-4xl font-black tracking-tight">
                                    {formatCurrency(data.offerPrice, data.offerCurrency)}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ── DEPOSIT (KAPORA) ── */}
                    {data.deposit && (
                        <section className="print-break bg-amber-50 border border-amber-200/60 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Shield className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Kapora</p>
                                    <p className="text-lg font-black text-amber-800">
                                        {formatCurrency(data.deposit.amount, data.deposit.currency)}
                                        <span className="text-xs font-semibold text-amber-500 ml-2">
                                            {data.deposit.status === 'Paid' ? '✓ Ödendi' :
                                                data.deposit.status === 'Pending' ? '⏳ Bekleniyor' : data.deposit.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── CONSULTANT ── */}
                    <section className="print-break bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Satış Danışmanınız</p>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-200/50">
                                {data.consultantName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-base font-black text-slate-800">{data.consultantName}</h4>
                                <div className="flex flex-wrap gap-3 mt-1.5">
                                    {data.consultantPhone && (
                                        <a href={`tel:${data.consultantPhone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                                            <Phone className="h-3 w-3" /> {data.consultantPhone}
                                        </a>
                                    )}
                                    {data.consultantEmail && (
                                        <a href={`mailto:${data.consultantEmail}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                                            <Mail className="h-3 w-3" /> {data.consultantEmail}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── PAYMENT PLAN ── */}
                    {data.paymentPlan?.payment_items && data.paymentPlan.payment_items.length > 0 && (
                        <section className="print-page-break-before bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 sm:px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                                            <CreditCard className="h-4 w-4 text-white" />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Ödeme Planı</h3>
                                    </div>
                                    {installmentCount > 0 && (
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                            {installmentCount} Taksit
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {data.paymentPlan.payment_items.map((item, idx) => (
                                    <div key={idx} className="px-5 sm:px-6 py-2 print:py-1.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="h-6 w-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{getPaymentTypeLabel(item.payment_type)}</p>
                                                <p className="text-xs text-slate-400">{formatDate(item.due_date)}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-800">{formatCurrency(item.amount, data.offerCurrency)}</p>
                                    </div>
                                ))}

                                {/* Total row */}
                                <div className="px-5 sm:px-6 py-2.5 print:py-2 bg-slate-900 text-white flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Toplam</p>
                                    <p className="text-lg font-black">{formatCurrency(totalPlanAmount, data.offerCurrency)}</p>
                                </div>

                                {data.paymentPlan.interest_amount && data.paymentPlan.interest_amount > 0 && (
                                    <div className="px-5 sm:px-6 py-2.5 bg-blue-50 flex items-center justify-between">
                                        <p className="text-xs font-semibold text-blue-600">Vade Farkı</p>
                                        <p className="text-xs font-bold text-blue-700">+{formatCurrency(data.paymentPlan.interest_amount, data.offerCurrency)}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ── ACTION BUTTONS (Mobile-friendly, hidden in print) ── */}
                    <div className="no-print flex flex-col sm:flex-row gap-3 pt-2 pb-8">
                        {whatsappLink && (
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <button className="w-full h-12 sm:h-11 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-200/60 active:scale-[0.98] transition-all">
                                    <MessageSquare className="h-4.5 w-4.5" />
                                    WhatsApp ile İletişim
                                </button>
                            </a>
                        )}

                        {data.consultantPhone && (
                            <a href={`tel:${data.consultantPhone}`} className="flex-1">
                                <button className="w-full h-12 sm:h-11 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 active:scale-[0.98] transition-all">
                                    <Phone className="h-4.5 w-4.5" />
                                    Hemen Ara
                                </button>
                            </a>
                        )}

                        <button
                            onClick={handlePdfDownload}
                            className="flex-1 h-12 sm:h-11 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2.5 hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98] transition-all"
                        >
                            <Download className="h-4 w-4" />
                            PDF Olarak İndir
                        </button>
                    </div>
                </main>

                {/* ── FOOTER ── */}
                <footer className="border-t border-slate-100 bg-white/50 py-6">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
                        <p className="text-[10px] text-slate-400 font-medium">
                            Bu teklif belgesi {data.companyName} tarafından otomatik olarak oluşturulmuştur.
                            {data.validUntil && !isExpired && (
                                <> Geçerlilik tarihi: <strong>{formatDate(data.validUntil)}</strong></>
                            )}
                        </p>
                    </div>
                </footer>
            </div>
        </>
    )
}

// ─── Info Item Sub-component ─────────────────────────────────────────────

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                {icon}
                {label}
            </span>
            <span className="text-sm font-bold text-slate-800">{value}</span>
        </div>
    )
}
