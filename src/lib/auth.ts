import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'owner' | 'crm_manager' | 'manager' | 'sales' | 'admin'

export interface UserPermission {
    canManageSettings: boolean
    canManageUsers: boolean
    canDeleteData: boolean
    canViewAllSales: boolean
    canViewReports: boolean
}

export const PERMISSIONS: Record<UserRole, UserPermission> = {
    owner: {
        canManageSettings: true,
        canManageUsers: true,
        canDeleteData: true,
        canViewAllSales: true,
        canViewReports: true,
    },
    crm_manager: { // CRM Manager — owner ile aynı yetkiler
        canManageSettings: true,
        canManageUsers: true,
        canDeleteData: true,
        canViewAllSales: true,
        canViewReports: true,
    },
    admin: { // Legacy/Super admin
        canManageSettings: true,
        canManageUsers: true,
        canDeleteData: true,
        canViewAllSales: true,
        canViewReports: true,
    },
    manager: {
        canManageSettings: false,
        canManageUsers: false, // Can verify/invite but not delete/manage plan
        canDeleteData: false, // Managers can archive, but hard delete is Owner only usually
        canViewAllSales: true,
        canViewReports: true,
    },
    sales: {
        canManageSettings: false,
        canManageUsers: false,
        canDeleteData: false,
        canViewAllSales: false, // Only own sales
        canViewReports: false,
    },
}

export async function getCurrentUserRole(): Promise<UserRole> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 'sales' // Default fallback

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return (profile?.role as UserRole) || 'sales'
}

export async function checkRole(allowedRoles: UserRole[]) {
    const role = await getCurrentUserRole()
    if (!allowedRoles.includes(role)) {
        redirect('/') // Or unauthorized page
    }
    return role
}

export async function hasPermission(permission: keyof UserPermission): Promise<boolean> {
    const role = await getCurrentUserRole()
    return PERMISSIONS[role][permission]
}
