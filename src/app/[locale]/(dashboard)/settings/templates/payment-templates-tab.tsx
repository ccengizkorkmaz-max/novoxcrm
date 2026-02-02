'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, FileText, Pencil } from 'lucide-react'
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
import { useTranslations } from 'next-intl'

export function PaymentTemplatesTab({ templates }: { templates: any[] }) {
    const t = useTranslations('Settings')
    const [interims, setInterims] = useState<{ month: number, rate: number }[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)

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

    const handleDelete = async (id: string) => {
        if (confirm(t('templates.table.confirmDelete'))) {
            await deletePaymentPlanTemplate(id)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('templates.title')}</CardTitle>
                    <CardDescription>
                        {t('templates.description')}
                    </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreateClick}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('templates.new')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{editingTemplate ? t('templates.dialog.titleEdit') : t('templates.dialog.titleNew')}</DialogTitle>
                            <DialogDescription>
                                {editingTemplate ? t('templates.dialog.descEdit') : t('templates.dialog.descNew')}
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            formData.append('interims_json', JSON.stringify(interims))
                            if (editingTemplate) {
                                formData.append('id', editingTemplate.id)
                                await updatePaymentPlanTemplate(formData)
                            } else {
                                await createPaymentPlanTemplate(formData)
                            }
                            setIsDialogOpen(false)
                            setInterims([])
                            setEditingTemplate(null)
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="t-name">{t('templates.dialog.name')}</Label>
                                    <Input
                                        id="t-name"
                                        name="name"
                                        placeholder={t('templates.dialog.namePlaceholder')}
                                        defaultValue={editingTemplate?.name}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="t-down">{t('templates.dialog.down')}</Label>
                                        <Input
                                            id="t-down"
                                            name="down_payment_rate"
                                            type="number"
                                            defaultValue={editingTemplate?.down_payment_rate || "25"}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="t-install">{t('templates.dialog.installments')}</Label>
                                        <Input
                                            id="t-install"
                                            name="installment_count"
                                            type="number"
                                            defaultValue={editingTemplate?.installment_count || "12"}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-2">
                                    <div className="flex justify-between items-center">
                                        <Label>{t('templates.dialog.interim')}</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addInterim}>
                                            <Plus className="w-3 h-3 mr-1" /> {t('templates.dialog.add')}
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-[150px] overflow-auto">
                                        {interims.map((interim, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <div className="grid gap-1 flex-1">
                                                    <Input
                                                        type="number"
                                                        placeholder={t('templates.dialog.month')}
                                                        value={interim.month}
                                                        onChange={(e) => updateInterim(idx, 'month', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="grid gap-1 flex-1">
                                                    <Input
                                                        type="number"
                                                        placeholder={t('templates.dialog.rate')}
                                                        value={interim.rate}
                                                        onChange={(e) => updateInterim(idx, 'rate', Number(e.target.value))}
                                                    />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeInterim(idx)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        {interims.length === 0 && (
                                            <p className="text-xs text-muted-foreground">{t('templates.dialog.noInterim')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editingTemplate ? t('templates.dialog.update') : t('templates.dialog.create')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('templates.table.name')}</TableHead>
                            <TableHead>{t('templates.table.down')}</TableHead>
                            <TableHead>{t('templates.table.installments')}</TableHead>
                            <TableHead>{t('templates.table.interim')}</TableHead>
                            <TableHead className="text-right">{t('templates.table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates && templates.length > 0 ? (
                            templates.map((tpl: any) => (
                                <TableRow key={tpl.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        {tpl.name}
                                    </TableCell>
                                    <TableCell>%{tpl.down_payment_rate}</TableCell>
                                    <TableCell>{tpl.installment_count}</TableCell>
                                    <TableCell>
                                        {tpl.interim_payment_structure && tpl.interim_payment_structure.length > 0 ? (
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                {tpl.interim_payment_structure.map((i: any, k: number) => (
                                                    <div key={k}>{i.month}. {t('templates.table.month')}: %{i.rate}</div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(tpl)}>
                                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(tpl.id)}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    {t('templates.table.empty')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
