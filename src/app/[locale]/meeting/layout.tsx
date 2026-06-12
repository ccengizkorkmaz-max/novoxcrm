export default function GuestMeetingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // No dashboard layout — clean fullscreen for guests
    return <>{children}</>
}
