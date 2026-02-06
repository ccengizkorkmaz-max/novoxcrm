"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    User, Mail, Phone, Briefcase, Calendar, MapPin,
    ShieldCheck, FileText, Trash2, Plus, Download,
    ArrowLeft, Edit2, Wallet
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePathname } from '@/i18n/routing'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { deleteEmployeeDocument } from '../actions'
import DocumentUploadDialog from './DocumentUploadDialog'

interface EmployeeProfileProps {
    employee: any
    documents: any[]
}

export default function EmployeeProfile({ employee, documents }: EmployeeProfileProps) {
    const t = useTranslations('HR')
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('personal')
    const [isUploadOpen, setIsUploadOpen] = useState(false)

    const handleDeleteDoc = async (docId: string) => {
        if (confirm(t('messages.confirmDelete'))) {
            await deleteEmployeeDocument(docId, employee.id)
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('form.cancel')}
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`${employee.id}/edit`)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        {t('table.actions.edit')}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <Card className="w-full md:w-[300px] h-fit">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="flex h-24 w-24 mb-4 items-center justify-center rounded-full bg-muted">
                            <User className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold">{employee.first_name} {employee.last_name}</h2>
                        <p className="text-sm text-muted-foreground mb-4">{employee.department || '-'}</p>
                        <Badge variant={employee.status === 'Active' ? 'secondary' : 'outline'}>
                            {t(`form.${employee.status.toLowerCase()}`)}
                        </Badge>

                        <div className="w-full mt-6 space-y-3 text-left">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{employee.email || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{employee.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span>{employee.sicil_no || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{employee.region || '-'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex-1">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="personal">{t('tabs.personal')}</TabsTrigger>
                            <TabsTrigger value="assets">{t('tabs.assets')}</TabsTrigger>
                            <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="personal" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">{t('tabs.personal')}</CardTitle>
                                    <CardDescription>İş ve ücret detayları</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">{t('form.manager')}</p>
                                        <p className="font-medium">
                                            {employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">{t('form.hireDate')}</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{employee.hire_date ? format(new Date(employee.hire_date), 'dd MMMM yyyy', { locale: tr }) : '-'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">{t('form.salary')}</p>
                                        <div className="flex items-center gap-2">
                                            <Wallet className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-bold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: employee.currency || 'TL' }).format(employee.salary || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">{t('form.crmUser')}</p>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                            <span>{employee.user_id ? 'Eşleştirildi' : 'Atanmadı'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="assets" className="mt-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{t('tabs.assets')}</CardTitle>
                                        <CardDescription>Personele zimmetlenen araç gereçler</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {['laptop', 'car', 'phone', 'peripherals'].map((assetKey) => (
                                            <div key={assetKey} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={employee.assets && employee.assets[assetKey] ? 'secondary' : 'outline'} className="rounded-full h-2 w-2 p-0" />
                                                    <span className="font-medium">{t(`assets.${assetKey}`)}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {employee.assets && employee.assets[assetKey] ? 'Zimmetli' : 'Teslim Edilmedi'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="documents" className="mt-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{t('tabs.documents')}</CardTitle>
                                        <CardDescription>Özlük belgeleri ve dökümanlar</CardDescription>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => setIsUploadOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('form.addDocument')}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {documents.length === 0 ? (
                                            <p className="text-sm text-center text-muted-foreground py-8">{t('form.noDocuments')}</p>
                                        ) : (
                                            documents.map((doc) => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border group hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-blue-600" />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{doc.document_name}</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {format(new Date(doc.created_at), 'dd.MM.yyyy HH:mm')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                            <a href={doc.file_url} target="_blank" rel="noreferrer">
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDoc(doc.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <DocumentUploadDialog
                employeeId={employee.id}
                isOpen={isUploadOpen}
                onOpenChange={setIsUploadOpen}
            />
        </div>
    )
}
