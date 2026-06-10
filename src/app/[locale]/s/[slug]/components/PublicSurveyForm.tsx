'use client'

import { useState, useCallback } from 'react'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
import 'survey-core/survey-core.min.css'
import 'survey-core/i18n/turkish'
import { submitSurveyResponse } from '@/app/[locale]/(dashboard)/crm/actions'
import { toast } from 'sonner'

interface PublicSurveyFormProps {
    slug: string
    questions: any // SurveyJS JSON
}

export default function PublicSurveyForm({ slug, questions }: PublicSurveyFormProps) {
    const [isSubmitted, setIsSubmitted] = useState(false)

    const survey = useCallback(() => {
        const surveyModel = new Model(questions)
        surveyModel.locale = 'tr'

        // Apply NovoCRM theme
        surveyModel.applyTheme({
            isPanelless: false,
            cssVariables: {
                '--sjs-primary-backcolor': '#2563eb',
                '--sjs-primary-backcolor-dark': '#1d4ed8',
                '--sjs-primary-backcolor-light': '#dbeafe',
                '--sjs-primary-forecolor': '#ffffff',
                '--sjs-corner-radius': '16px',
                '--sjs-base-unit': '8px',
                '--sjs-font-family': 'Inter, system-ui, sans-serif',
                '--sjs-shadow-small': '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
                '--sjs-shadow-medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                '--sjs-border-default': '#e2e8f0',
                '--sjs-general-backcolor': '#ffffff',
                '--sjs-general-backcolor-dim': '#f8fafc',
            }
        })

        // Customize completion page
        surveyModel.completedHtml = `
            <div style="text-align: center; padding: 48px 24px;">
                <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Teşekkür Ederiz!</h2>
                <p style="font-size: 14px; color: #64748b;">Yanıtlarınız başarıyla kaydedildi.</p>
            </div>
        `

        // Handle completion
        surveyModel.onComplete.add(async (sender) => {
            const answers = sender.data
            const result = await submitSurveyResponse(slug, answers)
            if (result?.error) {
                toast.error(result.error)
            } else {
                setIsSubmitted(true)
            }
        })

        return surveyModel
    }, [questions, slug])

    if (isSubmitted) {
        return null // SurveyJS will show completedHtml
    }

    return (
        <div className="surveyjs-public-wrapper">
            <Survey model={survey()} />
            <style jsx global>{`
                .surveyjs-public-wrapper {
                    max-width: 720px;
                    margin: 0 auto;
                }
                .surveyjs-public-wrapper .sd-root-modern {
                    background: transparent;
                }
                .surveyjs-public-wrapper .sd-body {
                    padding: 0;
                }
                .surveyjs-public-wrapper .sd-page {
                    padding: 0;
                }
                .surveyjs-public-wrapper .sd-question {
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 20px 24px;
                    margin-bottom: 12px;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
                    transition: box-shadow 0.2s ease;
                }
                .surveyjs-public-wrapper .sd-question:hover {
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
                }
                .surveyjs-public-wrapper .sd-btn {
                    border-radius: 16px;
                    font-weight: 700;
                    height: 48px;
                    font-size: 14px;
                }
                .surveyjs-public-wrapper .sd-footer {
                    padding: 16px 0;
                }
            `}</style>
        </div>
    )
}
