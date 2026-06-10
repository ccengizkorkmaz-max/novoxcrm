'use client'

import { useEffect, useRef } from 'react'

// SurveyJS imports — client-only
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react'
import 'survey-core/defaultV2.min.css'
import 'survey-creator-core/survey-creator-core.min.css'
import 'survey-creator-core/i18n/turkish'
import 'survey-core/i18n/turkish'

interface SurveyCreatorWrapperProps {
    surveyJSON?: any
    onCreatorReady: (creator: SurveyCreator) => void
}

export default function SurveyCreatorWrapper({ surveyJSON, onCreatorReady }: SurveyCreatorWrapperProps) {
    const creatorRef = useRef<SurveyCreator | null>(null)

    useEffect(() => {
        const creatorInstance = new SurveyCreator({
            showLogicTab: false,
            showTranslationTab: false,
            showEmbeddedSurveyTab: false,
            isAutoSave: false,
            showJSONEditorTab: false,
            showSidebar: true,
            questionTypes: [
                'text', 'comment', 'radiogroup', 'checkbox', 'dropdown',
                'rating', 'boolean', 'matrix', 'matrixdropdown',
                'multipletext', 'panel', 'paneldynamic', 'html',
                'imagepicker', 'ranking', 'signaturepad', 'expression'
            ]
        })
        creatorInstance.locale = 'tr'
        creatorInstance.survey.locale = 'tr'

        // NovoCRM theme
        try {
            creatorInstance.survey.applyTheme({
                isPanelless: false,
                cssVariables: {
                    '--sjs-primary-backcolor': '#2563eb',
                    '--sjs-primary-backcolor-dark': '#1d4ed8',
                    '--sjs-primary-backcolor-light': '#dbeafe',
                    '--sjs-primary-forecolor': '#ffffff',
                    '--sjs-corner-radius': '12px',
                    '--sjs-base-unit': '8px',
                    '--sjs-font-family': 'Inter, system-ui, sans-serif',
                }
            })
        } catch (e) {
            // Theme apply may fail on some versions, continue
        }

        if (surveyJSON) {
            creatorInstance.JSON = surveyJSON
        }

        creatorRef.current = creatorInstance
        onCreatorReady(creatorInstance)

        return () => {
            creatorRef.current = null
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!creatorRef.current) return <div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">Yükleniyor...</p></div>

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <SurveyCreatorComponent creator={creatorRef.current} />
        </div>
    )
}
