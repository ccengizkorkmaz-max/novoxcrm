'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ImagePlus, Loader2, Trash2, Pencil } from 'lucide-react'
import Image from 'next/image'
import { cn } from "@/lib/utils"

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        const supabase = createClient()

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('crm-images')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage
                .from('crm-images')
                .getPublicUrl(filePath)

            onChange(data.publicUrl)
        } catch (error: any) {
            console.error('Upload Error:', error)
            alert('Görsel yüklenirken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const onRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex items-center gap-4">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={onUpload}
                disabled={disabled || loading}
            />

            <div
                onClick={triggerUpload}
                className={cn(
                    "relative w-[200px] h-[130px] rounded-md border border-dashed flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                {value ? (
                    <>
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                            <Button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); triggerUpload(); }}
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-white/80 hover:bg-white"
                            >
                                <Pencil className="h-4 w-4 text-gray-700" />
                            </Button>
                            <Button
                                type="button"
                                onClick={onRemove}
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image fill src={value} alt="Upload" className="object-cover" />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                        <ImagePlus className="h-8 w-8 opacity-50" />
                        <span>Görsel Yükle</span>
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
            </div>
        </div>
    )
}
