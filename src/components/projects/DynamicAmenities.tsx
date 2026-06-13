'use client'

import React, { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

const DEFAULT_AMENITIES = [
    "Yetişkin Havuzu", "Güvenlik", "Çocuk Yüzme Havuzu", "Yürüyüş Parkuru",
    "Fitness", "Çocuk oyun parkı", "Cafe", "Market", "Tenis kortu", "Basketbol sahası"
]

interface DynamicAmenitiesProps {
    selectedAmenities: string[]
}

export function DynamicAmenities({ selectedAmenities }: DynamicAmenitiesProps) {
    // Merge defaults with any custom amenities already saved on this project
    const existingCustom = selectedAmenities.filter(a => !DEFAULT_AMENITIES.includes(a))
    const [customItems, setCustomItems] = useState<string[]>(existingCustom)
    const [newItem, setNewItem] = useState('')
    const [showInput, setShowInput] = useState(false)

    const allItems = [...DEFAULT_AMENITIES, ...customItems]

    const handleAdd = () => {
        const trimmed = newItem.trim()
        if (!trimmed) return
        if (allItems.includes(trimmed)) {
            setNewItem('')
            return
        }
        setCustomItems(prev => [...prev, trimmed])
        setNewItem('')
        setShowInput(false)
    }

    const handleRemoveCustom = (item: string) => {
        setCustomItems(prev => prev.filter(i => i !== item))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
        }
        if (e.key === 'Escape') {
            setShowInput(false)
            setNewItem('')
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Projedeki Sosyal Alanlar</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs rounded-lg border-dashed hover:border-blue-400 hover:text-blue-600 transition-colors"
                    onClick={() => setShowInput(true)}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Yeni Alan Ekle
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4 border rounded-lg bg-muted/30">
                {/* Default amenities */}
                {DEFAULT_AMENITIES.map((item) => {
                    const isChecked = selectedAmenities.includes(item)
                    return (
                        <div key={item} className="flex items-center space-x-2">
                            <Checkbox id={`amenity-${item}`} name="amenities" value={item} defaultChecked={isChecked} />
                            <Label htmlFor={`amenity-${item}`} className="text-sm font-normal cursor-pointer">
                                {item}
                            </Label>
                        </div>
                    )
                })}

                {/* Custom amenities */}
                {customItems.map((item) => {
                    const isChecked = selectedAmenities.includes(item)
                    return (
                        <div key={item} className="flex items-center space-x-2 group">
                            <Checkbox id={`amenity-${item}`} name="amenities" value={item} defaultChecked={isChecked || true} />
                            <Label htmlFor={`amenity-${item}`} className="text-sm font-normal cursor-pointer text-blue-700">
                                {item}
                            </Label>
                            <button
                                type="button"
                                onClick={() => handleRemoveCustom(item)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                                title="Kaldır"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Add new amenity inline */}
            {showInput && (
                <div className="flex gap-2 items-center p-3 border border-blue-200 rounded-lg bg-blue-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Input
                        autoFocus
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Örn: SPA, Sauna, Basketbol Sahası..."
                        className="h-8 text-sm flex-1 bg-white"
                    />
                    <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                        onClick={handleAdd}
                        disabled={!newItem.trim()}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Ekle
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => { setShowInput(false); setNewItem('') }}
                    >
                        İptal
                    </Button>
                </div>
            )}
        </div>
    )
}
