'use client'

import { SegmentManager } from '../components/SegmentManager'

export function SegmentsPageClient({ segments, projects, profiles, tenantId }: {
    segments: any[]; projects: any[]; profiles: any[]; tenantId: string
}) {
    return (
        <SegmentManager
            segments={segments}
            projects={projects}
            profiles={profiles}
            tenantId={tenantId}
            onClose={() => {}}
            isStandalone
        />
    )
}
