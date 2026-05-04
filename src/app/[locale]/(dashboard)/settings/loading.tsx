export default function SettingsLoading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-8 w-32 bg-muted rounded-md" />
            <div className="rounded-lg border bg-card p-6 space-y-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-10 w-full bg-muted rounded-md" />
                    </div>
                ))}
                <div className="h-10 w-28 bg-muted rounded-md" />
            </div>
        </div>
    )
}
