'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Save, ChevronDown, ChevronRight, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

interface FieldOption {
    id?: string
    field_name: string
    field_label: string
    options: string[]
}

const DEFAULT_FIELDS: FieldOption[] = [
    { field_name: 'unit_category', field_label: 'Ünite Türü', options: ['Daire', 'Depo', 'Dükkan', 'Ofis', 'Villa', 'Dubleks Daire', 'Bahçe Dubleks Daire', 'Çatı Dubleks Daire', 'Roof Daire', 'Loft Daire', 'Penthouse', 'Ticari Alan'] },
    { field_name: 'type', field_label: 'Oda Tipi', options: ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1', 'Villa', 'Commercial'] },
    { field_name: 'parking_type', field_label: 'Otopark', options: ['Kapalı Otopark', 'Açık Otopark', 'Yok'] },
    { field_name: 'heating_type', field_label: 'Isıtma', options: ['Kombi', 'Kombi Yerden Isıtma', 'Merkezi Sistem', 'Merkezi Sistem Yerden Isıtma', 'Klima'] },
    { field_name: 'kitchen_type', field_label: 'Mutfak Tipi', options: ['Kapalı Mutfak', 'Açık Mutfak'] },
    { field_name: 'features', field_label: 'Özellikler', options: ['Balkon', 'Teras', 'Ebeveyn Banyosu', 'Giyinme Odası', 'Akıllı Ev Sistemi', 'Yerden Isıtma', 'Ankastre Set', 'Klima'] },
]

export default function UnitFieldOptionsTab({ fieldOptions }: { fieldOptions: FieldOption[] }) {
    const [fields, setFields] = useState<FieldOption[]>(
        fieldOptions.length > 0 ? fieldOptions : DEFAULT_FIELDS
    )
    const [expandedField, setExpandedField] = useState<string | null>(null)
    const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    const addOption = (fieldName: string) => {
        const val = newOptionInputs[fieldName]?.trim()
        if (!val) return

        setFields(prev => prev.map(f => {
            if (f.field_name === fieldName) {
                if (f.options.includes(val)) {
                    toast.error('Bu değer zaten mevcut')
                    return f
                }
                return { ...f, options: [...f.options, val] }
            }
            return f
        }))
        setNewOptionInputs(prev => ({ ...prev, [fieldName]: '' }))
    }

    const removeOption = (fieldName: string, option: string) => {
        setFields(prev => prev.map(f => {
            if (f.field_name === fieldName) {
                return { ...f, options: f.options.filter(o => o !== option) }
            }
            return f
        }))
    }

    const saveAll = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings/unit-field-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields })
            })
            const data = await res.json()
            if (data.error) {
                toast.error(data.error)
            } else {
                toast.success('Alan tanımları kaydedildi')
            }
        } catch (err) {
            toast.error('Kayıt sırasında hata oluştu')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5" />
                            Ünite Alan Tanımları
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Ünite formlarındaki seçimlik alanların değerlerini buradan yönetin
                        </CardDescription>
                    </div>
                    <Button onClick={saveAll} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {fields.map((field) => {
                    const isExpanded = expandedField === field.field_name
                    return (
                        <div key={field.field_name} className="border rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setExpandedField(isExpanded ? null : field.field_name)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                    <span className="font-bold text-sm text-slate-800">{field.field_label}</span>
                                    <Badge variant="secondary" className="text-[10px]">{field.options.length} değer</Badge>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{field.field_name}</span>
                            </button>

                            {isExpanded && (
                                <div className="p-4 pt-0 border-t bg-slate-50/50">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {field.options.map((opt) => (
                                            <Badge key={opt} variant="outline" className="pl-3 pr-1 py-1.5 text-xs bg-white flex items-center gap-1.5 group">
                                                {opt}
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(field.field_name, opt)}
                                                    className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Yeni değer ekle..."
                                            value={newOptionInputs[field.field_name] || ''}
                                            onChange={(e) => setNewOptionInputs(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(field.field_name) } }}
                                            className="flex-1 h-9 bg-white"
                                        />
                                        <Button type="button" size="sm" variant="outline" onClick={() => addOption(field.field_name)} className="h-9">
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Ekle
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
