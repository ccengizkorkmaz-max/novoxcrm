export default function ProjectsLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-32 bg-muted rounded-md" />
                <div className="h-10 w-32 bg-muted rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="rounded-lg border bg-card overflow-hidden">
                        <div className="h-40 bg-muted" />
                        <div className="p-4 space-y-3">
                            <div className="h-5 w-3/4 bg-muted rounded" />
                            <div className="h-3 w-1/2 bg-muted rounded" />
                            <div className="flex gap-2">
                                <div className="h-6 w-16 bg-muted rounded-full" />
                                <div className="h-6 w-16 bg-muted rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
