'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { toast } from 'sonner'
import { updateUserRole, toggleUserExternal, toggleUserActive, toggleHotLeadManager } from '../actions'
import UserTableActions from './UserTableActions'
import { Flame } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface User {
    id: string
    full_name: string | null
    email: string | null
    role: string
    created_at: string
    is_external?: boolean
    is_active?: boolean
    is_hot_lead_manager?: boolean
    phone?: string | null
}

interface UsersTableProps {
    users: User[]
    currentUserRole: string
}

export default function UsersTable({ users, currentUserRole }: UsersTableProps) {
    const t = useTranslations('Settings')
    
    // Local state to store optimistic updates for 'is_external'
    const [optimisticExternal, setOptimisticExternal] = useState<Record<string, boolean>>({})
    // Local state for 'is_active' optimistic updates
    const [optimisticActive, setOptimisticActive] = useState<Record<string, boolean>>({})
    // Local state for 'is_hot_lead_manager' optimistic updates
    const [optimisticHotLead, setOptimisticHotLead] = useState<Record<string, boolean>>({})

    // Only owner/admin can change roles and external flag
    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin' || currentUserRole === 'crm_manager'

    const handleRoleChange = async (userId: string, newRole: string) => {
        const promise = updateUserRole(userId, newRole)
        toast.promise(promise, {
            loading: t('users.roles.updating'),
            success: t('users.roles.updateSuccess'),
            error: (err) => err?.message || t('users.roles.updateError')
        })
    }

    const handleExternalToggle = async (userId: string, checked: boolean) => {
        // Optimistically update local UI immediately
        setOptimisticExternal(prev => ({ ...prev, [userId]: checked }))
        
        try {
            const res = await toggleUserExternal(userId, checked)
            if (res?.error) {
                // Revert optimistic update on error
                setOptimisticExternal(prev => {
                    const next = { ...prev }
                    delete next[userId]
                    return next
                })
                toast.error(res.error)
            }
        } catch (error) {
            // Revert optimistic update on catch
            setOptimisticExternal(prev => {
                const next = { ...prev }
                delete next[userId]
                return next
            })
            toast.error("Bir hata oluştu")
        }
    }

    const handleActiveToggle = async (userId: string, checked: boolean) => {
        setOptimisticActive(prev => ({ ...prev, [userId]: checked }))
        
        try {
            const res = await toggleUserActive(userId, checked)
            if (res?.error) {
                setOptimisticActive(prev => {
                    const next = { ...prev }
                    delete next[userId]
                    return next
                })
                toast.error(res.error)
            } else {
                toast.success(checked ? 'Kullanıcı aktif edildi' : 'Kullanıcı pasif yapıldı')
            }
        } catch (error) {
            setOptimisticActive(prev => {
                const next = { ...prev }
                delete next[userId]
                return next
            })
            toast.error("Bir hata oluştu")
        }
    }

    const handleHotLeadToggle = async (userId: string, checked: boolean) => {
        setOptimisticHotLead(prev => ({ ...prev, [userId]: checked }))
        
        try {
            const res = await toggleHotLeadManager(userId, checked)
            if (res?.error) {
                setOptimisticHotLead(prev => {
                    const next = { ...prev }
                    delete next[userId]
                    return next
                })
                toast.error(res.error)
            } else {
                toast.success(checked 
                    ? '🔥 Hot Lead Manager aktif edildi — bu kullanıcıya sıcak müşteri bildirimleri gönderilecek' 
                    : 'Hot Lead Manager devre dışı bırakıldı'
                )
            }
        } catch (error) {
            setOptimisticHotLead(prev => {
                const next = { ...prev }
                delete next[userId]
                return next
            })
            toast.error("Bir hata oluştu")
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return t('users.roles.admin')
            case 'owner': return t('users.roles.owner')
            case 'crm_manager': return 'CRM Manager'
            case 'manager': return t('users.roles.manager')
            case 'sales': return "Satış Temsilcisi"
            case 'broker': return "Dış Broker"
            case 'user': return t('users.roles.user')
            default: return role
        }
    }

    return (
        <TooltipProvider>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('users.table.name')}</TableHead>
                    <TableHead>{t('users.table.email')}</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
                    <TableHead className="text-center">Dış Kaynak</TableHead>
                    <TableHead className="text-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center justify-center gap-1 cursor-help">
                                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="text-xs">Hot Lead</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px]">
                                <p className="text-xs">Aktif edildiğinde, AI WhatsApp yazışmalarında tespit edilen sıcak müşteriler hakkında bu kullanıcıya WhatsApp bildirimi gönderilir.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TableHead>
                    <TableHead>{t('users.table.role')}</TableHead>
                    <TableHead>{t('users.table.date')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users?.map((u) => {
                    // Determine current visual state: use optimistic value if defined, otherwise use original value
                    const isExternal = optimisticExternal[u.id] !== undefined ? optimisticExternal[u.id] : (u.is_external || false)
                    const isActive = optimisticActive[u.id] !== undefined ? optimisticActive[u.id] : (u.is_active !== false)
                    const isHotLeadManager = optimisticHotLead[u.id] !== undefined ? optimisticHotLead[u.id] : (u.is_hot_lead_manager || false)
                    
                    return (
                        <TableRow key={u.id} className={!isActive ? 'opacity-50' : ''}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {u.full_name}
                                    {isExternal && (
                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-orange-300 text-orange-600 bg-orange-50">
                                            Dış
                                        </Badge>
                                    )}
                                    {!isActive && (
                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-red-300 text-red-500 bg-red-50">
                                            Pasif
                                        </Badge>
                                    )}
                                    {isHotLeadManager && (
                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-orange-400 text-orange-600 bg-gradient-to-r from-orange-50 to-red-50">
                                            <Flame className="h-2.5 w-2.5 mr-0.5" />
                                            Hot Lead
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center">
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={(checked) => handleActiveToggle(u.id, checked)}
                                        disabled={!canManage || u.role === 'owner'}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center">
                                    <Checkbox
                                        checked={isExternal}
                                        onCheckedChange={(checked) => handleExternalToggle(u.id, checked === true)}
                                        disabled={!canManage || u.role === 'broker'} 
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Switch
                                                    checked={isHotLeadManager}
                                                    onCheckedChange={(checked) => handleHotLeadToggle(u.id, checked)}
                                                    disabled={!canManage}
                                                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500"
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                {isHotLeadManager 
                                                    ? `Aktif — ${u.phone ? u.phone : 'Telefon tanımlı değil!'}`
                                                    : 'Sıcak müşteri WhatsApp bildirimi'
                                                }
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableCell>
                            <TableCell>
                                {canManage ? (
                                    <Select
                                        defaultValue={u.role}
                                        onValueChange={(val) => {
                                            handleRoleChange(u.id, val)
                                            if (val === 'broker') {
                                                handleExternalToggle(u.id, true)
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-[140px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">{t('users.roles.owner')}</SelectItem>
                                            <SelectItem value="crm_manager">CRM Manager</SelectItem>
                                            <SelectItem value="manager">{t('users.roles.manager')}</SelectItem>
                                            <SelectItem value="sales">Satış Temsilcisi</SelectItem>
                                            <SelectItem value="broker">Dış Broker</SelectItem>
                                            <SelectItem value="user">{t('users.roles.user')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge
                                        variant={u.role === 'admin' || u.role === 'owner' ? 'default' : 'secondary'}
                                        className="capitalize"
                                    >
                                        {getRoleLabel(u.role)}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                {new Date(u.created_at).toLocaleDateString("tr-TR")}
                            </TableCell>
                            <TableCell>
                                <UserTableActions user={u} allUsers={users} />
                            </TableCell>
                        </TableRow>
                    )
                })}
                {!users || users.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                            {t('users.table.empty')}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
        </TooltipProvider>
    )
}
