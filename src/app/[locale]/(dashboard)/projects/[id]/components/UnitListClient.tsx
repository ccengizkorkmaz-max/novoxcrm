'use client'

import { useState, useTransition } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { bulkUpdateUnitStatus, bulkDeleteUnits } from '../actions'
import { toast } from 'sonner'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UnitListClientProps {
    units: any[]
    projectId: string
    unitProgress: any[]
    constructionStages: any[]
    handleDeleteUnit: (unitId: string) => Promise<void>
    isAdmin?: boolean
}

export function UnitListClient({ units, projectId, unitProgress, constructionStages, handleDeleteUnit, isAdmin = false }: UnitListClientProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === units.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(units.map(u => u.id))
        }
    }

    const handleBulkStatusUpdate = (status: string) => {
        if (selectedIds.length === 0) return

        startTransition(async () => {
            const result = await bulkUpdateUnitStatus(projectId, selectedIds, status)
            if (result.success) {
                toast.success('Birim durumları güncellendi')
                setSelectedIds([])
            } else {
                toast.error(result.error)
            }
        })
    }

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return

        startTransition(async () => {
            const result = await bulkDeleteUnits(projectId, selectedIds)
            if (result.success) {
                toast.success(`${selectedIds.length} ünite silindi`)
                setSelectedIds([])
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-medium ml-2">
                        {selectedIds.length} ünite seçildi
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleBulkStatusUpdate('For Sale')}
                            disabled={isPending}
                        >
                            Satılık Yap
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleBulkStatusUpdate('Sold')}
                            disabled={isPending}
                        >
                            Satıldı Yap
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleBulkStatusUpdate('Reserved')}
                            disabled={isPending}
                        >
                            Rezerve Yap
                        </Button>
                        {isAdmin && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Seçili Olanları Sil
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Seçili Üniteleri Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Bu işlem geri alınamaz. Seçilen <strong>{selectedIds.length}</strong> adet ünite kalıcı olarak silinecektir.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleBulkDelete}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Evet, Sil
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedIds([])}
                            disabled={isPending}
                        >
                            Seçimi Temizle
                        </Button>
                    </div>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox
                                checked={selectedIds.length === units.length && units.length > 0}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Tümünü seç"
                            />
                        </TableHead>
                        <TableHead className="w-[100px]">Ünite No</TableHead>
                        <TableHead className="w-[120px]">Ünite Türü</TableHead>
                        <TableHead className="w-[120px]">Oda Tipi</TableHead>
                        <TableHead className="w-[100px]">Durum</TableHead>
                        <TableHead className="w-[150px]">Fiyat</TableHead>
                        <TableHead className="w-[100px]">Brüt m²</TableHead>
                        <TableHead className="w-[80px]">Kat</TableHead>
                        <TableHead className="w-[80px]">Blok</TableHead>
                        <TableHead className="w-[100px]">İnşaat</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {units && units.length > 0 ? (
                        units.map((unit: any) => (
                            <TableRow key={unit.id} className={selectedIds.includes(unit.id) ? 'bg-muted/30' : ''}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.includes(unit.id)}
                                        onCheckedChange={() => toggleSelect(unit.id)}
                                        aria-label={`${unit.unit_number} seç`}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{unit.unit_number}</TableCell>
                                <TableCell>{unit.unit_category || '-'}</TableCell>
                                <TableCell>{unit.type}</TableCell>
                                <TableCell>
                                    <Badge variant={unit.status === 'For Sale' ? 'default' : unit.status === 'Sold' ? 'destructive' : 'secondary'}>
                                        {unit.status === 'For Sale' ? 'Satılık' :
                                            unit.status === 'Reserved' ? 'Rezerve' :
                                                unit.status === 'Sold' ? 'Satıldı' : unit.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {unit.price ? `${unit.price.toLocaleString('tr-TR')} ${unit.currency || 'TRY'}` : '-'}
                                </TableCell>
                                <TableCell>{unit.area_gross ? `${unit.area_gross} m²` : '-'}</TableCell>
                                <TableCell>{unit.floor || '-'}</TableCell>
                                <TableCell>{unit.block || '-'}</TableCell>
                                <TableCell>
                                    {(() => {
                                        const progresses = unitProgress?.filter(p => p.unit_id === unit.id) || []
                                        if (constructionStages && constructionStages.length > 0) {
                                            let totalWeight = constructionStages.reduce((acc: number, s: any) => acc + (s.weight || 0), 0)
                                            if (totalWeight === 0) return '-'
                                            let weightedProgress = 0
                                            constructionStages.forEach(stage => {
                                                const p = progresses.find(prog => prog.stage_id === stage.id)
                                                weightedProgress += ((p?.completion_percentage || 0) * (stage.weight || 0)) / totalWeight
                                            })
                                            const result = Math.round(weightedProgress)
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${result}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-medium">%{result}</span>
                                                </div>
                                            )
                                        }
                                        return '-'
                                    })()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/inventory/${unit.id}`}>
                                            <Button size="sm" variant="outline">Detay</Button>
                                        </Link>
                                        {isAdmin && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Üniteyi Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bu işlem geri alınamaz. <strong>{unit.unit_number}</strong> numaralı ünite kalıcı olarak silinecektir.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteUnit(unit.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Evet, Sil
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={11} className="text-center h-24 text-muted-foreground">
                                Henüz ünite eklenmemiş. Yukarıdaki butonları kullanarak ünite ekleyebilirsiniz.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
