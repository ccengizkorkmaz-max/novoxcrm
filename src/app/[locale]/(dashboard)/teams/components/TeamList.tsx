'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, MapPin, Building2, Pencil, Trash, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTeam, updateTeam, deleteTeam } from '@/app/[locale]/(dashboard)/teams/actions'
import MemberManagement from './MemberManagement'
import AssignmentManagement from './AssignmentManagement'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface TeamListProps {
    teams: any[]
    profiles: any[]
    projects: any[]
    sales: any[]
}

export default function TeamList({ teams, profiles, projects, sales }: TeamListProps) {
    const t = useTranslations('Teams')
    const router = useRouter()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingTeam, setEditingTeam] = useState<any>(null)
    const [teamToDelete, setTeamToDelete] = useState<any>(null)
    const [isPending, setIsPending] = useState(false)

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return

        setIsPending(true)
        const formData = new FormData()
        formData.append('id', teamToDelete.id)

        try {
            const result = await deleteTeam(formData)
            if (result.error) {
                toast.error('Hata: ' + result.error)
            } else {
                toast.success(t('successDelete') || 'Ekip başarıyla silindi')
                router.refresh()
                setTeamToDelete(null)
            }
        } catch (error) {
            toast.error('Girişim sırasında bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-start">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
                            <Plus className="w-5 h-5 mr-2" />
                            {t('newTeam')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                            <DialogTitle className="text-xl font-black text-slate-900">{t('createTitle')}</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                {t('createDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            setIsPending(true)
                            const result = await createTeam(formData)
                            setIsPending(false)
                            if (result.error) {
                                toast.error('Hata: ' + result.error)
                            } else {
                                toast.success(t('successCreate') || 'Ekip başarıyla oluşturuldu')
                                setIsCreateOpen(false)
                                router.refresh()
                            }
                        }}>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('name')}</Label>
                                    <Input id="name" name="name" placeholder={t('namePlaceholder')} required className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="region" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('region')}</Label>
                                        <Input id="region" name="region" placeholder={t('regionPlaceholder')} className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="office_name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('office')}</Label>
                                        <Input id="office_name" name="office_name" placeholder={t('officePlaceholder')} className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('descriptionLabel')}</Label>
                                    <Textarea id="description" name="description" placeholder={t('descriptionPlaceholder')} className="min-h-[100px] bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all resize-none" />
                                </div>
                            </div>
                            <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
                                <Button type="submit" disabled={isPending} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all select-none">
                                    {isPending ? (
                                        <div className="flex items-center gap-2">
                                            <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                            <span>{t('creating')}</span>
                                        </div>
                                    ) : t('create')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                    <Card key={team.id} className="group relative overflow-hidden border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 rounded-2xl bg-white">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg font-black text-slate-900 tracking-tight">{team.name}</CardTitle>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase">
                                            {sales.filter(s => team.team_members?.some((m: any) => m.profiles.id === s.assigned_to)).length} {t('sales')}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-slate-500 text-sm font-medium line-clamp-1">{team.description || '-'}</CardDescription>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingTeam(team)}
                                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setTeamToDelete(team)}
                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                {team.region && (
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        <MapPin className="w-3.5 h-3.5 text-blue-500" /> {team.region}
                                    </div>
                                )}
                                {team.office_name && (
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        <Building2 className="w-3.5 h-3.5 text-blue-500" /> {team.office_name}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-tight">
                                        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Users className="w-3.5 h-3.5" />
                                        </div>
                                        {t('members')} <span className="text-slate-400 ml-1">({team.team_members?.length || 0})</span>
                                    </div>
                                    <MemberManagement team={team} profiles={profiles} />
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                    {team.team_members?.slice(0, 5).map((m: any) => (
                                        <Badge key={m.id} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                                            {m.profiles?.full_name?.split(' ')[0]}
                                            {m.role === 'leader' && ` (L)`}
                                        </Badge>
                                    ))}
                                    {team.team_members?.length > 5 && (
                                        <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-slate-200 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                                            +{team.team_members.length - 5}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-tight">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Building2 className="w-3.5 h-3.5" />
                                        </div>
                                        {t('projects')} <span className="text-slate-400 ml-1">({team.team_project_assignments?.length || 0})</span>
                                    </div>
                                    <AssignmentManagement team={team} projects={projects} />
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                    {team.team_project_assignments?.slice(0, 3).map((a: any) => (
                                        <Badge key={a.id} variant="outline" className="border-indigo-100 bg-indigo-50/50 text-indigo-600 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                                            {a.projects?.name}
                                        </Badge>
                                    ))}
                                    {team.team_project_assignments?.length > 3 && (
                                        <Badge variant="outline" className="border-indigo-100 bg-slate-50 text-slate-400 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                                            +{team.team_project_assignments.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Team Dialog */}
            <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-xl font-black text-slate-900">{t('editTitle')}</DialogTitle>
                    </DialogHeader>
                    {editingTeam && (
                        <form action={async (formData) => {
                            setIsPending(true)
                            const result = await updateTeam(formData)
                            setIsPending(false)
                            if (result.error) {
                                toast.error('Hata: ' + result.error)
                            } else {
                                toast.success(t('successUpdate') || 'Ekip başarıyla güncellendi')
                                setEditingTeam(null)
                                router.refresh()
                            }
                        }}>
                            <input type="hidden" name="id" value={editingTeam.id} />
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('name')}</Label>
                                    <Input id="edit-name" name="name" defaultValue={editingTeam.name} required className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-region" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('region')}</Label>
                                        <Input id="edit-region" name="region" defaultValue={editingTeam.region} className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-office" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('office')}</Label>
                                        <Input id="edit-office" name="office_name" defaultValue={editingTeam.office_name} className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-desc" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('descriptionLabel')}</Label>
                                    <Textarea id="edit-desc" name="description" defaultValue={editingTeam.description} className="min-h-[100px] bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all resize-none" />
                                </div>
                            </div>
                            <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
                                <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all select-none">
                                    {isPending ? t('updating') : t('update')}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Global Delete Confirmation */}
            <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight">
                                {t('deleteConfirmTitle') || 'Ekibi Sil'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                <span className="text-slate-900 font-bold">"{teamToDelete?.name}"</span> {t('deleteConfirm') || 'isimli ekibi ve tüm bağlantılarını kalıcı olarak silmek istediğinize emin misiniz?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-11 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            {t('cancel') || 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteTeam}
                            className="w-full sm:w-1/2 h-11 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 text-white font-bold active:scale-95 transition-all"
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
