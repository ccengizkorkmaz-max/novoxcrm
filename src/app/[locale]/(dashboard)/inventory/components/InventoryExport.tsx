'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { getInventoryExportData } from '../actions'

interface InventoryExportProps {
    projects: { id: string; name: string }[]
}

export function InventoryExport({ projects }: InventoryExportProps) {
    const [open, setOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<string>('all')
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            const data = await getInventoryExportData(
                selectedProject !== 'all' ? selectedProject : undefined
            )

            if (!data || data.length === 0) {
                toast.error('Dışa aktarılacak veri bulunamadı.')
                setLoading(false)
                return
            }

            // Dynamic import xlsx
            const XLSX = (await import('xlsx')).default

            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Envanter')

            // Auto-size columns
            const colWidths = Object.keys(data[0]).map(key => ({
                wch: Math.max(key.length, ...data.map((row: any) => (row[key]?.toString() || '').length)) + 2
            }))
            ws['!cols'] = colWidths

            const projectName = selectedProject !== 'all'
                ? projects.find(p => p.id === selectedProject)?.name || 'envanter'
                : 'tum_envanter'

            const fileName = `${projectName}_stok_listesi_${new Date().toISOString().split('T')[0]}.xlsx`
            XLSX.writeFile(wb, fileName)

            toast.success(`${data.length} ünite dışa aktarıldı.`)
            setOpen(false)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Dışa aktarma başarısız.')
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Excel Çıktı
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        Stok Listesi Dışa Aktar
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Proje Seçimi</label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Proje seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Projeler</SelectItem>
                                {projects.map(project => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                        <p className="font-semibold mb-1">Dışa aktarılacak alanlar:</p>
                        <p>Proje, Blok, Ünite No, Durum, Tip, Kategori, Kat, Yön, Manzara, Brüt/Net Alan, Fiyat, Otopark, Isıtma, Mutfak, Ankastre, Ebeveyn Banyosu, Ada, Parsel</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                    <Button onClick={handleExport} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? 'Hazırlanıyor...' : 'Excel İndir'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
