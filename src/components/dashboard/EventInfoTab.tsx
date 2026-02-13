'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

interface EventInfoTabProps {
  eventId: string
  initialAbout?: string | null
  initialRefundPolicy?: string | null
  initialFaqs?: FAQ[] | null
}

export default function EventInfoTab({
  eventId,
  initialAbout = '',
  initialRefundPolicy = '',
  initialFaqs = [],
}: EventInfoTabProps) {
  const [about, setAbout] = useState(initialAbout || '')
  const [refundPolicy, setRefundPolicy] = useState(initialRefundPolicy || '')
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs || [])
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index))
  }

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]
    newFaqs[index][field] = value
    setFaqs(newFaqs)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      // Filter out empty FAQs
      const validFaqs = faqs.filter(faq => faq.question.trim() && faq.answer.trim())

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          about: about.trim() || null,
          refundPolicy: refundPolicy.trim() || null,
          faqs: validFaqs.length > 0 ? validFaqs : null,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')

      setSaveMessage('Saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Failed to save:', error)
      setSaveMessage('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* About Section */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          About
          <span className="text-white/40 font-normal ml-2">Optional</span>
        </label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Tell attendees more about this event..."
          className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-y"
        />
        <p className="text-xs text-white/40 mt-1">
          Provide detailed information about the event, what to expect, special features, etc.
        </p>
      </div>

      {/* FAQs Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-white/80">
              FAQs
              <span className="text-white/40 font-normal ml-2">Optional</span>
            </label>
            <p className="text-xs text-white/40 mt-1">
              Answer common questions attendees might have
            </p>
          </div>
          <button
            onClick={addFaq}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add FAQ
          </button>
        </div>

        <div className="space-y-4">
          {faqs.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-lg text-white/40 text-sm">
              No FAQs yet. Click "Add FAQ" to create one.
            </div>
          ) : (
            faqs.map((faq, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                      placeholder="Question"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      placeholder="Answer"
                      className="w-full h-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-y"
                    />
                  </div>
                  <button
                    onClick={() => removeFaq(index)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Refund Policy Section */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Refund Policy
          <span className="text-white/40 font-normal ml-2">Optional</span>
        </label>
        <textarea
          value={refundPolicy}
          onChange={(e) => setRefundPolicy(e.target.value)}
          placeholder="Explain your refund and cancellation policy..."
          className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-y"
        />
        <p className="text-xs text-white/40 mt-1">
          Be clear about refund eligibility, deadlines, and process. Example: "Full refund up to 7 days before the event. No refunds within 7 days of the event date."
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {saveMessage && (
          <span
            className={`text-sm ${
              saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  )
}
