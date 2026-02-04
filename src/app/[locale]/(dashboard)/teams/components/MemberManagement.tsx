'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
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
import { Label } from "@/components/ui/label"
import { Plus, X, Users, AlertTriangle } from 'lucide-react'
import { addMemberToTeam, removeMemberFromTeam } from '../actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface MemberManagementProps {
    team: any
    profiles: any[]
}

export default function MemberManagement({ team, profiles }: MemberManagementProps) {
    const t = useTranslations('Teams.memberProps')
    const router = useRouter()
    const [selectedProfileId, setSelectedProfileId] = useState<string>('')
    const [selectedRole, setSelectedRole] = useState<string>('member')
    const [isPending, setIsPending] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState<any>(null)

    // Filter out profiles that are already members
    const existingMemberIds = new Set(team.team_members?.map((m: any) => m.profiles.id))
    const availableProfiles = profiles.filter(p => !existingMemberIds.has(p.id))

    const handleRemoveMember = async () => {
        if (!memberToRemove) return

        setIsPending(true)
        const formData = new FormData()
        formData.append('team_id', team.id)
        formData.append('profile_id', memberToRemove.profiles.id)

        try {
            await removeMemberFromTeam(formData)
            router.refresh()
            setMemberToRemove(null)
        } catch (error) {
            console.error('Error removing member:', error)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Plus className="w-3 h-3 mr-1" /> {t('add')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-900">{team.name} - {t('title')}</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-8">
                        {/* Add Member Form */}
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">{t('addTitle')}</h4>
                            </div>

                            <form action={async () => {
                                if (!selectedProfileId) return
                                setIsPending(true)
                                const formData = new FormData()
                                formData.append('team_id', team.id)
                                formData.append('profile_id', selectedProfileId)
                                formData.append('role', selectedRole)
                                await addMemberToTeam(formData)
                                setSelectedProfileId('')
                                setIsPending(false)
                                router.refresh()
                            }} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    <div className="sm:col-span-8 space-y-1.5">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('selectUser')}</Label>
                                        <Select value={selectedProfileId} onValueChange={setSelectedProfileId} disabled={isPending}>
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all">
                                                <SelectValue placeholder={t('selectUser')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl">
                                                {availableProfiles.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="rounded-lg min-h-[44px]">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{p.full_name}</span>
                                                            <span className="text-[11px] text-muted-foreground">{p.email}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="sm:col-span-4 space-y-1.5">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('role')}</Label>
                                        <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isPending}>
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl transition-all">
                                                <SelectValue placeholder={t('role')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl">
                                                <SelectItem value="member" className="rounded-lg">{t('memberBadge')}</SelectItem>
                                                <SelectItem value="leader" className="rounded-lg">{t('leaderBadge')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 font-bold rounded-xl transition-all group"
                                    disabled={!selectedProfileId || isPending}
                                >
                                    {isPending ? (
                                        <div className="flex items-center gap-2">
                                            <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                            <span>{t('adding')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Plus className="w-4 h-4 transition-transform group-hover:scale-125" />
                                            <span>{t('add')}</span>
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Member List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <h4 className="text-sm font-bold text-slate-800">{t('current')}</h4>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {team.team_members?.length || 0} ÜYE
                                </span>
                            </div>

                            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white shadow-sm">
                                {team.team_members?.length > 0 ? (
                                    team.team_members.map((member: any) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 border border-blue-100 shadow-inner">
                                                    {member.profiles?.full_name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-slate-900">{member.profiles?.full_name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${member.role === 'leader'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                            : 'bg-slate-50 text-slate-500 border-slate-100'
                                                            }`}>
                                                            {member.role === 'leader' ? t('leaderBadge') : t('memberBadge')}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">{member.profiles?.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                                                onClick={() => setMemberToRemove(member)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center bg-slate-50/30">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-3">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm text-slate-400 font-bold tracking-tight">{t('noMembers')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight">
                                {t('removeConfirmTitle') || 'Üyeyi Çıkar'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium">
                                <span className="text-slate-900 font-bold">"{memberToRemove?.profiles?.full_name}"</span> {t('removeConfirm') || 'isimli üyeyi ekipten çıkarmak istediğinize emin misiniz?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-11 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all">
                            {t('cancel') || 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            className="w-full sm:w-1/2 h-11 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 text-white font-bold active:scale-95 transition-all"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>{t('removing') || 'Çıkarılıyor...'}</span>
                                </div>
                            ) : (
                                t('removeConfirmAction') || 'Evet, Çıkar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
