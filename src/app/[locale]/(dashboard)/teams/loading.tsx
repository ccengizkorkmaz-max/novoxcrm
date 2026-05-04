export default function TeamsLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-36 bg-muted rounded-md" />
                <div className="h-10 w-32 bg-muted rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-muted rounded-full" />
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-muted rounded" />
                                <div className="h-3 w-20 bg-muted rounded" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-muted rounded" />
                            <div className="h-3 w-3/4 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
