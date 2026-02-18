export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {/* Content - navigation handled by main dashboard sidebar */}
      {children}
    </div>
  )
}
