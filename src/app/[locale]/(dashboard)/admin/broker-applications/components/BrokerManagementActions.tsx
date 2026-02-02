'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, ShieldAlert, ShieldCheck, UserCog, Award, KeyRound } from 'lucide-react'
import { toggleBrokerStatus, updateBrokerLevelManual, adminSetBrokerPassword } from '@/app/broker/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface BrokerManagementActionsProps {
    brokerId: string
    currentLevelId?: string
    isActive: boolean
    levels: any[]
}

export default function BrokerManagementActions({
    brokerId,
    currentLevelId,
    isActive,
    levels
}: BrokerManagementActionsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false)
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [selectedLevel, setSelectedLevel] = useState(currentLevelId || '')
    const [newPassword, setNewPassword] = useState('')
    const router = useRouter()
    const t = useTranslations('BrokerApplications')

    const handleToggleStatus = async () => {
        setIsLoading(true)
        try {
            const result = await toggleBrokerStatus(brokerId, !isActive)
            if (result.success) {
                toast.success(isActive ? t('actions.statusFeedback.deactivated') : t('actions.statusFeedback.activated'))
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error(t('actions.errorGeneral'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleLevelUpdate = async () => {
        setIsLoading(true)
        try {
            const result = await updateBrokerLevelManual(brokerId, selectedLevel)
            if (result.success) {
                toast.success(t('actions.levelFeedback'))
                setIsLevelDialogOpen(false)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error(t('actions.errorGeneral'))
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordReset = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error(t('actions.passwordMinLength'))
            return
        }

        setIsLoading(true)
        try {
            const result = await adminSetBrokerPassword(brokerId, newPassword)
            if (result.success) {
                toast.success(t('actions.passwordFeedback'))
                setIsPasswordDialogOpen(false)
                setNewPassword('')
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error(t('actions.errorGeneral'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('actions.openMenu')}</span>
                        < MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('actions.menuTitle')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsLevelDialogOpen(true)}>
                        <Award className="mr-2 h-4 w-4" />
                        {t('actions.changeLevel')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        {t('actions.setPassword')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleStatus} className={isActive ? 'text-red-600' : 'text-green-600'}>
                        {isActive ? (
                            <>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                {t('actions.deactivate')}
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                {t('actions.activate')}
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isLevelDialogOpen} onOpenChange={setIsLevelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialogs.level.title')}</DialogTitle>
                        <DialogDescription>
                            {t('dialogs.level.desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('dialogs.level.placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {levels.map((level) => (
                                    <SelectItem key={level.id} value={level.id}>
                                        {level.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLevelDialogOpen(false)}>{t('actions.cancel')}</Button>
                        <Button onClick={handleLevelUpdate} disabled={isLoading || !selectedLevel}>
                            {isLoading ? t('dialogs.level.updating') : t('dialogs.level.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialogs.password.title')}</DialogTitle>
                        <DialogDescription>
                            {t('dialogs.password.desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Input
                                type="text"
                                placeholder={t('dialogs.password.placeholder')}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">{t('dialogs.password.hint')}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>{t('actions.cancel')}</Button>
                        <Button onClick={handlePasswordReset} disabled={isLoading || !newPassword}>
                            {isLoading ? t('dialogs.password.setting') : t('dialogs.password.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
