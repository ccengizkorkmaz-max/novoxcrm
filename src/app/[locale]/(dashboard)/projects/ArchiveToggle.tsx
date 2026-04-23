'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Archive } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ArchiveToggleProps {
    archivedCount: number
}

export function ArchiveToggle({ archivedCount }: ArchiveToggleProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations('Projects.archive')
    const showArchived = searchParams.get('showArchived') === 'true'

    const toggleArchived = () => {
        const params = new URLSearchParams(searchParams.toString())
        if (showArchived) {
            params.delete('showArchived')
        } else {
            params.set('showArchived', 'true')
        }
        router.push(`?${params.toString()}`)
    }

    if (archivedCount === 0) return null

    return (
        <Button
            variant={showArchived ? 'secondary' : 'outline'}
            size="sm"
            onClick={toggleArchived}
            className="gap-2 text-xs"
        >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? t('hideArchived') : t('showArchived')}
            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {archivedCount}
            </span>
        </Button>
    )
}
