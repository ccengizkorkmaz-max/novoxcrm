'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Edit, Trash2, Award, Star, User, Crown, Trophy, Target } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { createBrokerLevel, updateBrokerLevel, deleteBrokerLevel } from '@/app/broker/actions'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations, useLocale } from 'next-intl'

const iconMap: any = {
    'User': <User className="w-5 h-5" />,
    'Award': <Award className="w-5 h-5" />,
    'Star': <Star className="w-5 h-5" />,
    'Crown': <Crown className="w-5 h-5" />,
    'Trophy': <Trophy className="w-5 h-5" />,
    'Target': <Target className="w-5 h-5" />
}

export default function LevelManager({ levels }: { levels: any[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingLevel, setEditingLevel] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const t = useTranslations('BrokerLevels')
    const locale = useLocale()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)

        if (editingLevel) {
            formData.append('id', editingLevel.id)
            const res = await updateBrokerLevel(formData)
            if (res.error) toast.error(res.error)
            else toast.success(t('messages.updateSuccess'))
        } else {
            const res = await createBrokerLevel(formData)
            if (res.error) toast.error(res.error)
            else toast.success(t('messages.createSuccess'))
        }

        setIsLoading(false)
        setIsDialogOpen(false)
        setEditingLevel(null)
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('messages.confirmDelete'))) return
        const res = await deleteBrokerLevel(id)
        if (res.error) toast.error(res.error)
        else toast.success(t('messages.deleteSuccess'))
    }

    const openEdit = (level: any) => {
        setEditingLevel(level)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                </div>
                <Button onClick={() => { setEditingLevel(null); setIsDialogOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" /> {t('addLevel')}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {levels.map((level) => (
                    <Card key={level.id} className="relative overflow-hidden transition-all hover:shadow-md border-t-4" style={{ borderTopColor: level.color }}>
                        <div className="absolute top-2 right-2 flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(level)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => handleDelete(level.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardHeader className="pb-3 text-center">
                            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: level.color + '20', color: level.color }}>
                                {iconMap[level.icon] || <Star className="w-5 h-5" />}
                            </div>
                            <CardTitle className="text-lg">{level.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-sm space-y-2">
                            <div className="bg-muted/50 rounded-lg p-2">
                                <span className="block text-xs text-muted-foreground uppercase font-bold">{t('labels.minSalesCount')}</span>
                                <span className="text-lg font-mono font-bold text-foreground">{level.min_sales_count}</span>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-2">
                                <span className="block text-xs text-muted-foreground uppercase font-bold">{t('labels.minSalesVolume')}</span>
                                <span className="text-lg font-mono font-bold text-foreground">
                                    {(level.min_sales_volume / 1000).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}K+
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLevel ? t('form.editTitle') : t('form.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('labels.levelName')}</Label>
                            <Input name="name" defaultValue={editingLevel?.name} placeholder={t('form.namePlaceholder')} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('labels.minSalesCount')}</Label>
                                <Input name="min_sales_count" type="number" defaultValue={editingLevel?.min_sales_count || 0} required />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('labels.minSalesVolumeOnly')}</Label>
                                <Input name="min_sales_volume" type="number" defaultValue={editingLevel?.min_sales_volume || 0} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('labels.color')}</Label>
                                <div className="flex gap-2">
                                    <Input name="color" type="color" defaultValue={editingLevel?.color || '#000000'} className="w-12 p-1" />
                                    <Input defaultValue={editingLevel?.color} disabled className="flex-1 opacity-50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('labels.icon')}</Label>
                                <Select name="icon" defaultValue={editingLevel?.icon || 'Star'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
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
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading ? t('form.saving') : t('form.save')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
