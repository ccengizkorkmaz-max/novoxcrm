'use client'

import React, { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Check, Palette, RotateCcw, Sparkles, Eye, Monitor } from 'lucide-react'
import { updateBrandConfig, resetBrandConfig } from '../actions/brand-actions'
import { BRAND_PRESETS, DEFAULT_BRAND, UI_STYLES, type BrandConfig, type UIStyleName } from '@/lib/brand-config'
import { cn } from '@/lib/utils'

interface BrandSettingsTabProps {
    currentConfig: Partial<BrandConfig>
}

// Mini sidebar preview component
function SidebarPreview({ config }: { config: Partial<BrandConfig> }) {
    const merged = { ...DEFAULT_BRAND, ...config }
    const style = UI_STYLES[(merged.uiStyle as UIStyleName) || 'default']

    return (
        <div
            className="w-full max-w-[220px] overflow-hidden shadow-2xl border border-white/10 transition-all duration-500"
            style={{ backgroundColor: merged.sidebarBg, borderRadius: style.radius }}
        >
            <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${merged.sidebarBorder}` }}>
                <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" style={{ color: merged.primaryColor }} />
                    <span className="text-white text-xs font-bold truncate">{merged.appName}</span>
                    <span
                        className="text-[7px] font-black uppercase px-1 py-0.5"
                        style={{ backgroundColor: merged.badgeBg, color: merged.badgeText, borderRadius: style.radiusSm }}
                    >
                        {merged.badgeLabel}
                    </span>
                </div>
                <div className="mt-0.5">
                    <span className="text-[9px] text-slate-400">Firma Adınız</span>
                </div>
            </div>
            <div className="p-1.5 space-y-0.5">
                {['Genel Bakış', 'Müşteriler', 'CRM', 'Aktiviteler', 'Raporlar'].map((item, i) => (
                    <div
                        key={item}
                        className={cn("px-2 py-1 text-[9px] text-slate-300", i === 0 && "text-white font-medium")}
                        style={{ borderRadius: style.radiusSm, ...(i === 0 ? { backgroundColor: `${merged.primaryColor}20` } : {}) }}
                    >
                        <span style={i === 0 ? { color: merged.primaryColor } : {}}>● </span>{item}
                    </div>
                ))}
            </div>
            <div className="px-3 py-1.5" style={{ borderTop: `1px solid ${merged.sidebarBorder}` }}>
                <span className="text-[8px] text-slate-500">kullanici@email.com</span>
            </div>
        </div>
    )
}

// UI Style mini preview (card + buttons visualization)
function UIStylePreviewMini({ styleName }: { styleName: UIStyleName }) {
    const style = UI_STYLES[styleName]
    const isGlass = styleName === 'glass'

    return (
        <div className="w-full space-y-1.5 mt-2">
            <div
                className="p-2 border"
                style={{
                    borderRadius: style.radius,
                    boxShadow: style.shadow,
                    borderWidth: style.cardBorder,
                    backgroundColor: isGlass ? 'rgba(255,255,255,0.5)' : style.cardBg,
                    backdropFilter: isGlass ? 'blur(8px)' : undefined,
                    borderColor: isGlass ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                }}
            >
                <div className="h-1.5 w-12 bg-slate-300 mb-1" style={{ borderRadius: style.radiusSm }} />
                <div className="h-1 w-20 bg-slate-200" style={{ borderRadius: style.radiusSm }} />
            </div>
            <div className="flex gap-1">
                <div className="h-4 w-10 bg-blue-500" style={{ borderRadius: style.radiusSm }} />
                <div className="h-4 w-10 border border-slate-300 bg-white" style={{ borderRadius: style.radiusSm }} />
            </div>
        </div>
    )
}

// Color preset card
function PresetCard({ name, preset, isSelected, onSelect }: { name: string; preset: Partial<BrandConfig>; isSelected: boolean; onSelect: () => void }) {
    const merged = { ...DEFAULT_BRAND, ...preset }
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "relative group rounded-xl border-2 p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer text-left",
                isSelected ? "border-blue-500 shadow-lg shadow-blue-500/10 bg-blue-50/50" : "border-slate-200 hover:border-slate-300 bg-white"
            )}
        >
            {isSelected && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-lg z-10">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}
            <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: merged.sidebarBg }} />
                <div className="w-5 h-5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: merged.primaryColor }} />
                <div className="w-5 h-5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: merged.accentColor }} />
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-semibold text-slate-800">{merged.appName}</span>
                <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded" style={{ backgroundColor: merged.badgeBg, color: merged.badgeText }}>{merged.badgeLabel}</span>
            </div>
            <span className="text-[10px] text-slate-500 capitalize">{name} tema</span>
        </button>
    )
}

export default function BrandSettingsTab({ currentConfig }: BrandSettingsTabProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
    const [customConfig, setCustomConfig] = useState<Partial<BrandConfig>>(currentConfig || {})
    const [selectedUIStyle, setSelectedUIStyle] = useState<UIStyleName>((currentConfig?.uiStyle as UIStyleName) || 'default')
    const [showCustom, setShowCustom] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const activeConfig = selectedPreset
        ? { ...DEFAULT_BRAND, ...(BRAND_PRESETS[selectedPreset] || {}), uiStyle: selectedUIStyle }
        : { ...DEFAULT_BRAND, ...customConfig, uiStyle: selectedUIStyle }

    const handlePresetSelect = (presetName: string) => {
        setSelectedPreset(presetName)
        setShowCustom(false)
        setCustomConfig(BRAND_PRESETS[presetName] || {})
    }

    const handleSave = () => {
        startTransition(async () => {
            try {
                const configToSave = selectedPreset
                    ? { ...(BRAND_PRESETS[selectedPreset] || {}), uiStyle: selectedUIStyle }
                    : { ...customConfig, uiStyle: selectedUIStyle }
                await updateBrandConfig(configToSave)
                setMessage({ type: 'success', text: 'Tema başarıyla uygulandı! Sayfa yenileniyor...' })
                setTimeout(() => window.location.reload(), 1500)
            } catch (e: any) {
                setMessage({ type: 'error', text: e.message || 'Bir hata oluştu' })
            }
        })
    }

    const handleReset = () => {
        startTransition(async () => {
            try {
                await resetBrandConfig()
                setSelectedPreset('novo')
                setSelectedUIStyle('default')
                setCustomConfig({})
                setMessage({ type: 'success', text: 'Tema varsayılana sıfırlandı!' })
                setTimeout(() => window.location.reload(), 1500)
            } catch (e: any) {
                setMessage({ type: 'error', text: e.message || 'Bir hata oluştu' })
            }
        })
    }

    const updateCustomField = (field: keyof BrandConfig, value: string) => {
        setSelectedPreset(null)
        setCustomConfig(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                            <Palette className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle>Marka & Tema Ayarları</CardTitle>
                            <CardDescription>UI tasarım stilini ve renk paletini seçerek CRM arayüzünüzü tamamen özelleştirin.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">

                    {/* ─── UI Design Style ─── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-blue-500" />
                                <CardTitle className="text-base">UI Tasarım Stili</CardTitle>
                            </div>
                            <CardDescription className="text-xs">Arayüz bileşenlerinin genel görünümü: köşeler, gölgeler, yazı tipleri</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {(Object.entries(UI_STYLES) as [UIStyleName, typeof UI_STYLES[UIStyleName]][]).map(([key, style]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedUIStyle(key)}
                                        className={cn(
                                            "relative rounded-xl border-2 p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer text-left",
                                            selectedUIStyle === key
                                                ? "border-blue-500 shadow-lg shadow-blue-500/10 bg-blue-50/50"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        {selectedUIStyle === key && (
                                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-lg z-10">
                                                <Check className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                        <div className="text-sm font-semibold text-slate-800">{style.name}</div>
                                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{style.description}</div>
                                        <UIStylePreviewMini styleName={key} />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ─── Color Presets ─── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <CardTitle className="text-base">Renk Teması</CardTitle>
                            </div>
                            <CardDescription className="text-xs">Tek tıkla uygulanabilir profesyonel renk paletleri</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                <PresetCard name="novo" preset={{}} isSelected={selectedPreset === 'novo' || (!selectedPreset && Object.keys(currentConfig || {}).length === 0)} onSelect={() => handlePresetSelect('novo')} />
                                {Object.entries(BRAND_PRESETS).filter(([key]) => key !== 'novo').map(([name, preset]) => (
                                    <PresetCard key={name} name={name} preset={preset} isSelected={selectedPreset === name} onSelect={() => handlePresetSelect(name)} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ─── Custom Settings ─── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Palette className="h-4 w-4 text-indigo-500" />
                                    <CardTitle className="text-base">Özel Ayarlar</CardTitle>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowCustom(!showCustom)} className="text-xs">
                                    {showCustom ? 'Gizle' : 'Detaylı Ayarlar'}
                                </Button>
                            </div>
                        </CardHeader>
                        {showCustom && (
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Uygulama Adı</Label>
                                        <Input value={customConfig.appName || DEFAULT_BRAND.appName} onChange={e => updateCustomField('appName', e.target.value)} placeholder="Novo CRM" className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Badge Etiketi</Label>
                                        <Input value={customConfig.badgeLabel || DEFAULT_BRAND.badgeLabel} onChange={e => updateCustomField('badgeLabel', e.target.value)} placeholder=".dev" className="h-9" />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label className="text-xs font-medium">Logo URL (opsiyonel)</Label>
                                        <Input value={customConfig.logoUrl || ''} onChange={e => updateCustomField('logoUrl', e.target.value)} placeholder="/brands/partner/logo.svg" className="h-9" />
                                        <p className="text-[10px] text-muted-foreground">/public klasörüne logo dosyanızı yükleyin, ardından yolunu girin</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Ana Renk</Label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={customConfig.primaryColor || DEFAULT_BRAND.primaryColor} onChange={e => updateCustomField('primaryColor', e.target.value)} className="w-9 h-9 rounded border cursor-pointer" />
                                            <Input value={customConfig.primaryColor || DEFAULT_BRAND.primaryColor} onChange={e => updateCustomField('primaryColor', e.target.value)} className="h-9 font-mono text-xs" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Aksan Renk</Label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={customConfig.accentColor || DEFAULT_BRAND.accentColor} onChange={e => updateCustomField('accentColor', e.target.value)} className="w-9 h-9 rounded border cursor-pointer" />
                                            <Input value={customConfig.accentColor || DEFAULT_BRAND.accentColor} onChange={e => updateCustomField('accentColor', e.target.value)} className="h-9 font-mono text-xs" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Sidebar Arka Plan</Label>
                                        <Input value={customConfig.sidebarBg || DEFAULT_BRAND.sidebarBg} onChange={e => updateCustomField('sidebarBg', e.target.value)} className="h-9 font-mono text-xs" placeholder="rgb(2 6 23)" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Sidebar Kenar Rengi</Label>
                                        <Input value={customConfig.sidebarBorder || DEFAULT_BRAND.sidebarBorder} onChange={e => updateCustomField('sidebarBorder', e.target.value)} className="h-9 font-mono text-xs" placeholder="rgb(30 41 59)" />
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Status & Actions */}
                    {message && (
                        <div className={cn("px-4 py-3 rounded-lg text-sm font-medium", message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200")}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <Button onClick={handleSave} disabled={isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25">
                            {isPending ? (
                                <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> Uygulanıyor...</span>
                            ) : (
                                <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Temayı Uygula</span>
                            )}
                        </Button>
                        <Button variant="outline" onClick={handleReset} disabled={isPending} className="text-slate-600">
                            <RotateCcw className="h-4 w-4 mr-2" /> Varsayılana Dön
                        </Button>
                    </div>
                </div>

                {/* Right: Live Preview */}
                <div className="space-y-3">
                    <Card className="sticky top-20">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-blue-500" />
                                <CardTitle className="text-base">Canlı Önizleme</CardTitle>
                            </div>
                            <CardDescription className="text-xs">Seçtiğiniz temanın sidebar görünümü</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-4">
                            <SidebarPreview config={activeConfig} />
                        </CardContent>
                        <div className="px-6 pb-4">
                            <p className="text-[10px] text-muted-foreground text-center">
                                UI Stili: <span className="font-semibold">{UI_STYLES[selectedUIStyle].name}</span>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
