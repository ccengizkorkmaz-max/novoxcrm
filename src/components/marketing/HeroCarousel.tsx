'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Brain, Target, Mic, BarChart3, Sparkles, LayoutGrid, FileText, Settings2 } from 'lucide-react'

const slides = [
    {
        id: 1,
        title: "AI Akıllı Eşleşme",
        description: "Müşteri taleplerini saniyeler içinde en uygun mülkle eşleştirin, nedenini AI açıklasın.",
        image: "/images/crm akıllı eşleşme.png",
        icon: Sparkles,
        color: "indigo"
    },
    {
        id: 2,
        title: "Görsel Envanter Yönetimi",
        description: "Tüm projeyi, blokları ve üniteleri canlı matris görünümüyle anlık takip edin.",
        image: "/images/Envanter Grid.png",
        icon: LayoutGrid,
        color: "emerald"
    },
    {
        id: 3,
        title: "Dijital Sözleşme Akışı",
        description: "Karmaşık satış süreçlerini yalın, hatasız ve hızlı bir dijital forma dönüştürün.",
        image: "/images/otomatik sözleşme oluşturma.png",
        icon: FileText,
        color: "blue"
    },
    {
        id: 4,
        title: "AI Komuta Merkezi",
        description: "Yapay zeka modellerini ve API anahtarlarınızı tek merkezden güvenle yönetin.",
        image: "/images/ayarlar.png",
        icon: Settings2,
        color: "violet"
    }
]

export function HeroCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            handleNext()
        }, 6000)
        return () => clearInterval(timer)
    }, [currentIndex])

    const handleNext = () => {
        setDirection(1)
        setCurrentIndex((prev) => (prev + 1) % slides.length)
    }

    const handlePrev = () => {
        setDirection(-1)
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    }

    return (
        <div className="relative mx-auto max-w-6xl mt-12 group">
            {/* Visual Frame */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-2 shadow-[0_0_50px_rgba(37,99,235,0.15)] backdrop-blur-xl ring-1 ring-white/10 overflow-hidden">

                {/* Content Overlay - Labels */}
                <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-2 pointer-events-none pr-12">
                    {slides.map((slide, idx) => {
                        const Icon = slide.icon
                        const isActive = currentIndex === idx
                        return (
                            <div
                                key={slide.id}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${isActive
                                        ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-900/40'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-50'
                                    }`}
                            >
                                <Icon size={12} className={isActive ? 'text-blue-400' : ''} />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{slide.title}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Main Carousel Area */}
                <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden bg-slate-950/50 shadow-inner">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.5 }
                            }}
                            className="absolute inset-0"
                        >
                            <img
                                src={slides[currentIndex].image}
                                alt={slides[currentIndex].title}
                                className="w-full h-full object-contain bg-slate-950/50 opacity-90 transition-all duration-700"
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Shadow edges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20 pointer-events-none" />
                </div>

                {/* Text Description Overlay */}
                <div className="absolute bottom-12 left-6 z-20 max-w-md pointer-events-none hidden md:block">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl"
                    >
                        <h4 className="text-white font-bold mb-1">{slides[currentIndex].title}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">{slides[currentIndex].description}</p>
                    </motion.div>
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-12 md:w-12 rounded-full bg-slate-900/50 border border-slate-700 text-white flex items-center justify-center hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-12 md:w-12 rounded-full bg-slate-900/50 border border-slate-700 text-white flex items-center justify-center hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Progress Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 transition-all duration-500 rounded-full ${currentIndex === idx ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
