'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function MetaAutomationError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('MetaAutomation page error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
            <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <div className="text-center space-y-2 max-w-md">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    Meta Otomasyon Raporu Yüklenemedi
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Rapor verilerini çekerken bir hata oluştu. Lütfen sayfayı yeniden yüklemeyi deneyin.
                </p>
                {error?.message && (
                    <p className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/20 p-2 rounded-lg mt-2 break-all">
                        {error.message}
                    </p>
                )}
            </div>
            <Button
                onClick={reset}
                variant="outline"
                className="h-10 px-6 gap-2 font-bold text-sm"
            >
                <RefreshCw className="h-4 w-4" />
                Tekrar Dene
            </Button>
        </div>
    )
}
