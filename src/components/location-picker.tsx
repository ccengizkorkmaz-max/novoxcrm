'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, ExternalLink } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'

interface LocationPickerProps {
    address?: string
    latitude?: number
    longitude?: number
}

export function LocationPicker({ address, latitude, longitude }: LocationPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [tempAddress, setTempAddress] = useState(address || '')
    const [tempLat, setTempLat] = useState(latitude?.toString() || '')
    const [tempLng, setTempLng] = useState(longitude?.toString() || '')

    const handleSave = () => {
        // Update the actual form fields
        const addressInput = document.querySelector('input[name="location_display"]') as HTMLInputElement
        const latInput = document.querySelector('input[name="latitude"]') as HTMLInputElement
        const lngInput = document.querySelector('input[name="longitude"]') as HTMLInputElement

        if (addressInput) addressInput.value = tempAddress
        if (latInput) latInput.value = tempLat
        if (lngInput) lngInput.value = tempLng

        setIsOpen(false)
    }

    const handleOpenMaps = () => {
        const searchQuery = tempAddress || 'Turkey'
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, '_blank')
    }

    const handleViewLocation = () => {
        if (latitude && longitude) {
            window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
        } else if (address) {
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank')
        }
    }

    return (
        <div className="flex gap-2">
            <Input
                name="location_display"
                defaultValue={address || ''}
                placeholder="Lokasyon seçilmedi"
                className="flex-1"
                readOnly
            />
            <input type="hidden" name="latitude" defaultValue={latitude || ''} />
            <input type="hidden" name="longitude" defaultValue={longitude || ''} />

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon" title="Lokasyon Düzenle">
                        <MapPin className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Lokasyon Bilgisi</DialogTitle>
                        <DialogDescription>
                            Google Maps'ten koordinatları kopyalayıp buraya yapıştırın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="temp-address">Adres</Label>
                            <Input
                                id="temp-address"
                                value={tempAddress}
                                onChange={(e) => setTempAddress(e.target.value)}
                                placeholder="Örn: Fatih, İstanbul"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="temp-lat">Enlem (Latitude)</Label>
                                <Input
                                    id="temp-lat"
                                    type="number"
                                    step="any"
                                    value={tempLat}
                                    onChange={(e) => setTempLat(e.target.value)}
                                    placeholder="41.0082"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="temp-lng">Boylam (Longitude)</Label>
                                <Input
                                    id="temp-lng"
                                    type="number"
                                    step="any"
                                    value={tempLng}
                                    onChange={(e) => setTempLng(e.target.value)}
                                    placeholder="28.9784"
                                />
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleOpenMaps}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Google Maps'te Aç
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Google Maps'te konumu bulun, koordinatlara sağ tıklayıp kopyalayın ve yukarıdaki alanlara yapıştırın.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                        >
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {(latitude && longitude) && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleViewLocation}
                    title="Google Maps'te Göster"
                >
                    Haritada Göster
                </Button>
            )}
        </div>
    )
}
