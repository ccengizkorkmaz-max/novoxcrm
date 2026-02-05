'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import * as XLSX from 'xlsx'

import { toast } from 'sonner'

interface UnitExportButtonProps {
    units: any[]
    projectName: string
}

export function UnitExportButton({ units, projectName }: UnitExportButtonProps) {
    const handleExport = () => {
        if (!units || units.length === 0) {
            toast.info('Dışa aktarılacak ünite bulunamadı. Şablon indiriliyor.')
        }
        // Prepare data for export
        const exportData = (units || []).map(unit => ({
            'Ünite No': unit.unit_number || '',
            'Ünite Türü': unit.unit_category || '',
            'Oda Tipi': unit.type || '',
            'Durum': unit.status === 'For Sale' ? 'Satılık' :
                unit.status === 'Reserved' ? 'Rezerve' :
                    unit.status === 'Sold' ? 'Satıldı' : unit.status,
            'Fiyat': unit.price || 0,
            'Para Birimi': unit.currency || 'TRY',
            'Brüt m²': unit.area_gross || 0,
            'Net m²': unit.area_net || 0,
            'Kat': unit.floor || '',
            'Blok': unit.block || '',
            'Balkon m²': unit.balcony_area || 0,
            'Teras m²': unit.terrace_area || 0,
            'Bahçe m²': unit.garden_area || 0,
            'Oda Sayısı': unit.rooms || 0,
            'Banyo Sayısı': unit.bathrooms || 0,
            'Yatak Odası': unit.bedrooms || 0,
            'Otopark': unit.parking || 0,
            'Depo': unit.storage || 0,
            'Cephe': unit.facade_direction || '',
            'Manzara': unit.view || '',
        }))

        // Define headers for template (especially important when data is empty)
        const headers = [
            'Ünite No', 'Ünite Türü', 'Oda Tipi', 'Durum', 'Fiyat', 'Para Birimi',
            'Brüt m²', 'Net m²', 'Kat', 'Blok', 'Balkon m²', 'Teras m²', 'Bahçe m²',
            'Oda Sayısı', 'Banyo Sayısı', 'Yatak Odası', 'Otopark', 'Depo', 'Cephe', 'Manzara'
        ];

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData, { header: headers })

        // Set column widths
        const colWidths = [
            { wch: 12 }, // Ünite No
            { wch: 15 }, // Ünite Türü
            { wch: 12 }, // Oda Tipi
            { wch: 12 }, // Durum
            { wch: 15 }, // Fiyat
            { wch: 12 }, // Para Birimi
            { wch: 10 }, // Brüt m²
            { wch: 10 }, // Net m²
            { wch: 8 },  // Kat
            { wch: 8 },  // Blok
            { wch: 10 }, // Balkon
            { wch: 10 }, // Teras
            { wch: 10 }, // Bahçe
            { wch: 10 }, // Oda Sayısı
            { wch: 12 }, // Banyo
            { wch: 12 }, // Yatak Odası
            { wch: 10 }, // Otopark
            { wch: 10 }, // Depo
            { wch: 12 }, // Cephe
            { wch: 15 }, // Manzara
        ]
        ws['!cols'] = colWidths

        // Create workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Üniteler')

        // Generate filename with date
        const date = new Date().toISOString().split('T')[0]
        const filename = `${projectName}_Uniteler_${date}.xlsx`

        // Download file
        XLSX.writeFile(wb, filename)
    }

    return (
        <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Excel'e Aktar
        </Button>
    )
}
