'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ href }: { href?: string }) {
    const router = useRouter()

    const handleBack = () => {
        if (href) {
            router.push(href)
        } else {
            router.back()
        }
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Geri</span>
        </Button>
    )
}
