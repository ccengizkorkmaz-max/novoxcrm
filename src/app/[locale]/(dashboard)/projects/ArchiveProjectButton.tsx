'use client'

import { useState } from 'react'
import { Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/alert-dialog'
import { archiveProject, restoreProject } from './actions'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'

interface ArchiveProjectButtonProps {
    projectId: string
    projectName: string
    isArchived: boolean
}

export function ArchiveProjectButton({ projectId, projectName, isArchived }: ArchiveProjectButtonProps) {
    const [loading, setLoading] = useState(false)
    const t = useTranslations('Projects.archive')

    const handleAction = async () => {
        setLoading(true)
        try {
            const result = isArchived
                ? await restoreProject(projectId)
                : await archiveProject(projectId)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(isArchived ? t('restoreSuccess') : t('success'))
            }
        } catch {
            toast.error(t('error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                        isArchived
                            ? 'hover:bg-emerald-100 hover:text-emerald-700'
                            : 'hover:bg-amber-100 hover:text-amber-700'
                    }`}
                    title={isArchived ? t('restore') : t('button')}
                    disabled={loading}
                >
                    {isArchived ? (
                        <ArchiveRestore className="h-4 w-4" />
                    ) : (
                        <Archive className="h-4 w-4" />
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isArchived ? t('restoreConfirmTitle') : t('confirmTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span className="font-semibold text-foreground block">{projectName}</span>
                        <span className="block">
                            {isArchived ? t('restoreConfirmDesc') : t('confirmDesc')}
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleAction}
                        disabled={loading}
                        className={isArchived
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }
                    >
                        {loading
                            ? '...'
                            : isArchived ? t('restoreConfirmAction') : t('confirmAction')
                        }
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
