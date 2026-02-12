"use client"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,20,147,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,20,147,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Scanning line effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff1493]/20 to-transparent"
          style={{
            animation: "scanLine 8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="fixed top-0 left-0 w-24 h-24 pointer-events-none">
        <div className="absolute top-4 left-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute top-4 left-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="fixed top-0 right-0 w-24 h-24 pointer-events-none">
        <div className="absolute top-4 right-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute top-4 right-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="fixed bottom-0 left-0 w-24 h-24 pointer-events-none">
        <div className="absolute bottom-4 left-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute bottom-4 left-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="fixed bottom-0 right-0 w-24 h-24 pointer-events-none">
        <div className="absolute bottom-4 right-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute bottom-4 right-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes scanLine {
          0%, 100% {
            top: -1px;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            top: 100%;
            opacity: 1;
          }
          60%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
