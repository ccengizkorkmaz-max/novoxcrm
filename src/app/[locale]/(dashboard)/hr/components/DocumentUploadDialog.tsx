"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from '@/lib/supabase/client'
import { addEmployeeDocument } from '../actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DocumentUploadDialogProps {
    employeeId: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export default function DocumentUploadDialog({ employeeId, isOpen, onOpenChange }: DocumentUploadDialogProps) {
    const t = useTranslations('HR')
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fileName, setFileName] = useState('')
    const [file, setFile] = useState<File | null>(null)

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !fileName) return

        setLoading(true)
        try {
            const supabase = createClient()

            // 1. Upload file to storage
            const fileExt = file.name.split('.').pop()
            const filePath = `${employeeId}/${Math.random()}.${fileExt}`

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('hr-documents')
                .upload(filePath, file)

            if (uploadError) {
                if (uploadError.message.includes('bucket not found')) {
                    throw new Error('Supabase Storage bucket "hr-documents" not found. Please create it in Supabase Dashboard.')
                }
                throw uploadError
            }

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('hr-documents')
                .getPublicUrl(filePath)

            // 3. Save reference to database
            await addEmployeeDocument({
                employee_id: employeeId,
                file_name: fileName,
                file_url: publicUrl
            })

            toast.success(t('messages.successUpdate'))
            onOpenChange(false)
            router.refresh()
            setFileName('')
            setFile(null)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || t('messages.error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('form.addDocument')}</DialogTitle>
                    <DialogDescription>
                        Personel için yeni bir döküman veya özlük belgesi yükleyin.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="docName">{t('form.documentName')}</Label>
                        <Input
                            id="docName"
                            required
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Örn: Kimlik Fotokopisi, Sözleşme..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="docFile">{t('form.file')}</Label>
                        <Input
                            id="docFile"
                            type="file"
                            required
                            onChange={(e) => {
                                const selected = e.target.files?.[0]
                                if (selected) {
                                    setFile(selected)
                                    if (!fileName) setFileName(selected.name.split('.')[0])
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || !file}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('form.saveDocument')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
