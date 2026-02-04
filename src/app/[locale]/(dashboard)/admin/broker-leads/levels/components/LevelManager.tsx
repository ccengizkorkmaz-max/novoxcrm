'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Edit, Trash2, Award, Star, User, Crown, Trophy, Target, AlertTriangle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { createBrokerLevel, updateBrokerLevel, deleteBrokerLevel } from '@/app/broker/actions'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

const iconMap: any = {
    'User': <User className="w-5 h-5" />,
    'Award': <Award className="w-5 h-5" />,
    'Star': <Star className="w-5 h-5" />,
    'Crown': <Crown className="w-5 h-5" />,
    'Trophy': <Trophy className="w-5 h-5" />,
    'Target': <Target className="w-5 h-5" />
}

export default function LevelManager({ levels }: { levels: any[] }) {
    const router = useRouter()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingLevel, setEditingLevel] = useState<any>(null)
    const [levelToDelete, setLevelToDelete] = useState<any>(null)
    const [isPending, setIsPending] = useState(false)
    const t = useTranslations('BrokerLevels')
    const locale = useLocale()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsPending(true)
        const formData = new FormData(e.currentTarget)

        try {
            if (editingLevel) {
                formData.append('id', editingLevel.id)
                const res = await updateBrokerLevel(formData)
                if (res.error) toast.error(res.error)
                else {
                    toast.success(t('messages.updateSuccess'))
                    router.refresh()
                }
            } else {
                const res = await createBrokerLevel(formData)
                if (res.error) toast.error(res.error)
                else {
                    toast.success(t('messages.createSuccess'))
                    router.refresh()
                }
            }
            setIsDialogOpen(false)
            setEditingLevel(null)
        } catch (error) {
            toast.error('Girişim sırasında bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    const handleDeleteLevel = async () => {
        if (!levelToDelete) return

        setIsPending(true)
        try {
            const res = await deleteBrokerLevel(levelToDelete.id)
            if (res.error) toast.error(res.error)
            else {
                toast.success(t('messages.deleteSuccess'))
                router.refresh()
                setLevelToDelete(null)
            }
        } catch (error) {
            toast.error('Silme işlemi sırasında bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    const openEdit = (level: any) => {
        setEditingLevel(level)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        {t('title')}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">{t('description')}</p>
                </div>
                <Button
                    onClick={() => { setEditingLevel(null); setIsDialogOpen(true) }}
                    className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-5 w-5" /> {t('addLevel')}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {levels.map((level) => (
                    <Card key={level.id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-slate-200 hover:border-blue-200 rounded-3xl bg-white">
                        <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: level.color }} />
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                onClick={() => openEdit(level)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                onClick={() => setLevelToDelete(level)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardHeader className="pb-4 text-center mt-4">
                            <div
                                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 transition-transform duration-500"
                                style={{ backgroundColor: level.color + '15', color: level.color }}
                            >
                                {iconMap[level.icon] || <Star className="w-7 h-7" />}
                            </div>
                            <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">{level.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-8 px-6">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">{t('labels.minSalesCount')}</span>
                                    <span className="text-xl font-black text-slate-900 leading-none">{level.min_sales_count}</span>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <Target className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">{t('labels.minSalesVolume')}</span>
                                    <span className="text-xl font-black text-slate-900 leading-none">
                                        {(level.min_sales_volume / 1000).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}K+
                                    </span>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <Award className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                            {editingLevel ? t('form.editTitle') : t('form.createTitle')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('labels.levelName')}</Label>
                            <Input name="name" defaultValue={editingLevel?.name} placeholder={t('form.namePlaceholder')} required className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('labels.minSalesCount')}</Label>
                                <Input name="min_sales_count" type="number" defaultValue={editingLevel?.min_sales_count || 0} required className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('labels.minSalesVolumeOnly')}</Label>
                                <Input name="min_sales_volume" type="number" defaultValue={editingLevel?.min_sales_volume || 0} required className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('labels.color')}</Label>
                                <div className="flex gap-2">
                                    <Input name="color" type="color" defaultValue={editingLevel?.color || '#3b82f6'} className="w-14 h-12 p-1 bg-white border-slate-200 rounded-xl cursor-pointer" />
                                    <Input defaultValue={editingLevel?.color || '#3b82f6'} disabled className="h-12 flex-1 opacity-50 bg-slate-50 border-slate-200 rounded-xl font-mono text-xs uppercase" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('labels.icon')}</Label>
                                <Select name="icon" defaultValue={editingLevel?.icon || 'Star'}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl">
                                        <SelectItem value="User">{t('icons.User')}</SelectItem>
                                        <SelectItem value="Award">{t('icons.Award')}</SelectItem>
                                        <SelectItem value="Star">{t('icons.Star')}</SelectItem>
                                        <SelectItem value="Crown">{t('icons.Crown')}</SelectItem>
                                        <SelectItem value="Trophy">{t('icons.Trophy')}</SelectItem>
                                        <SelectItem value="Target">{t('icons.Target')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isPending} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 transition-all select-none">
                                {isPending ? (
                                    <div className="flex items-center gap-2">
                                        <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                        <span>{t('form.saving')}</span>
                                    </div>
                                ) : t('form.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Global Delete Confirmation */}
            <AlertDialog open={!!levelToDelete} onOpenChange={(open) => !open && setLevelToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {t('deleteConfirmTitle') || 'Seviyeyi Sil'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                <span className="text-slate-900 font-black">"{levelToDelete?.name}"</span> {t('messages.confirmDelete') || 'isimli seviyeyi kalıcı olarak silmek istediğinize emin misiniz?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            {t('cancel') || 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteLevel}
                            className="w-full sm:w-1/2 h-12 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 text-white font-bold active:scale-95 transition-all"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>{t('deleting') || 'Siliniyor...'}</span>
                                </div>
                            ) : (
                                t('deleteConfirmAction') || 'Evet, Sil'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
