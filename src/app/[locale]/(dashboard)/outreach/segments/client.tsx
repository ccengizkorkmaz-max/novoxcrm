'use client'

import { SegmentManager } from '../components/SegmentManager'

export function SegmentsPageClient({ segments, projects, profiles, tenantId, crmMode = 'basic' }: {
    segments: any[]; projects: any[]; profiles: any[]; tenantId: string; crmMode?: 'basic' | 'advance'
}) {
    return (
        <SegmentManager
            segments={segments}
            projects={projects}
            profiles={profiles}
            tenantId={tenantId}
            crmMode={crmMode}
            onClose={() => {}}
            isStandalone
        />
    )
}
