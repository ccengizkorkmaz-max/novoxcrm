'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button' // Fixed import path
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

    const handleToggleStatus = async () => {
        setIsLoading(true)
        try {
            const result = await toggleBrokerStatus(brokerId, !isActive)
            if (result.success) {
                toast.success(isActive ? 'Broker pasife alındı.' : 'Broker aktif edildi.')
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error('Bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLevelUpdate = async () => {
        setIsLoading(true)
        try {
            const result = await updateBrokerLevelManual(brokerId, selectedLevel)
            if (result.success) {
                toast.success('Broker seviyesi güncellendi.')
                setIsLevelDialogOpen(false)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error('Bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordReset = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('Şifre en az 6 karakter olmalıdır.')
            return
        }

        setIsLoading(true)
        try {
            const result = await adminSetBrokerPassword(brokerId, newPassword)
            if (result.success) {
                toast.success('Broker şifresi güncellendi.')
                setIsPasswordDialogOpen(false)
                setNewPassword('')
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error('Bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Menüyü aç</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsLevelDialogOpen(true)}>
                        <Award className="mr-2 h-4 w-4" />
                        Seviye Değiştir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Şifre Belirle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleStatus} className={isActive ? 'text-red-600' : 'text-green-600'}>
                        {isActive ? (
                            <>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Pasife Al
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Aktif Et
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isLevelDialogOpen} onOpenChange={setIsLevelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Broker Seviyesini Değiştir</DialogTitle>
                        <DialogDescription>
                            Bu broker için yeni bir partner seviyesi belirleyin. Bu işlem otomatik seviye hesaplamasını geçersiz kılabilir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seviye Seçin" />
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
                        <Button variant="outline" onClick={() => setIsLevelDialogOpen(false)}>İptal</Button>
                        <Button onClick={handleLevelUpdate} disabled={isLoading || !selectedLevel}>
                            {isLoading ? 'Güncelleniyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Şifre Belirle</DialogTitle>
                        <DialogDescription>
                            Bu broker için yeni bir giriş şifresi belirleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Input
                                type="text"
                                placeholder="Yeni Şifre"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">En az 6 karakter olmalıdır.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>İptal</Button>
                        <Button onClick={handlePasswordReset} disabled={isLoading || !newPassword}>
                            {isLoading ? 'Ayarlanıyor...' : 'Şifreyi Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
