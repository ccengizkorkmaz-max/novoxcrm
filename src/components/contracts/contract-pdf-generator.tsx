'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Printer, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'

interface ContractPDFGeneratorProps {
    contract: {
        id: string
        contract_number: string
        contract_date: string
        status: string
        amount: number
        final_amount: number
        total_amount: number
        currency: string
        notes?: string
        discount_percentage?: number
        vat_rate?: number
        customers?: any[]
        unit?: any
        payments?: any[]
    }
    tenantName?: string
}

const paymentTypeLabels: Record<string, string> = {
    'DownPayment': 'Peşinat',
    'Installment': 'Taksit',
    'Balloon': 'Ara Ödeme',
    'DeliveryPayment': 'Teslim Ödemesi',
    'Other': 'Diğer'
}

export function ContractPDFGenerator({ contract, tenantName }: ContractPDFGeneratorProps) {
    const [generating, setGenerating] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(generatePrintHTML())
        printWindow.document.close()
        printWindow.focus()

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print()
            }, 500)
        }
    }

    const handleDownloadPDF = async () => {
        setGenerating(true)
        try {
            const printWindow = window.open('', '_blank')
            if (!printWindow) return

            printWindow.document.write(generatePrintHTML())
            printWindow.document.close()
            printWindow.focus()

            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print()
                    setGenerating(false)
                }, 500)
            }
        } catch {
            setGenerating(false)
        }
    }

    const primaryCustomer = contract.customers?.find((c: any) => c.role === 'Primary')?.customer
    const sortedPayments = contract.payments?.sort(
        (a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    ) || []

    const generatePrintHTML = () => {
        const contractDate = contract.contract_date
            ? format(new Date(contract.contract_date), 'd MMMM yyyy', { locale: tr })
            : 'Belirtilmemiş'

        const paymentRows = sortedPayments.map((p: any, i: number) => `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${i + 1}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${paymentTypeLabels[p.payment_type] || p.payment_type}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    ${p.due_date ? format(new Date(p.due_date), 'dd.MM.yyyy') : '-'}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">
                    ${formatCurrency(p.amount, p.currency || contract.currency)}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    ${p.status === 'Paid' ? '✅ Ödendi' : p.status === 'Overdue' ? '⚠️ Gecikmiş' : '⏳ Bekliyor'}
                </td>
            </tr>
        `).join('')

        const customerRows = contract.customers?.map((c: any) => `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${c.customer?.full_name || '-'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${c.customer?.phone || '-'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${c.customer?.email || '-'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${c.role === 'Primary' ? 'Ana Alıcı' : 'Ortak Alıcı'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${c.share_percentage ? `%${c.share_percentage}` : '%100'}</td>
            </tr>
        `).join('') || ''

        return `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Sözleşme - ${contract.contract_number}</title>
                <style>
                    @page { margin: 20mm 15mm; size: A4; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.6; background: white; }
                    .contract-container { max-width: 210mm; margin: 0 auto; }
                    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 20px; }
                    .company-name { font-size: 22pt; font-weight: 800; color: #1e40af; }
                    .contract-title { text-align: center; font-size: 16pt; font-weight: 700; margin: 24px 0; padding: 12px; background: #f1f5f9; border-radius: 8px; text-transform: uppercase; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-size: 11pt; font-weight: 700; color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
                    thead { background: #1e40af; color: white; }
                    thead th { padding: 10px 12px; text-align: left; }
                    .financial-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
                    .fin-item { text-align: center; }
                    .fin-value { font-size: 14pt; font-weight: 800; color: #1e40af; }
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
                    .signature-box { text-align: center; padding-top: 60px; border-top: 2px solid #1e293b; }
                    .signed-stamp { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60pt; font-weight: 900; color: rgba(22, 163, 74, 0.08); pointer-events: none; z-index: -1; }
                </style>
            </head>
            <body>
                <div class="contract-container">
                    ${contract.status === 'Signed' ? '<div class="signed-stamp">İMZALANDI</div>' : ''}
                    <div class="header">
                        <div>
                            <div class="company-name">${tenantName || 'Novo CRM'}</div>
                            <div style="color: #64748b">Gayrimenkul Satış Sözleşmesi</div>
                        </div>
                        <div style="text-align: right">
                            <div style="font-size: 14pt; font-weight: bold">${contract.contract_number}</div>
                            <div style="color: #64748b">${contractDate}</div>
                        </div>
                    </div>
                    <div class="contract-title">GAYRİMENKUL SATIŞ SÖZLEŞMESİ</div>
                    <div class="section">
                        <div class="section-title">MADDE 1 – TARAFLAR</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Ad Soyad / Ünvan</th>
                                    <th>Telefon</th>
                                    <th>E-posta</th>
                                    <th>Rol</th>
                                    <th style="text-align: center;">Pay</th>
                                </tr>
                            </thead>
                            <tbody>${customerRows}</tbody>
                        </table>
                    </div>
                    <div class="section">
                        <div class="section-title">MADDE 2 – GAYRİMENKUL BİLGİLERİ</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div><strong>Proje:</strong> ${contract.unit?.projects?.name || '-'}</div>
                            <div><strong>Blok / Ünite:</strong> ${contract.unit?.block || '-'} / ${contract.unit?.unit_number || '-'}</div>
                            <div><strong>Kat:</strong> ${contract.unit?.floor ?? '-'}. Kat</div>
                            <div><strong>Tip:</strong> ${contract.unit?.type || '-'}</div>
                        </div>
                    </div>
                    <div class="section">
                        <div class="section-title">MADDE 3 – SATIŞ BEDELİ</div>
                        <div class="financial-summary">
                            <div class="fin-item">
                                <div style="font-size: 9pt; color: #64748b">Bedel</div>
                                <div class="fin-value">${formatCurrency(contract.amount, contract.currency)}</div>
                            </div>
                            <div class="fin-item">
                                <div style="font-size: 9pt; color: #64748b">İndirim</div>
                                <div class="fin-value">${contract.discount_percentage ? '%' + contract.discount_percentage : '-'}</div>
                            </div>
                            <div class="fin-item">
                                <div style="font-size: 9pt; color: #64748b">Toplam</div>
                                <div class="fin-value" style="color: #16a34a">${formatCurrency(contract.total_amount, contract.currency)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="section">
                        <div class="section-title">MADDE 4 – ÖDEME PLANI</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tür</th>
                                    <th>Vade</th>
                                    <th style="text-align: right">Tutar</th>
                                    <th style="text-align: center">Durum</th>
                                </tr>
                            </thead>
                            <tbody>${paymentRows}</tbody>
                        </table>
                    </div>
                    <div class="signatures">
                        <div class="signature-box"><strong>SATICI</strong><br/>${tenantName || ''}</div>
                        <div class="signature-box"><strong>ALICI</strong><br/>${primaryCustomer?.full_name || ''}</div>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Yazdır
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleDownloadPDF} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                PDF İndir
            </Button>
        </div>
    )
}
