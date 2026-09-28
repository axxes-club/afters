'use client'

interface EventInfoSectionsProps {
  about?: string | null
  refundPolicy?: string | null
  faqs?: unknown // Accept any type since it comes from Prisma JsonValue
  className?: string
  variant?: 'default' | 'brutalist' | 'neon' | 'minimal' | 'tilt' | 'lush' | 'nice' | 'card' | 'vapor' | 'editorial'
  accentColor?: string
}

export default function EventInfoSections({
  about,
  refundPolicy,
  faqs,
  className = '',
  variant = 'default',
  accentColor = '#ff1493',
}: EventInfoSectionsProps) {
  // Safely handle faqs array
  const faqsArray = Array.isArray(faqs) ? faqs : []

  // Don't render if no content
  if (!about && !refundPolicy && faqsArray.length === 0) {
    return null
  }

  // Variant-specific styles
  const getContainerClass = () => {
    switch (variant) {
      case 'brutalist':
        return 'border-4 p-6 bg-black'
      case 'neon':
        return 'rounded-xl p-6 bg-white/5 backdrop-blur-sm border border-white/10'
      case 'minimal':
        return 'rounded-lg p-8 border border-white/5 bg-white/[0.02]'
      case 'tilt':
        return 'rounded-xl p-6 border-2 bg-white/5'
      case 'lush':
        return 'rounded-xl p-6 backdrop-blur-xl bg-white/5 border border-white/10'
      default:
        return 'rounded-xl p-6 bg-white/5 backdrop-blur-sm border border-white/10'
    }
  }

  const getTitleClass = () => {
    switch (variant) {
      case 'brutalist':
        return 'text-xl font-black uppercase tracking-wider mb-4'
      case 'neon':
        return 'text-xl font-bold mb-4'
      case 'minimal':
        return 'text-lg font-semibold mb-4 lowercase'
      case 'tilt':
        return 'text-2xl font-black uppercase mb-4 -rotate-1'
      case 'lush':
        return 'text-xl font-bold mb-4'
      default:
        return 'text-xl font-bold mb-4'
    }
  }

  const containerClass = getContainerClass()
  const titleClass = getTitleClass()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* About Section */}
      {about && (
        <div className={containerClass} style={variant === 'brutalist' ? { borderColor: accentColor } : {}}>
          <h2 className={titleClass} style={variant === 'brutalist' ? { color: accentColor } : {}}>
            About
          </h2>
          <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
            {about}
          </div>
        </div>
      )}

      {/* FAQs Section */}
      {faqsArray.length > 0 && (
        <div className={containerClass} style={variant === 'brutalist' ? { borderColor: accentColor } : {}}>
          <h2 className={titleClass} style={variant === 'brutalist' ? { color: accentColor } : {}}>
            FAQs
          </h2>
          <div className="space-y-3">
            {faqsArray.map((faq, idx) => (
              <details key={idx} className="group">
                <summary
                  className={`flex items-center justify-between cursor-pointer p-4 transition-colors ${
                    variant === 'brutalist'
                      ? 'border-2 bg-black hover:bg-white/5'
                      : 'rounded-lg bg-white/5 hover:bg-white/10'
                  }`}
                  style={variant === 'brutalist' ? { borderColor: accentColor } : {}}
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <svg
                    className="w-5 h-5 transition-transform group-open:rotate-180 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={variant === 'brutalist' ? { color: accentColor } : {}}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pt-3 pb-4 text-white/70 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Refund Policy Section */}
      {refundPolicy && (
        <div className={containerClass} style={variant === 'brutalist' ? { borderColor: accentColor } : {}}>
          <h2 className={titleClass} style={variant === 'brutalist' ? { color: accentColor } : {}}>
            Refund Policy
          </h2>
          <div className="text-white/70 whitespace-pre-wrap leading-relaxed">
            {refundPolicy}
          </div>
        </div>
      )}
    </div>
  )
}
