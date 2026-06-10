'use client'

import { useState } from 'react'
import { submitSurveyResponse } from '@/app/[locale]/(dashboard)/crm/actions'
import { toast } from 'sonner'

interface Question {
    id: string
    type: 'select' | 'text' | 'number'
    label: string
    options?: string[]
}

interface PublicSurveyFormProps {
    slug: string
    questions: Question[]
}

export default function PublicSurveyForm({ slug, questions }: PublicSurveyFormProps) {
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const updateAnswer = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleSubmit = async () => {
        // Check if all required answered
        const unanswered = questions.filter(q => !answers[q.id] && answers[q.id] !== 0)
        if (unanswered.length > 0) {
            toast.error(`Lütfen tüm soruları yanıtlayınız. (${unanswered.length} soru eksik)`)
            return
        }

        setIsSubmitting(true)
        const result = await submitSurveyResponse(slug, answers)
        setIsSubmitting(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            setIsSubmitted(true)
        }
    }

    if (isSubmitted) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Teşekkür Ederiz!</h2>
                <p className="text-sm text-slate-500">Yanıtlarınız başarıyla kaydedildi. Size en uygun hizmeti sunmak için bu bilgileri kullanacağız.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {questions.map((q, idx) => (
                <div
                    key={q.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 transition-all hover:shadow-md"
                >
                    <div className="flex items-start gap-3 mb-3">
                        <span className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-xs font-black text-blue-600 flex-shrink-0 mt-0.5">
                            {idx + 1}
                        </span>
                        <label className="text-sm font-semibold text-slate-800">{q.label}</label>
                    </div>

                    {q.type === 'select' && q.options && (
                        <div className="grid grid-cols-2 gap-2 pl-10">
                            {q.options.map(opt => {
                                const isSelected = answers[q.id] === opt
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => updateAnswer(q.id, opt)}
                                        className={`
                                            px-4 py-2.5 rounded-xl text-sm font-medium transition-all border text-left
                                            ${isSelected
                                                ? 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-100'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
                                            }
                                        `}
                                    >
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {q.type === 'text' && (
                        <div className="pl-10">
                            <input
                                type="text"
                                value={answers[q.id] || ''}
                                onChange={(e) => updateAnswer(q.id, e.target.value)}
                                placeholder="Yanıtınızı yazın..."
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                            />
                        </div>
                    )}

                    {q.type === 'number' && (
                        <div className="pl-10">
                            <input
                                type="number"
                                min={0}
                                value={answers[q.id] ?? ''}
                                onChange={(e) => updateAnswer(q.id, e.target.value ? parseInt(e.target.value) : '')}
                                placeholder="0"
                                className="w-24 h-11 px-4 rounded-xl border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                            />
                        </div>
                    )}
                </div>
            ))}

            {/* Submit Button */}
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                        Gönderiliyor...
                    </>
                ) : (
                    'Yanıtları Gönder'
                )}
            </button>

            <p className="text-center text-[10px] text-slate-400">
                Yanıtlarınız gizli tutulacak ve sadece size daha iyi hizmet vermek için kullanılacaktır.
            </p>
        </div>
    )
}
