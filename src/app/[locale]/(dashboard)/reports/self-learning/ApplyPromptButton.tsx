'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Sparkles } from 'lucide-react'
import { applyImprovedPrompt } from './actions'
import { toast } from 'sonner'

export function ApplyPromptButton({ tenantId, newPrompt }: { tenantId: string; newPrompt: string }) {
    const [applied, setApplied] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleApply = async () => {
        if (!confirm('Bu iyileştirilmiş prompt\'u varsayılan script olarak uygulamak istediğinize emin misiniz?')) return
        setLoading(true)
        const result = await applyImprovedPrompt(tenantId, newPrompt)
        setLoading(false)

        if (result.success) {
            setApplied(true)
            toast.success('Prompt başarıyla güncellendi!')
        } else {
            toast.error(result.error || 'Bir hata oluştu')
        }
    }

    if (applied) {
        return (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Prompt uygulandı!</span>
            </div>
        )
    }

    return (
        <Button
            onClick={handleApply}
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Uygulanıyor...' : 'Bu Prompt\'u Uygula'}
        </Button>
    )
}
