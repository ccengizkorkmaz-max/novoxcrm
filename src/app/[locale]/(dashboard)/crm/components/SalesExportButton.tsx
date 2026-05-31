'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { getSalesForExport } from '../export-actions'
import { formatCurrency } from '@/lib/utils'

interface SalesExportButtonProps {
    filters: {
        project?: string
        rep?: string
        status?: string
        search?: string
        customer?: string
        dateFrom?: string
        dateTo?: string
    }
}

export default function SalesExportButton({ filters }: SalesExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            toast.info('Veriler dışa aktarılıyor, lütfen bekleyin...')

            const { data, error } = await getSalesForExport(filters)

            if (error) {
                toast.error('Dışa aktarma sırasında bir hata oluştu: ' + error)
                return
            }

            if (!data || data.length === 0) {
                toast.warning('Dışa aktarılacak veri bulunamadı.')
                return
            }

            // Prepare data for Excel
            const exportData = data.map(sale => ({
                'Müşteri Adı': sale.customers?.full_name || '',
                'Müşteri Telefon': sale.customers?.phone || '',
                'Müşteri E-posta': sale.customers?.email || '',
                'Durum': sale.status === 'Lead' ? 'Aday (Lead)' : 
                         sale.status === 'Prospect' ? 'Potansiyel (Prospect)' : 
                         sale.status === 'Reservation' ? 'Rezervasyon' : 
                         sale.status === 'Proposal' ? 'Teklif' : 
                         sale.status === 'Negotiation' ? 'Görüşme (Pazarlık)' : 
                         sale.status === 'Sold' ? 'Satıldı' : 
                         sale.status === 'Completed' ? 'Tamamlandı' : 
                         sale.status === 'Lost' ? 'Kaybedildi' : sale.status,
                'Proje': sale.projects?.name || '',
                'Ünite No': sale.units?.unit_number || '',
                'Satış Fiyatı': sale.final_price || sale.units?.price || 0,
                'Para Birimi': sale.currency || sale.units?.currency || 'TRY',
                'Satış Temsilcisi': sale.profiles?.full_name || '',
                'Oluşturulma Tarihi': new Date(sale.created_at).toLocaleDateString('tr-TR'),
                'Son Güncelleme': sale.updated_at ? new Date(sale.updated_at).toLocaleDateString('tr-TR') : ''
            }))

            const headers = [
                'Müşteri Adı', 'Müşteri Telefon', 'Müşteri E-posta', 'Durum',
                'Proje', 'Ünite No', 'Satış Fiyatı', 'Para Birimi',
                'Satış Temsilcisi', 'Oluşturulma Tarihi', 'Son Güncelleme'
            ]

            const ws = XLSX.utils.json_to_sheet(exportData, { header: headers })

            const colWidths = [
                { wch: 25 }, // Müşteri Adı
                { wch: 15 }, // Telefon
                { wch: 25 }, // E-posta
                { wch: 20 }, // Durum
                { wch: 20 }, // Proje
                { wch: 12 }, // Ünite No
                { wch: 15 }, // Fiyat
                { wch: 12 }, // Para Birimi
                { wch: 20 }, // Temsilci
                { wch: 15 }, // Oluşturulma
                { wch: 15 }, // Son Güncelleme
            ]
            ws['!cols'] = colWidths

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Satışlar')

            const dateStr = new Date().toISOString().split('T')[0]
            XLSX.writeFile(wb, `Satis_Yonetimi_${dateStr}.xlsx`)
            
            toast.success('Dışa aktarma işlemi tamamlandı.')

        } catch (err: any) {
            console.error(err)
            toast.error('Beklenmeyen bir hata oluştu.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button 
            onClick={handleExport} 
            variant="outline" 
            disabled={isExporting}
            size="icon"
            className="h-9 w-9 shrink-0 text-slate-600 border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
            title="Excel'e Aktar"
        >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        </Button>
    )
}
