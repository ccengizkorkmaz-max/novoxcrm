import { Metadata } from 'next'
import { getPublicSurvey } from '@/app/[locale]/(dashboard)/crm/actions'
import PublicSurveyForm from './components/PublicSurveyForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const survey = await getPublicSurvey(slug)
    return {
        title: survey?.survey_templates?.title || 'Anket',
        description: survey?.survey_templates?.description || 'Müşteri anketi',
        robots: 'noindex, nofollow'
    }
}

export default async function PublicSurveyPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const survey = await getPublicSurvey(slug)

    if (!survey) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-700">Anket Bulunamadı</h1>
                    <p className="text-sm text-slate-500">Bu anket mevcut değil veya süresi dolmuş olabilir.</p>
                </div>
            </div>
        )
    }

    const template = survey.survey_templates
    // SurveyJS JSON — pages with elements
    const surveyJSON = template?.questions || {}

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{template?.title || 'Anket'}</h1>
                    {template?.description && (
                        <p className="text-sm text-slate-500 mt-2">{template.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-3">
                        Size en uygun hizmeti sunabilmemiz için lütfen birkaç dakikanızı ayırın.
                    </p>
                </div>

                <PublicSurveyForm slug={slug} questions={surveyJSON} />

                <p className="text-center text-[10px] text-slate-400 mt-6">
                    Yanıtlarınız gizli tutulacak ve sadece size daha iyi hizmet vermek için kullanılacaktır.
                </p>
            </div>
        </div>
    )
}
