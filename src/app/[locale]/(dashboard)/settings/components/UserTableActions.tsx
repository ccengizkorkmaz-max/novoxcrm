'use client'

import { useState, useEffect } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2, ArrowRightLeft } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import EditUserForm from './EditUserForm'
import { deleteUser, getLeadCountForUser } from '../actions'
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
} from "@/components/ui/alert-dialog"
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'

interface UserTableActionsProps {
    user: {
        id: string
        full_name: string | null
        role: string
        email: string | null
        is_external?: boolean
        phone?: string | null
    }
    allUsers: {
        id: string
        full_name: string | null
        email: string | null
        role: string
    }[]
}

export default function UserTableActions({ user, allUsers }: UserTableActionsProps) {
    const t = useTranslations('Settings')
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [transferToUserId, setTransferToUserId] = useState<string>('')
    const [leadCount, setLeadCount] = useState<number | null>(null)
    const [loadingLeadCount, setLoadingLeadCount] = useState(false)

    // Other users who can receive transferred leads (exclude current user being deleted)
    const transferCandidates = allUsers.filter(u => u.id !== user.id)

    // Load lead count when delete dialog opens
    useEffect(() => {
        if (isDeleteOpen) {
            setLoadingLeadCount(true)
            getLeadCountForUser(user.id).then(count => {
                setLeadCount(count)
                setLoadingLeadCount(false)
            }).catch(() => {
                setLeadCount(0)
                setLoadingLeadCount(false)
            })
        } else {
            setLeadCount(null)
            setTransferToUserId('')
        }
    }, [isDeleteOpen, user.id])

    const handleDelete = async () => {
        // If there are leads and no transfer target selected, warn
        if (leadCount && leadCount > 0 && !transferToUserId) {
            toast.error('Lütfen lead\'lerin aktarılacağı bir kullanıcı seçin.')
            return
        }

        setIsPending(true)
        const res = await deleteUser(user.id, transferToUserId || undefined)
        setIsPending(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            const transferName = transferToUserId
                ? transferCandidates.find(u => u.id === transferToUserId)?.full_name
                : null

            // Build a detailed report message
            const report = (res as any)?.report as { table: string; count: number; action: string }[] | undefined
            if (report && report.length > 0) {
                const transferred = report.filter(r => r.action === 'transfer')
                const deleted = report.filter(r => r.action === 'delete')
                const totalTransferred = transferred.reduce((s, r) => s + r.count, 0)
                const totalDeleted = deleted.reduce((s, r) => s + r.count, 0)

                const lines = transferred.map(r => `• ${r.table}: ${r.count} kayıt${transferName ? ` → ${transferName}` : ''}`)
                if (totalDeleted > 0) lines.push(`• ${totalDeleted} kayıt silindi`)

                toast.success(`✅ ${user.full_name} başarıyla silindi`, {
                    description: `${totalTransferred + totalDeleted} kayıt işlendi:\n${lines.join('\n')}`,
                    duration: 8000,
                })
            } else {
                toast.success(`${user.full_name} başarıyla silindi.`)
            }
            setIsDeleteOpen(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t('users.actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsDeleteOpen(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('users.actions.delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('users.forms.editTitle')}</DialogTitle>
                    </DialogHeader>
                    <EditUserForm user={user} onClose={() => setIsEditOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* Delete Dialog — with lead transfer */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Kullanıcı Sil
                        </DialogTitle>
                        <DialogDescription>
                            <b>{user.full_name || user.email}</b> kullanıcısını silmek üzeresiniz. Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Lead count info */}
                        {loadingLeadCount ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                Lead sayısı kontrol ediliyor...
                            </div>
                        ) : leadCount !== null && leadCount > 0 ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <ArrowRightLeft className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm font-medium text-amber-800">
                                        Bu kullanıcıya atanmış <Badge variant="secondary" className="mx-1">{leadCount}</Badge> lead bulunuyor
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-amber-900">
                                        Lead&apos;leri kime aktarmak istiyorsunuz?
                                    </Label>
                                    <Select value={transferToUserId} onValueChange={setTransferToUserId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Kullanıcı seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {transferCandidates.map(u => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.full_name || u.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : leadCount !== null && leadCount === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Bu kullanıcıya atanmış lead bulunmuyor.
                            </p>
                        ) : null}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isPending}
                        >
                            İptal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isPending || (leadCount !== null && leadCount > 0 && !transferToUserId)}
                        >
                            {isPending ? 'Siliniyor...' : 'Kullanıcıyı Sil'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
