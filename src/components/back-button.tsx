'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
    href?: string
    label?: string
    className?: string
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
    iconType?: "chevron" | "arrow"
}

export function BackButton({
    href,
    label,
    className,
    variant = "ghost",
    size = "sm",
    iconType = "arrow"
}: BackButtonProps) {
    const router = useRouter()

    const handleBack = () => {
        // Preference: router.back() to keep filters/state
        // If href is provided, it can be used as a fallback or explicit override 
        // (but user requested "previous page")
        if (typeof window !== 'undefined' && window.history.length > 2) {
            router.back()
        } else if (href) {
            router.push(href)
        } else {
            router.back()
        }
    }

    const Icon = iconType === "chevron" ? ChevronLeft : ArrowLeft

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleBack}
            className={cn("gap-2", className)}
        >
            <Icon className={cn("h-4 w-4", size === "icon" && "h-5 w-5")} />
            {label && <span>{label}</span>}
            {!label && size !== "icon" && <span>Geri Dön</span>}
        </Button>
    )
}
