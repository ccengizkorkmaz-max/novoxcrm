'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'
import { updateUserRole, toggleUserExternal } from '../actions'
import UserTableActions from './UserTableActions'

interface User {
    id: string
    full_name: string | null
    email: string | null
    role: string
    created_at: string
    is_external?: boolean
}

interface UsersTableProps {
    users: User[]
    currentUserRole: string
}

export default function UsersTable({ users, currentUserRole }: UsersTableProps) {
    const t = useTranslations('Settings')

    // Only owner/admin can change roles and external flag
    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

    const handleRoleChange = async (userId: string, newRole: string) => {
        const promise = updateUserRole(userId, newRole)
        toast.promise(promise, {
            loading: t('users.roles.updating'),
            success: t('users.roles.updateSuccess'),
            error: (err) => err?.message || t('users.roles.updateError')
        })
    }

    const handleExternalToggle = async (userId: string, checked: boolean) => {
        const res = await toggleUserExternal(userId, checked)
        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success(checked ? "Dış kaynak olarak işaretlendi" : "Dış kaynak işareti kaldırıldı")
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return t('users.roles.admin')
            case 'owner': return t('users.roles.owner')
            case 'manager': return t('users.roles.manager')
            case 'sales': return t('users.roles.sales')
            case 'user': return t('users.roles.user')
            default: return role
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('users.table.name')}</TableHead>
                    <TableHead>{t('users.table.email')}</TableHead>
                    <TableHead className="text-center">Dış Kaynak</TableHead>
                    <TableHead>{t('users.table.role')}</TableHead>
                    <TableHead>{t('users.table.date')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users?.map((u) => (
                    <TableRow key={u.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                {u.full_name}
                                {u.is_external && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-orange-300 text-orange-600 bg-orange-50">
                                        Dış
                                    </Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex justify-center">
                                <Checkbox
                                    checked={u.is_external || false}
                                    onCheckedChange={(checked) => handleExternalToggle(u.id, checked === true)}
                                    disabled={!canManage}
                                />
                            </div>
                        </TableCell>
                        <TableCell>
                            {canManage ? (
                                <Select
                                    defaultValue={u.role}
                                    onValueChange={(val) => handleRoleChange(u.id, val)}
                                >
                                    <SelectTrigger className="w-[140px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owner">{t('users.roles.owner')}</SelectItem>
                                        <SelectItem value="manager">{t('users.roles.manager')}</SelectItem>
                                        <SelectItem value="sales">{t('users.roles.sales')}</SelectItem>
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
                ))}
                {!users || users.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            {t('users.table.empty')}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
