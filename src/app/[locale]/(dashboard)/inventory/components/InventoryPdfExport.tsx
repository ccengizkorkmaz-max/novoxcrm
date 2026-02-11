'use client'

import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface InventoryPdfExportProps {
    units: any[]
    projectName?: string
}

export function InventoryPdfExport({ units, projectName = 'Genel Envanter' }: InventoryPdfExportProps) {
    const [loading, setLoading] = useState(false)
    const t = useTranslations('Inventory')

    const formatCurrencyPdf = (amount: number, currency: string = 'TRY') => {
        const formatted = new Intl.NumberFormat('tr-TR', {
            style: 'decimal',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
        }).format(amount)

        // Use text currency symbols instead of unicode symbols for better PDF compatibility
        const symbols: Record<string, string> = {
            'TRY': ' TL',
            'USD': ' $',
            'EUR': ' €',
            'GBP': ' £'
        }
        return `${formatted}${symbols[currency] || ' ' + currency}`
    }

    const generatePdf = async () => {
        if (units.length === 0) return
        setLoading(true)

        try {
            const doc = new jsPDF()
            const now = new Date().toLocaleDateString('tr-TR')

            // Header Section
            doc.setFillColor(2, 6, 23) // Slate-950 (Brand Color)
            doc.rect(0, 0, 210, 40, 'F')

            doc.setTextColor(255, 255, 255)
            doc.setFontSize(22)
            doc.setFont('helvetica', 'bold')
            doc.text('NOVOX CRM', 14, 22)

            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            // Using standard Latin-safe characters for brand stability in PDF
            doc.text('GAYRIMENKUL PROJE YONETIM SISTEMI', 14, 30)

            doc.setFontSize(10)
            doc.text(`Tarih: ${now}`, 175, 22)

            // Project Info
            doc.setTextColor(2, 6, 23)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text(`Envanter Raporu: ${projectName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`, 14, 50)

            // Table
            const tableData = units.map(u => [
                u.block || '-',
                u.unit_number,
                u.type,
                u.floor?.toString() || '-',
                u.area_gross ? `${u.area_gross} m2` : '-',
                u.status === 'For Sale' ? 'Satista' : u.status === 'Sold' ? 'Satildi' : u.status,
                formatCurrencyPdf(u.price, u.currency)
            ])

            autoTable(doc, {
                startY: 55,
                head: [['Blok', 'No', 'Tip', 'Kat', 'Alan', 'Durum', 'Fiyat']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 14, right: 14 }
            })

            // Footer
            const pageCount = (doc.internal as any).getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(7)
                doc.setTextColor(150)
                // Distinct positions for page info and brand disclaimer
                doc.text(`Sayfa ${i} / ${pageCount}`, 105, 285, { align: 'center' })
                doc.text('Bu rapor NovoxCRM uzerinden otomatik olarak olusturulmustur.', 14, 290)
            }

            doc.save(`Novox_Envanter_${projectName.replace(/\s/g, '_')}_${now}.pdf`)
        } catch (error) {
            console.error('PDF Generation Error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={generatePdf}
            disabled={loading || units.length === 0}
            className="h-8 text-[11px] gap-1.5 border-blue-200 hover:bg-blue-50 text-blue-700"
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
            PDF Katalog
        </Button>
    )
}
