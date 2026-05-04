export default function DashboardHomeLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div>
                <div className="h-9 w-48 bg-muted rounded-md mb-2" />
                <div className="h-4 w-72 bg-muted rounded" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 space-y-6">
                    {/* General Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="rounded-lg border bg-card p-4">
                                <div className="h-3 w-16 bg-muted rounded mb-3" />
                                <div className="h-7 w-12 bg-muted rounded mb-1" />
                                <div className="h-2 w-full bg-muted rounded mt-2" />
                            </div>
                        ))}
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="rounded-lg border bg-card/50 p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-4 w-20 bg-muted rounded" />
                                    <div className="h-4 w-4 bg-muted rounded" />
                                </div>
                                <div className="h-8 w-16 bg-muted rounded mb-1" />
                                <div className="h-3 w-24 bg-muted rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Charts skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-lg border bg-card/50 p-6 h-72">
                            <div className="h-5 w-32 bg-muted rounded mb-4" />
                            <div className="h-full bg-muted/30 rounded" />
                        </div>
                        <div className="rounded-lg border bg-card/50 p-6 h-72">
                            <div className="h-5 w-32 bg-muted rounded mb-4" />
                            <div className="h-full bg-muted/30 rounded" />
                        </div>
                    </div>
                </div>

                {/* AI Widget skeleton */}
                <div className="xl:col-span-1">
                    <div className="rounded-lg border bg-card p-6 h-96">
                        <div className="h-5 w-24 bg-muted rounded mb-4" />
                        <div className="space-y-3">
                            <div className="h-3 w-full bg-muted rounded" />
                            <div className="h-3 w-5/6 bg-muted rounded" />
                            <div className="h-3 w-4/6 bg-muted rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
