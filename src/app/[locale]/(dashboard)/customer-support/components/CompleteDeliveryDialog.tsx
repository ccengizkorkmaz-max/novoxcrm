'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ClipboardCheck, FileText } from 'lucide-react'
import { completeDeliveryChecklist } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { jsPDF } from 'jspdf'

interface Appointment {
    id: string
    appointment_date: string
    notes?: string | null
    status: string
    checklist_items?: any
    initial_meter_readings?: any
    units: {
        id: string
        unit_number: string
        projects?: { name: string } | null
    }
    customers: {
        id: string
        full_name: string
        phone?: string | null
    }
}

interface CompleteDeliveryDialogProps {
    appointment: Appointment
}

function clearTurkishChars(str: string): string {
    if (!str) return '';
    return str
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/Ş/g, 'S')
        .replace(/Ğ/g, 'G')
        .replace(/Ö/g, 'O')
        .replace(/Ü/g, 'U')
        .replace(/Ç/g, 'C')
        .replace(/İ/g, 'I');
}

export function CompleteDeliveryDialog({ appointment }: CompleteDeliveryDialogProps) {
    const t = useTranslations('Deliveries')
    const [isOpen, setIsOpen] = useState(false)
    const [status, setStatus] = useState(appointment.status)
    const [notes, setNotes] = useState(appointment.notes || '')
    const [loading, setLoading] = useState(false)

    // Checklist states
    const existingChecklist = appointment.checklist_items || []
    const [keysChecked, setKeysChecked] = useState(existingChecklist.includes('keys'))
    const [manualsChecked, setManualsChecked] = useState(existingChecklist.includes('manuals'))
    const [docsChecked, setDocsChecked] = useState(existingChecklist.includes('documents'))

    // Meter states
    const existingMeters = appointment.initial_meter_readings || {}
    const [waterReading, setWaterReading] = useState(existingMeters.water || '')
    const [elecReading, setElecReading] = useState(existingMeters.electricity || '')
    const [gasReading, setGasReading] = useState(existingMeters.gas || '')

    const handleSave = async () => {
        setLoading(true)
        try {
            const checklist = []
            if (keysChecked) checklist.push('keys')
            if (manualsChecked) checklist.push('manuals')
            if (docsChecked) checklist.push('documents')

            const meters = {
                water: waterReading,
                electricity: elecReading,
                gas: gasReading
            }

            const formData = new FormData()
            formData.append('id', appointment.id)
            formData.append('checklist_items', JSON.stringify(checklist))
            formData.append('initial_meter_readings', JSON.stringify(meters))
            formData.append('notes', notes)
            formData.append('status', status)

            const res = await completeDeliveryChecklist(formData)
            if (res.success) {
                toast.success(t('successComplete'))
                setIsOpen(false)
            } else {
                toast.error(res.error || 'Güncelleme başarısız.')
            }
        } catch (error) {
            toast.error('Bağlantı hatası.')
        } finally {
            setLoading(false)
        }
    }

    const generatePDF = () => {
        const doc = new jsPDF()

        const appName = "NOVO CRM"
        const projectName = appointment.units.projects?.name || 'Proje'
        const unitNumber = appointment.units.unit_number
        const customerName = appointment.customers.full_name
        const dateStr = new Date(appointment.appointment_date).toLocaleDateString('tr-TR')

        // Title Header
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(22)
        doc.setTextColor(30, 41, 59) // slate-800
        doc.text(clearTurkishChars("DAIRE TESLIM VE KABUL PROTOKOLU"), 105, 25, { align: 'center' })

        doc.setLineWidth(0.5)
        doc.setDrawColor(203, 213, 225) // slate-300
        doc.line(15, 32, 195, 32)

        // Metadata Table details
        doc.setFontSize(11)
        doc.setFont('Helvetica', 'bold')
        doc.text(clearTurkishChars("Proje Adi:"), 20, 45)
        doc.setFont('Helvetica', 'normal')
        doc.text(clearTurkishChars(projectName), 55, 45)

        doc.setFont('Helvetica', 'bold')
        doc.text(clearTurkishChars("Daire No:"), 20, 52)
        doc.setFont('Helvetica', 'normal')
        doc.text(clearTurkishChars(unitNumber), 55, 52)

        doc.setFont('Helvetica', 'bold')
        doc.text(clearTurkishChars("Alici (Musteri):"), 20, 59)
        doc.setFont('Helvetica', 'normal')
        doc.text(clearTurkishChars(customerName), 55, 59)

        doc.setFont('Helvetica', 'bold')
        doc.text(clearTurkishChars("Teslim Tarihi:"), 20, 66)
        doc.setFont('Helvetica', 'normal')
        doc.text(dateStr, 55, 66)

        doc.line(15, 75, 195, 75)

        // Checklist Section
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(14)
        doc.text(clearTurkishChars("Teslim Edilen Kalemler (Kontrol Listesi)"), 20, 88)

        doc.setFontSize(11)
        doc.setFont('Helvetica', 'normal')

        let checklistY = 100
        const checkKeys = keysChecked ? "[X]  " : "[  ]  "
        doc.text(clearTurkishChars(checkKeys + "Daire anahtarlari teslim edildi."), 25, checklistY)
        
        checklistY += 8
        const checkManuals = manualsChecked ? "[X]  " : "[  ]  "
        doc.text(clearTurkishChars(checkManuals + "Kullanim kilavuzlari ve garanti belgeleri teslim edildi."), 25, checklistY)

        checklistY += 8
        const checkDocs = docsChecked ? "[X]  " : "[  ]  "
        doc.text(clearTurkishChars(checkDocs + "Tesisat ve abonelik evraklari teslim edildi."), 25, checklistY)

        doc.line(15, 130, 195, 130)

        // Meter Readings Section
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(14)
        doc.text(clearTurkishChars("Ilk Sayac Okuma Degerleri"), 20, 143)

        doc.setFontSize(11)
        doc.setFont('Helvetica', 'bold')
        doc.text(clearTurkishChars("Su Sayaci:"), 25, 155)
        doc.setFont('Helvetica', 'normal')
        doc.text(clearTurkishChars(waterReading || 'Okunamadi / Belirtilmedi'), 65, 155)

        doc.setFont('Helvetica', 'bold')
        doc.text(clearTurkishChars("Elektrik Sayaci:"), 25, 163)
        doc.setFont('Helvetica', 'normal')
        doc.text(clearTurkishChars(elecReading || 'Okunamadi / Belirtilmedi'), 65, 163)

        doc.setFont('Helvetica', 'bold')
        doc.text(clearTurkishChars("Dogalgaz Sayaci:"), 25, 171)
        doc.setFont('Helvetica', 'normal')
        doc.text(clearTurkishChars(gasReading || 'Okunamadi / Belirtilmedi'), 65, 171)

        doc.line(15, 182, 195, 182)

        // Footer terms
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139) // slate-500
        const declaration = "Yukarida detaylari belirtilen bagimsiz bolum eksiksiz, temiz ve kontrol listesindeki ogelerle birlikte teslim alinmistir."
        doc.text(clearTurkishChars(declaration), 20, 193, { maxWidth: 170 })

        // Signatures
        doc.setFontSize(11)
        doc.setTextColor(30, 41, 59)
        doc.setFont('Helvetica', 'bold')
        doc.text(clearTurkishChars("TESLIM EDEN (Firma Yetkilisi)"), 30, 220)
        doc.text(clearTurkishChars("TESLIM ALAN (Musteri)"), 130, 220)

        doc.setFont('Helvetica', 'normal')
        doc.text("Imza / Kashe", 30, 240)
        doc.text("Imza", 130, 240)

        // Logo watermark or branding in corner
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Powered by ${appName}`, 105, 280, { align: 'center' })

        // Save PDF file
        doc.save(`Teslim_Protokolu_${unitNumber}.pdf`)
        toast.success("Teslim protokolü PDF dosyası başarıyla indirildi.")
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                    {t('completeBtn')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{appointment.units.projects?.name} - Daire {appointment.units.unit_number}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Checklist */}
                    <div className="space-y-2 border-b pb-4">
                        <Label className="font-semibold text-sm">{t('checklist')}</Label>
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="keys"
                                    checked={keysChecked}
                                    onCheckedChange={(val) => setKeysChecked(!!val)}
                                />
                                <Label htmlFor="keys" className="text-xs font-normal cursor-pointer">
                                    {t('keys')}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="manuals"
                                    checked={manualsChecked}
                                    onCheckedChange={(val) => setManualsChecked(!!val)}
                                />
                                <Label htmlFor="manuals" className="text-xs font-normal cursor-pointer">
                                    {t('manuals')}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="documents"
                                    checked={docsChecked}
                                    onCheckedChange={(val) => setDocsChecked(!!val)}
                                />
                                <Label htmlFor="documents" className="text-xs font-normal cursor-pointer">
                                    {t('documents')}
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Meter Readings */}
                    <div className="space-y-3 border-b pb-4">
                        <Label className="font-semibold text-sm">{t('meterReadings')}</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="grid gap-1">
                                <Label htmlFor="water" className="text-xs">{t('water')}</Label>
                                <Input
                                    id="water"
                                    value={waterReading}
                                    onChange={(e) => setWaterReading(e.target.value)}
                                    placeholder="m³"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="electricity" className="text-xs">{t('electricity')}</Label>
                                <Input
                                    id="electricity"
                                    value={elecReading}
                                    onChange={(e) => setElecReading(e.target.value)}
                                    placeholder="kWh"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="gas" className="text-xs">{t('gas')}</Label>
                                <Input
                                    id="gas"
                                    value={gasReading}
                                    onChange={(e) => setGasReading(e.target.value)}
                                    placeholder="m³"
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Appointment Status */}
                    <div className="grid gap-2 border-b pb-4">
                        <Label htmlFor="status" className="font-semibold text-sm">{t('status')}</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status" className="h-8 text-xs">
                                <SelectValue placeholder="Durum Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Scheduled">{t('statuses.Scheduled')}</SelectItem>
                                <SelectItem value="Completed">{t('statuses.Completed')}</SelectItem>
                                <SelectItem value="Cancelled">{t('statuses.Cancelled')}</SelectItem>
                                <SelectItem value="No Show">{t('statuses.No Show')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="notes" className="font-semibold text-sm">{t('notes')}</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="İlave teslimat notları..."
                            className="text-xs"
                        />
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between pt-4 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-1.5 h-9 border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={generatePDF}
                    >
                        <FileText className="h-4 w-4" />
                        {t('protocolBtn')}
                    </Button>

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                            Kapat
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={loading}>
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
