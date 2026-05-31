'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { autoAssignAllSales } from '../actions'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function BulkAutoAssignButton() {
    const [isAssigning, setIsAssigning] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [autoLoop, setAutoLoop] = useState(false)
    const [progress, setProgress] = useState(0)
    const [totalTarget, setTotalTarget] = useState(0)

    const processBatch = async (isAutoLooping: boolean, currentAccumulatedProgress: number): Promise<void> => {
        try {
            const result = await autoAssignAllSales()
            
            if (result.error) {
                toast.error(result.error)
                setIsAssigning(false)
                setIsDialogOpen(false)
                setProgress(0)
                setTotalTarget(0)
                return
            }

            if (result.count !== undefined && result.count > 0) {
                const updatedProgress = currentAccumulatedProgress + result.count
                // Initial target computation
                const currentTotal = updatedProgress + (result.remainingCount! - result.count)
                setProgress(updatedProgress)
                setTotalTarget(currentTotal)

                if (isAutoLooping && result.remainingCount! > result.count) {
                    // Update toast silently if we prefer it, but counter is on the button
                    // Wait a bit to avoid thrashing and then call next batch
                    setTimeout(() => {
                        processBatch(true, updatedProgress)
                    }, 500)
                } else {
                    toast.success(`${updatedProgress} kayıt başarıyla atandı. Tüm kayıtlar işlendi.`, { id: 'bulk-assign' })
                    setIsAssigning(false)
                    setIsDialogOpen(false)
                    setTimeout(() => { setProgress(0); setTotalTarget(0) }, 3000)
                }
            } else {
                toast.success(currentAccumulatedProgress > 0 
                    ? `İşlem tamam! Toplamda ${currentAccumulatedProgress} adet açık kayıt ekiplere dağıtıldı.` 
                    : `Atanacak açık kayıt bulunmuyor.`, 
                    { id: 'bulk-assign' }
                )
                setIsAssigning(false)
                setIsDialogOpen(false)
                setTimeout(() => { setProgress(0); setTotalTarget(0) }, 3000)
            }
        } catch (error: any) {
            toast.error(`Beklenmeyen bir hata oluştu: ${error.message || error}`)
            console.error("Bulk Assign Error:", error)
            setIsAssigning(false)
            setIsDialogOpen(false)
            setProgress(0)
            setTotalTarget(0)
        }
    }

    const handleConfirm = () => {
        if (isAssigning) return
        setIsAssigning(true)
        setProgress(0)
        setTotalTarget(0)
        
        toast.info(autoLoop ? 'Arka arkaya toplu atama başlatıldı, lütfen bekleyin...' : 'Toplu atama başlatıldı, lütfen bekleyin...', { id: 'bulk-assign' })
        processBatch(autoLoop, 0)
    }

    return (
        <>
            <Button 
                onClick={() => setIsDialogOpen(true)} 
                variant="outline" 
                disabled={isAssigning} 
                size="icon"
                className="h-9 w-9 shrink-0 border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm"
                title={isAssigning ? (totalTarget > 0 ? `Atanıyor: ${progress}/${totalTarget}` : 'İşleniyor...') : (progress > 0 ? `Atandı: ${progress}` : 'Otomatik Toplu Atama')}
            >
                {isAssigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="h-4 w-4" />
                )}
            </Button>

            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Toplu Atama İşlemi</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tüm açık (ve atanmamış) satış kayıtları takımların veya satış ekibinin adil yük dağılımına göre atanacaktır. Sistemin zorlanmaması için işlem paketler halinde (50'şer adet) yapılır.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="flex items-center space-x-2 py-4">
                        <Checkbox 
                            id="autoLoop" 
                            checked={autoLoop} 
                            onCheckedChange={(checked) => setAutoLoop(checked as boolean)} 
                            disabled={isAssigning}
                        />
                        <Label htmlFor="autoLoop" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Hiç sorma, tüm atanmamış kayıtlar bitene kadar arka arkaya devam et.
                        </Label>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isAssigning}>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => {
                            e.preventDefault(); // Prevent closing immediately to show loaders
                            handleConfirm();
                        }} disabled={isAssigning}>
                            {isAssigning ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                    İşleniyor...
                                </>
                            ) : (
                                "Evet, Başlat"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
