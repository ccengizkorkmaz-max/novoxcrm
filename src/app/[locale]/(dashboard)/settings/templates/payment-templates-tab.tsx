'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, FileText, Pencil, AlertTriangle, Calendar, Percent, CreditCard, Building2, Filter } from 'lucide-react'
import { createPaymentPlanTemplate, deletePaymentPlanTemplate, updatePaymentPlanTemplate } from '../actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export function PaymentTemplatesTab({ templates, projects }: { templates: any[], projects: any[] }) {
    const router = useRouter()
    const t = useTranslations('Settings')
    const [interims, setInterims] = useState<{ month: number, rate: number }[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [templateToDelete, setTemplateToDelete] = useState<any>(null)
    const [isPending, setIsPending] = useState(false)
    const [filterProjectId, setFilterProjectId] = useState<string>('all')

    // Filter templates by project
    const filteredTemplates = filterProjectId === 'all'
        ? templates
        : filterProjectId === 'none'
            ? templates.filter(t => !t.project_id)
            : templates.filter(t => t.project_id === filterProjectId)

    const addInterim = () => {
        setInterims([...interims, { month: 6, rate: 10 }])
    }

    const removeInterim = (index: number) => {
        const newInterims = [...interims]
        newInterims.splice(index, 1)
        setInterims(newInterims)
    }

    const updateInterim = (index: number, field: 'month' | 'rate', value: number) => {
        const newInterims = [...interims]
        newInterims[index] = { ...newInterims[index], [field]: value }
        setInterims(newInterims)
    }

    const handleCreateClick = () => {
        setEditingTemplate(null)
        setInterims([])
        setIsDialogOpen(true)
    }

    const handleEditClick = (template: any) => {
        setEditingTemplate(template)
        setInterims(template.interim_payment_structure && Array.isArray(template.interim_payment_structure) ? template.interim_payment_structure : [])
        setIsDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!templateToDelete) return

        setIsPending(true)
        try {
            const res = await deletePaymentPlanTemplate(templateToDelete.id)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(t('templates.messages.successDelete') || 'Şablon başarıyla silindi.')
                router.refresh()
                setTemplateToDelete(null)
            }
        } catch (error) {
            toast.error('Silme işlemi sırasında bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-8 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('templates.title')}</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">{t('templates.description')}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleCreateClick}
                            className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all select-none"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            {t('templates.new')}
                        </Button>
                    </div>
                </CardHeader>

                {/* Project Filter Bar */}
                {projects.length > 0 && (
                    <div className="px-8 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proje:</span>
                        <div className="flex gap-1.5 flex-wrap">
                            <button
                                onClick={() => setFilterProjectId('all')}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                                    filterProjectId === 'all'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-200 hover:text-blue-600'
                                }`}
                            >
                                Tümü ({templates.length})
                            </button>
                            <button
                                onClick={() => setFilterProjectId('none')}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                                    filterProjectId === 'none'
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                Genel
                            </button>
                            {projects.map(p => {
                                const count = templates.filter(t => t.project_id === p.id).length
                                if (count === 0) return null
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setFilterProjectId(p.id)}
                                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                                            filterProjectId === p.id
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-200 hover:text-blue-600'
                                        }`}
                                    >
                                        {p.name} ({count})
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/30">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="px-8 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('templates.table.name')}</TableHead>
                                    <TableHead className="px-8 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Proje</TableHead>
                                    <TableHead className="px-8 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('templates.table.down')}</TableHead>
                                    <TableHead className="px-8 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('templates.table.installments')}</TableHead>
                                    <TableHead className="px-8 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('templates.table.interim')}</TableHead>
                                    <TableHead className="px-8 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">{t('templates.table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTemplates && filteredTemplates.length > 0 ? (
                                    filteredTemplates.map((tpl: any) => (
                                        <TableRow key={tpl.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="px-8 py-5 font-black text-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    {tpl.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                {tpl.projects?.name ? (
                                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold px-2.5 py-1 rounded-lg text-[11px]">
                                                        <Building2 className="h-3 w-3 mr-1" />
                                                        {tpl.projects.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-300 italic text-xs font-medium">Genel</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-black px-3 py-1 rounded-lg">
                                                    %{tpl.down_payment_rate}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                <div className="flex items-center gap-2 font-bold text-slate-600">
                                                    <Calendar className="h-4 w-4 text-slate-300" />
                                                    {tpl.installment_count}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                {tpl.interim_payment_structure && tpl.interim_payment_structure.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {tpl.interim_payment_structure.map((i: any, k: number) => (
                                                            <Badge key={k} variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500 rounded-md py-0 px-2 h-6">
                                                                {i.month}. {t('templates.table.month').toLowerCase()}: %{i.rate}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 italic text-xs font-medium">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleEditClick(tpl)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => setTemplateToDelete(tpl)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-48">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="h-16 w-16 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-2">
                                                    <CreditCard className="w-8 h-8" />
                                                </div>
                                                <p className="text-slate-400 font-bold tracking-tight italic">{t('templates.table.empty')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingTemplate ? t('templates.dialog.titleEdit') : t('templates.dialog.titleNew')}</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            {editingTemplate ? t('templates.dialog.descEdit') : t('templates.dialog.descNew')}
                        </DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        setIsPending(true)
                        try {
                            formData.append('interims_json', JSON.stringify(interims))
                            if (editingTemplate) {
                                formData.append('id', editingTemplate.id)
                                await updatePaymentPlanTemplate(formData)
                                toast.success(t('templates.messages.successUpdate') || 'Şablon güncellendi.')
                            } else {
                                await createPaymentPlanTemplate(formData)
                                toast.success(t('templates.messages.successCreate') || 'Şablon oluşturuldu.')
                            }
                            router.refresh()
                            setIsDialogOpen(false)
                            setInterims([])
                            setEditingTemplate(null)
                        } catch (error) {
                            toast.error('İşlem sırasında bir hata oluştu.')
                        } finally {
                            setIsPending(false)
                        }
                    }} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="t-name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('templates.dialog.name')}</Label>
                            <Input
                                id="t-name"
                                name="name"
                                placeholder={t('templates.dialog.namePlaceholder')}
                                defaultValue={editingTemplate?.name}
                                required
                                className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl font-bold"
                            />
                        </div>

                        {/* Project Select */}
                        {projects.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="t-project" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Proje (Opsiyonel)</Label>
                                <select
                                    id="t-project"
                                    name="project_id"
                                    defaultValue={editingTemplate?.project_id || ''}
                                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold focus:ring-blue-500"
                                >
                                    <option value="">Genel (Şablon tüm projelerde geçerli)</option>
                                    {projects.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="t-down" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('templates.dialog.down')} (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="t-down"
                                        name="down_payment_rate"
                                        type="number"
                                        defaultValue={editingTemplate?.down_payment_rate || "25"}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl font-black pl-10"
                                    />
                                    <Percent className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-300" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="t-install" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('templates.dialog.installments')}</Label>
                                <div className="relative">
                                    <Input
                                        id="t-install"
                                        name="installment_count"
                                        type="number"
                                        defaultValue={editingTemplate?.installment_count || "12"}
                                        required
                                        className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl font-black pl-10"
                                    />
                                    <Calendar className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                    <Label className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{t('templates.dialog.interim')}</Label>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addInterim} className="h-8 rounded-lg font-bold border-blue-100 text-blue-600 hover:bg-blue-50">
                                    <Plus className="w-4 h-4 mr-1" /> {t('templates.dialog.add')}
                                </Button>
                            </div>
                            <div className="space-y-3 max-h-[200px] overflow-auto pr-2 custom-scrollbar">
                                {interims.map((interim, idx) => (
                                    <div key={idx} className="flex gap-3 items-center group/item p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="grid gap-1 flex-1">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('templates.dialog.month')}</Label>
                                            <Input
                                                type="number"
                                                value={interim.month}
                                                onChange={(e) => updateInterim(idx, 'month', Number(e.target.value))}
                                                className="h-10 bg-white border-none shadow-sm rounded-lg font-bold"
                                            />
                                        </div>
                                        <div className="grid gap-1 flex-1">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('templates.dialog.rate')}</Label>
                                            <Input
                                                type="number"
                                                value={interim.rate}
                                                onChange={(e) => updateInterim(idx, 'rate', Number(e.target.value))}
                                                className="h-10 bg-white border-none shadow-sm rounded-lg font-black text-blue-600"
                                            />
                                        </div>
                                        <div className="pt-4">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeInterim(idx)} className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {interims.length === 0 && (
                                    <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-400 font-bold italic">{t('templates.dialog.noInterim')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-2">
                            <Button type="submit" disabled={isPending} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 transition-all select-none">
                                {isPending ? (
                                    <div className="flex items-center gap-2">
                                        <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                        <span>{editingTemplate ? t('templates.dialog.updating') || 'Güncelleniyor...' : t('templates.dialog.creating') || 'Oluşturuluyor...'}</span>
                                    </div>
                                ) : (editingTemplate ? t('templates.dialog.update') : t('templates.dialog.create'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {t('templates.dialog.deleteTitle') || 'Şablonu Sil'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                <span className="text-slate-900 font-black">"{templateToDelete?.name}"</span> isimli {t('templates.table.confirmDelete') || 'ödeme planı şablonunu silmek istediğinize emin misiniz?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            {t('cancel') || 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
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
