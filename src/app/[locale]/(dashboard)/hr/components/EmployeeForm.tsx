"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEmployee, updateEmployee } from '../actions'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { X, Save, ArrowLeft } from 'lucide-react'

interface EmployeeFormProps {
    initialData?: any
    managers: any[]
    users: any[]
    id?: string
}

export default function EmployeeForm({ initialData, managers, users, id }: EmployeeFormProps) {
    const t = useTranslations('HR')
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        first_name: initialData?.first_name || '',
        last_name: initialData?.last_name || '',
        sicil_no: initialData?.sicil_no || '',
        department: initialData?.department || '',
        manager_id: initialData?.manager_id || null,
        salary: initialData?.salary || 0,
        currency: initialData?.currency || 'TL',
        hire_date: initialData?.hire_date || '',
        termination_date: initialData?.termination_date || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        region: initialData?.region || '',
        profile_id: initialData?.profile_id || null,
        status: initialData?.status || 'Active',
        assets: initialData?.assets || {
            laptop: false,
            car: false,
            phone: false,
            peripherals: false
        }
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Sanitize dates: empty string should be null for Postgres
            const submitData = {
                ...formData,
                hire_date: formData.hire_date || null,
                termination_date: formData.termination_date || null
            }

            if (id) {
                await updateEmployee(id, submitData)
                toast.success(t('messages.successUpdate'))
            } else {
                await createEmployee(submitData)
                toast.success(t('messages.successCreate'))
            }
            router.push('/hr')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error(t('messages.error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" type="button" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('form.cancel')}
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? t('form.save') + '...' : t('form.save')}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('tabs.personal')}</CardTitle>
                        <CardDescription>Temel kimlik ve iletişim bilgileri</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">{t('form.firstName')} *</Label>
                                <Input
                                    id="first_name"
                                    required
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">{t('form.lastName')} *</Label>
                                <Input
                                    id="last_name"
                                    required
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('form.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('form.phone')}</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sicil_no">{t('form.sicilNo')}</Label>
                                <Input
                                    id="sicil_no"
                                    value={formData.sicil_no}
                                    onChange={(e) => setFormData({ ...formData, sicil_no: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">{t('form.status')}</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">{t('form.active')}</SelectItem>
                                        <SelectItem value="Passive">{t('form.passive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>İş Bilgileri</CardTitle>
                        <CardDescription>Pozisyon ve ücret tanımları</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="department">{t('form.department')}</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="region">{t('form.region')}</Label>
                                <Input
                                    id="region"
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="manager_id">{t('form.manager')}</Label>
                            <Select
                                value={formData.manager_id || 'none'}
                                onValueChange={(val) => setFormData({ ...formData, manager_id: val === 'none' ? null : val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('form.selectManager')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">- {t('form.selectManager')} -</SelectItem>
                                    {managers.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="salary">{t('form.salary')}</Label>
                                <Input
                                    id="salary"
                                    type="number"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">{t('form.currency')}</Label>
                                <Select
                                    value={formData.currency}
                                    onValueChange={(val) => setFormData({ ...formData, currency: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TL">TL</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hire_date">{t('form.hireDate')}</Label>
                                <Input
                                    id="hire_date"
                                    type="date"
                                    value={formData.hire_date}
                                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="termination_date">{t('form.terminationDate')}</Label>
                                <Input
                                    id="termination_date"
                                    type="date"
                                    value={formData.termination_date}
                                    onChange={(e) => setFormData({ ...formData, termination_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="profile_id">{t('form.crmUser')}</Label>
                            <Select
                                value={formData.profile_id || 'none'}
                                onValueChange={(val) => setFormData({ ...formData, profile_id: val === 'none' ? null : val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('form.selectUser')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">- {t('form.selectUser')} -</SelectItem>
                                    {users.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Zimmet (Asset Tracking) section */}
                        <div className="space-y-3 pt-4 border-t">
                            <Label>{t('form.assetsLabel')}</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {['laptop', 'car', 'phone', 'peripherals'].map((asset) => (
                                    <div key={asset} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`asset-${asset}`}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 transition-colors"
                                            checked={(formData.assets as any)?.[asset] || false}
                                            onChange={(e) => {
                                                const currentAssets = formData.assets || {}
                                                setFormData({
                                                    ...formData,
                                                    assets: {
                                                        ...currentAssets,
                                                        [asset]: e.target.checked
                                                    }
                                                })
                                            }}
                                        />
                                        <label htmlFor={`asset-${asset}`} className="text-sm font-medium leading-none cursor-pointer">
                                            {t(`assets.${asset}`)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    )
}
