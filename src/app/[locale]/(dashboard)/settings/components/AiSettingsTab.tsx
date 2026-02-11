'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Brain, Sparkles, AlertCircle, Info, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { updateAiSettings } from '../actions'
import { useTranslations } from 'next-intl'

interface AiSettingsTabProps {
    tenant: {
        id: string
        openai_api_key?: string | null
        gemini_api_key?: string | null
        is_openai_enabled?: boolean
        is_gemini_enabled?: boolean
    }
}

export default function AiSettingsTab({ tenant }: AiSettingsTabProps) {
    const t = useTranslations('Settings')
    const [isPending, setIsPending] = useState(false)

    // Helper to mask key: Shows first 6 and last 4 chars
    const maskKey = (key?: string | null) => {
        if (!key) return null
        if (key.length <= 10) return "*******"
        return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Modül Ayarları
                </CardTitle>
                <CardDescription>
                    Sesli notları metne çevirmek ve aktivite özetleri oluşturmak için kullanılacak yapay zeka anahtarlarınızı buradan yönetebilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    action={async (formData) => {
                        setIsPending(true)
                        try {
                            const res = await updateAiSettings(formData)
                            if (res?.error) {
                                toast.error(res.error)
                            } else {
                                toast.success('AI ayarları başarıyla güncellendi.')
                            }
                        } catch (e: any) {
                            toast.error('Giriş yapılırken bir hata oluştu: ' + e.message)
                        } finally {
                            setIsPending(false)
                        }
                    }}
                    className="space-y-6"
                >
                    <div className="space-y-8">
                        {/* OpenAI Section */}
                        <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-green-600" />
                                        OpenAI Altyapısı
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Whisper ve GPT modellerini kullanır.</p>
                                </div>
                                <Switch
                                    name="is_openai_enabled"
                                    defaultChecked={tenant.is_openai_enabled ?? true}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="openai_api_key" className="text-xs text-slate-500">API Key</Label>
                                    {tenant.openai_api_key && (
                                        <span className="text-[10px] font-mono bg-white border px-2 py-0.5 rounded text-slate-500">
                                            {maskKey(tenant.openai_api_key)}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="openai_api_key"
                                    name="openai_api_key"
                                    type="password"
                                    defaultValue={tenant.openai_api_key || ''}
                                    placeholder="sk-..."
                                    className="bg-white"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Gemini Section */}
                        <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-blue-600" />
                                        Google Gemini Altyapısı
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Gemini 2.0 Flash multimodal modelini kullanır.</p>
                                </div>
                                <Switch
                                    name="is_gemini_enabled"
                                    defaultChecked={tenant.is_gemini_enabled ?? true}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="gemini_api_key" className="text-xs text-slate-500">API Key</Label>
                                    {tenant.gemini_api_key && (
                                        <span className="text-[10px] font-mono bg-white border px-2 py-0.5 rounded text-slate-500">
                                            {maskKey(tenant.gemini_api_key)}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="gemini_api_key"
                                    name="gemini_api_key"
                                    type="password"
                                    defaultValue={tenant.gemini_api_key || ''}
                                    placeholder="AIzaSy..."
                                    className="bg-white"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 shrink-0" />
                        <div className="text-xs text-blue-800 space-y-1">
                            <p className="font-semibold">Nasıl Çalışır?</p>
                            <p>Sistem önce Gemini anahtarınızı kontrol eder. Gemini tanımlıysa daha hızlı ve multimodal analiz yapar. Gemini tanımlı değilse OpenAI (Whisper + GPT) altyapısını kullanır.</p>
                            <p className="opacity-70 mt-2">Not: Bu bilgiler veritabanınızda şifrelenmeden saklanır fakat sadece yetkili kullanıcılar erişebilir.</p>
                        </div>
                    </div>

                    <Button type="submit" className="w-full md:w-auto bg-purple-600 hover:bg-purple-700" disabled={isPending}>
                        {isPending ? 'Kaydediliyor...' : 'API Anahtarlarını Kaydet'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
