"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, MoreHorizontal, User, Mail, Phone, Briefcase } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/routing'
import { Badge } from "@/components/ui/badge"
import { deleteEmployee } from '../actions'
import { toast } from 'sonner'

interface Employee {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    sicil_no: string | null
    department: string | null
    status: string
    photo_url: string | null
}

interface EmployeeListProps {
    employees: Employee[]
    totalRecords: number
    initialPage: number
}

export default function EmployeeList({ employees, totalRecords, initialPage }: EmployeeListProps) {
    const t = useTranslations('HR')
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('q') || '')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams.toString())
        if (search) params.set('q', search)
        else params.delete('q')
        params.set('page', '1')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('searchPlaceholder')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.push(`${pathname}/new`)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('newEmployee')}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[300px]">{t('table.name')}</TableHead>
                            <TableHead>{t('table.department')}</TableHead>
                            <TableHead>{t('table.sicilNo')}</TableHead>
                            <TableHead>{t('table.phone')}</TableHead>
                            <TableHead>{t('table.status')}</TableHead>
                            <TableHead className="text-right">{t('table.actions.title')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    {t('table.empty')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => (
                                <TableRow key={employee.id} className="cursor-pointer hover:bg-muted/30" onClick={() => router.push(`${pathname}/${employee.id}`)}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted overflow-hidden border">
                                                {employee.photo_url ? (
                                                    <img src={employee.photo_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{employee.first_name} {employee.last_name}</span>
                                                <span className="text-xs text-muted-foreground">{employee.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm">{employee.department || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-mono">{employee.sicil_no || '-'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm">{employee.phone || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={employee.status === 'Active' ? 'secondary' : 'outline'}>
                                            {t(`form.${employee.status.toLowerCase()}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t('table.actions.title')}</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => router.push(`${pathname}/${employee.id}/edit`)}>
                                                    {t('table.actions.edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-destructive cursor-pointer"
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        if (confirm(t('messages.confirmDelete'))) {
                                                            try {
                                                                await deleteEmployee(employee.id)
                                                                toast.success(t('messages.successDelete'))
                                                                router.refresh()
                                                            } catch (err) {
                                                                console.error(err)
                                                                toast.error(t('messages.error'))
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {t('table.actions.delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
