'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Brain, Sparkles, AlertCircle, Info, ToggleLeft, ToggleRight, Phone, Facebook } from 'lucide-react'
import { toast } from 'sonner'
import { updateAiSettings, updateAiAssistantCharacter } from '../actions'
import { useTranslations } from 'next-intl'
import { MessageSquare, User, HelpCircle, Save, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface AiSettingsTabProps {
    tenant: {
        id: string
        openai_api_key?: string | null
        gemini_api_key?: string | null
        is_openai_enabled?: boolean
        is_gemini_enabled?: boolean
        gemini_model?: string | null
        openai_model?: string | null
        // New assistant fields
        ai_assistant_name?: string | null
        ai_assistant_personality?: string | null
        ai_assistant_gender?: string | null
        ai_assistant_instructions?: string | null
        // Messaging integration fields
        wa_phone_number_id?: string | null
        wa_access_token?: string | null
        fb_page_id?: string | null
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
                                <div className="space-y-2">
                                    <Label htmlFor="openai_model" className="text-xs text-slate-500">Kullanılacak Model</Label>
                                    <Select
                                        onValueChange={(val) => {
                                            const input = document.getElementById('openai_model_input') as HTMLInputElement;
                                            if (input) input.value = val;
                                        }}
                                        defaultValue={tenant.openai_model || 'gpt-4o-mini'}
                                    >
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Model Seçin" />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem value="gpt-4o-mini">GPT-4o Mini (Hızlı ve Ucuz)</SelectItem>
                                            <SelectItem value="gpt-4o">GPT-4o (En Zeki, Yüksek Maliyet)</SelectItem>
                                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Gelişmiş)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <input
                                        type="hidden"
                                        id="openai_model_input"
                                        name="openai_model"
                                        defaultValue={tenant.openai_model || 'gpt-4o-mini'}
                                    />
                                </div>
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
                                <div className="space-y-2 mt-4">
                                    <Label htmlFor="gemini_model" className="text-xs text-slate-500">Kullanılacak Model</Label>
                                    <Select
                                        onValueChange={(val) => {
                                            const input = document.getElementById('gemini_model_input') as HTMLInputElement;
                                            if (input) input.value = val;
                                        }}
                                        defaultValue={tenant.gemini_model || 'gemini-1.5-flash'}
                                    >
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Model Seçin" />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Çok Hızlı, Default)</SelectItem>
                                            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (En Zeki, Karmaşık Analiz)</SelectItem>
                                            <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Yeni Nesil, Yetki Gerekebilir)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <input
                                        type="hidden"
                                        id="gemini_model_input"
                                        name="gemini_model"
                                        defaultValue={tenant.gemini_model || 'gemini-1.5-flash'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                        {/* Messaging Integration Section */}
                        <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Link2 className="h-4 w-4 text-indigo-600" />
                                <Label className="text-base font-semibold">Mesajlaşma Entegrasyonları</Label>
                            </div>
                            <p className="text-xs text-muted-foreground -mt-2">WhatsApp ve Facebook Messenger kanallarını bağlamak için aşağıdaki bilgileri girin.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="wa_phone_number_id" className="text-xs text-slate-500 flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> WhatsApp Phone Number ID
                                    </Label>
                                    <Input
                                        id="wa_phone_number_id"
                                        name="wa_phone_number_id"
                                        defaultValue={tenant.wa_phone_number_id || ''}
                                        placeholder="Örn: 123456789012345"
                                        className="bg-white font-mono text-sm"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Meta Developer → WhatsApp → API Setup → Phone number ID</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fb_page_id" className="text-xs text-slate-500 flex items-center gap-1">
                                        <Facebook className="h-3 w-3" /> Facebook Page ID
                                    </Label>
                                    <Input
                                        id="fb_page_id"
                                        name="fb_page_id"
                                        defaultValue={tenant.fb_page_id || ''}
                                        placeholder="Örn: 26239326952374846"
                                        className="bg-white font-mono text-sm"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Facebook Sayfanızın ID'si (Messenger webhook için)</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="wa_access_token" className="text-xs text-slate-500">WhatsApp / Messenger Access Token</Label>
                                    {tenant.wa_access_token && (
                                        <span className="text-[10px] font-mono bg-white border px-2 py-0.5 rounded text-slate-500">
                                            {maskKey(tenant.wa_access_token)}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="wa_access_token"
                                    name="wa_access_token"
                                    type="password"
                                    defaultValue={tenant.wa_access_token || ''}
                                    placeholder="EAAG..."
                                    className="bg-white"
                                    autoComplete="off"
                                />
                                <p className="text-[10px] text-muted-foreground">Meta Developer → App Dashboard → Permanent Page Access Token</p>
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

                    <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700" disabled={isPending}>
                        {isPending ? 'Kaydediliyor...' : 'API Anahtarlarını Kaydet'}
                    </Button>
                </form>

                <div className="my-10 border-t border-slate-100" />

                {/* Assistant Personality Section */}
                <form
                    action={async (formData) => {
                        setIsPending(true)
                        try {
                            const res = await updateAiAssistantCharacter(formData)
                            if (res?.error) {
                                toast.error(res.error)
                            } else {
                                toast.success('Asistan karakteri başarıyla güncellendi.')
                            }
                        } catch (e: any) {
                            toast.error('Giriş yapılırken bir hata oluştu: ' + e.message)
                        } finally {
                            setIsPending(false)
                        }
                    }}
                    className="space-y-8"
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Satış Asistanı Karakteri</h3>
                                <p className="text-sm text-muted-foreground">Asistanın müşterilerle nasıl konuşacağını ve ismini belirleyin.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="ai_assistant_name" className="text-sm font-medium">Asistanın İsmi</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="ai_assistant_name"
                                        name="ai_assistant_name"
                                        defaultValue={tenant.ai_assistant_name || 'Novo AI'}
                                        placeholder="Örn: Novo AI, Selin, Kerem"
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ai_assistant_gender" className="text-sm font-medium">Asistanın Sesi / Cinsiyeti</Label>
                                <Select
                                    onValueChange={(val) => {
                                        const input = document.getElementById('gender_hidden_input') as HTMLInputElement;
                                        if (input) input.value = val;
                                    }}
                                    defaultValue={tenant.ai_assistant_gender || 'female'}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value="female">Kadın Sesi (Daha yumuşak ve nazik)</SelectItem>
                                        <SelectItem value="male">Erkek Sesi (Daha ciddi ve güven veren)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <input
                                    type="hidden"
                                    id="gender_hidden_input"
                                    name="ai_assistant_gender"
                                    defaultValue={tenant.ai_assistant_gender || 'female'}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ai_assistant_personality" className="text-sm font-medium text-slate-700">Genel Karakter ve Üslup</Label>
                            <Input
                                id="ai_assistant_personality"
                                name="ai_assistant_personality"
                                defaultValue={tenant.ai_assistant_personality || 'Kurumsal, kibar ve çözüm odaklı'}
                                placeholder="Örn: Samimi ve neşeli, Çok kurumsal ve mesafeli, Profesyonel ve hızlı"
                            />
                            <p className="text-[10px] text-muted-foreground italic">Asistanın cevap verirken takınacağı genel tavır.</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="ai_assistant_instructions" className="text-sm font-medium text-slate-700">Kurumsal Özel Talimatlar</Label>
                                <Badge variant="secondary" className="text-[10px] font-normal">Sadece {tenant.ai_assistant_name || 'Asistan'} görür</Badge>
                            </div>
                            <Textarea
                                id="ai_assistant_instructions"
                                name="ai_assistant_instructions"
                                defaultValue={tenant.ai_assistant_instructions || ''}
                                placeholder="Örn: Her zaman en düşük fiyatlı projeyi önce öner. Kocaeli'deki projemizi özellikle vurgula. Müşteriye mutlaka 'Efendim' diye hitap et."
                                className="min-h-[120px] resize-none"
                            />
                            <p className="text-[10px] text-muted-foreground">Bu talimatlar asistanın zekasına (system prompt) doğrudan eklenir.</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white min-w-[200px]" disabled={isPending}>
                            {isPending ? 'Kaydediliyor...' : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Karakteri Kaydet
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
