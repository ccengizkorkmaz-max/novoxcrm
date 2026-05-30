"use client"

import React, { useState, useRef, useEffect } from "react"
import { Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

interface MiniAudioPlayerProps {
    src: string;
    className?: string;
}

export function MiniAudioPlayer({ src, className }: MiniAudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100)
            }
        }

        const handleEnded = () => {
            setIsPlaying(false)
            setProgress(0)
        }

        audio.addEventListener('timeupdate', updateProgress)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', updateProgress)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        if (audioRef.current && audioRef.current.duration) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percentage = x / rect.width
            audioRef.current.currentTime = percentage * audioRef.current.duration
            setProgress(percentage * 100)
        }
    }

    return (
        <div 
            className={cn("flex items-center gap-2 bg-slate-100 rounded-full py-1 px-2 w-full max-w-[200px] border border-slate-200", className)}
            onClick={(e) => e.stopPropagation()}
        >
            <audio ref={audioRef} src={src} preload="none" />
            <button 
                onClick={togglePlay}
                className="w-6 h-6 shrink-0 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
            >
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </button>
            <div 
                className="flex-1 h-1.5 bg-slate-300 rounded-full cursor-pointer overflow-hidden"
                onClick={handleSeek}
            >
                <div 
                    className="h-full bg-blue-500 transition-all duration-100" 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    )
}
