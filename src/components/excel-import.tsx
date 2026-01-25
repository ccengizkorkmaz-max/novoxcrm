'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface ExcelImportProps {
    projectId: string
    onImport: (formData: FormData) => Promise<any>
}

export function ExcelImport({ projectId, onImport }: ExcelImportProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.append('project_id', projectId)

        try {
            const result = await onImport(formData)

            setLoading(false)

            if (result?.success) {
                alert(`${result.count || 0} ünite başarıyla içe aktarıldı!`)
                setOpen(false)
                setSelectedFile(null)
                    ; (e.target as HTMLFormElement).reset()
                window.location.reload()
            } else {
                alert(result?.error || 'İçe aktarma başarısız. Lütfen dosya formatını kontrol edin.')
            }
        } catch (error) {
            setLoading(false)
            console.error('Import error:', error)
            alert('Bir hata oluştu. Lütfen konsolu kontrol edin.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Excel'den İçe Aktar">
                    <FileSpreadsheet className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Excel'den Ünite İçe Aktar</DialogTitle>
                    <DialogDescription>
                        Excel dosyasından toplu ünite yükleyin. Dosya şu kolonları içermelidir:
                        <br />
                        <code className="text-xs bg-muted px-1 py-0.5 rounded block mt-2 w-fit">unit_number, type, status, price, area_gross, floor, block</code>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Excel Dosyası (.xlsx, .csv)</Label>
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                required
                                className="cursor-pointer"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            {selectedFile && (
                                <p className="text-xs text-muted-foreground">
                                    Seçili: {selectedFile.name}
                                </p>
                            )}
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                            <p className="font-semibold mb-1">Örnek Format:</p>
                            <pre className="text-xs whitespace-pre">
                                unit_number | type | status    | price  | area_gross | floor | block{'\n'}
                                A-101       | 2+1  | For Sale  | 500000 | 120        | 1     | A{'\n'}
                                A-102       | 3+1  | For Sale  | 750000 | 150        | 1     | A
                            </pre>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            İçe Aktar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
