export default function CommissionsLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-36 bg-muted rounded-md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-6">
                        <div className="h-4 w-20 bg-muted rounded mb-3" />
                        <div className="h-8 w-28 bg-muted rounded" />
                    </div>
                ))}
            </div>
            <div className="rounded-md border bg-card p-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4 py-4 border-b border-muted/50">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-4 w-20 bg-muted rounded ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    )
}
