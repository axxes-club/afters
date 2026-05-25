"use client"

import React, { useState } from "react"
import BrutalistTemplate from "@/components/public/templates/BrutalistTemplate"
import NeonTemplate from "@/components/public/templates/NeonTemplate"
import MinimalTemplate from "@/components/public/templates/MinimalTemplate"
import TiltTemplate from "@/components/public/templates/TiltTemplate"
import LushTemplate from "@/components/public/templates/LushTemplate"
import NiceAmTemplate from "@/components/public/templates/NiceAmTemplate"
import CardTemplate from "@/components/public/templates/CardTemplate"
import VaporTemplate from "@/components/public/templates/VaporTemplate"
import EditorialTemplate from "@/components/public/templates/EditorialTemplate"

const THEMES = ['brutalist', 'neon', 'minimal', 'tilt', 'lush', 'nice', 'card', 'vapor', 'editorial']
const TYPOGRAPHIES = ['font-mono', 'font-headline', 'font-serif', 'font-sans']

export default function TemplatePreview() {
  const [theme, setTheme] = useState('neon')
  const [accentColor, setAccentColor] = useState('#ff1493')
  const [backgroundColor, setBackgroundColor] = useState('#000000')
  const [typography, setTypography] = useState('font-headline')
  const [isRsvp, setIsRsvp] = useState(false)

  // Mock Data
  const mockEvent = {
    id: 'test-event-123',
    title: 'Midnight Warehouse Experience',
    description: 'Join us for an unforgettable night featuring incredible music and atmosphere in an undisclosed warehouse location. Expect heavy bass, immersive visuals, and a community of true music lovers.',
    startsAt: new Date(Date.now() + 86400000 * 7), // 7 days from now
    venueName: 'The Industrial Complex',
    venueAddress: '123 Underground Ave',
    city: 'Brooklyn',
    state: 'NY',
    organizer: {
      displayName: 'AXES CLUB',
      logoUrl: null,
      stripeChargesEnabled: !isRsvp,
      instagramUrl: 'https://instagram.com'
    },
    flyerUrl: 'https://placehold.co/800x1200/222222/ffffff.png?text=UNDERGROUND+WAREHOUSE',
    ticketTiers: isRsvp ? [
      { id: '1', name: 'General RSVP', price: 0, quantity: 100, quantitySold: 45, description: 'Free entry before 11PM' }
    ] : [
      { id: '1', name: 'Early Bird', price: 1500, quantity: 100, quantitySold: 100, description: 'Entry anytime' },
      { id: '2', name: 'General Admission', price: 2500, quantity: 300, quantitySold: 150, description: 'Entry anytime' },
      { id: '3', name: 'VIP Access', price: 5000, quantity: 50, quantitySold: 10, description: 'Skip the line + VIP area' }
    ],
    faqs: [
      { question: 'What is the dress code?', answer: 'Come as you are. Black is always a safe bet.' },
      { question: 'Will there be tickets at the door?', answer: 'No, presale only.' }
    ],
    refundPolicy: 'No refunds unless the event is canceled.',
    about: 'We are a collective dedicated to pushing the boundaries of electronic music.'
  }

  const mockLineup = [
    { name: 'DJ SHADOW', role: 'HEADLINER', showtime: '01:00 AM', socialUrl: 'https://instagram.com' },
    { name: 'TECHNO VIPER', role: 'SUPPORT', showtime: '11:30 PM' },
    { name: 'ACID RAIN', role: 'OPENER', showtime: '10:00 PM' }
  ]

  const props = {
    event: mockEvent,
    accentColor,
    backgroundColor,
    typographyClass: typography,
    textColor: backgroundColor === '#ffffff' ? '#000000' : '#ffffff',
    accentTextColor: '#ffffff',
    dateStr: 'OCT 31',
    timeStr: '10:00 PM',
    dayStr: 'SATURDAY',
    showLocation: true,
    showMap: true,
    locationPrecision: 'exact' as const,
    mapUrl: '#',
    mapEmbedUrl: 'https://www.google.com/maps/embed/v1/place?key=MOCK_KEY&q=Brooklyn',
    rescheduledBannerElement: null,
    lowestPrice: isRsvp ? 0 : 1500,
    hasAvailability: true,
    isRsvpEvent: isRsvp,
    ctaUrl: '#',
    ctaText: isRsvp ? 'RSVP NOW' : 'GET TICKETS',
    ctaTextLower: isRsvp ? 'rsvp now' : 'get tickets',
    lineup: mockLineup,
    rsvpSpotsLeft: isRsvp ? 55 : null,
    rsvpAvailable: true,
    totalAvailable: isRsvp ? 55 : 190,
  }

  const renderTemplate = () => {
    switch (theme) {
      case 'brutalist': return <BrutalistTemplate {...props} />
      case 'neon': return <NeonTemplate {...props} />
      case 'minimal': return <MinimalTemplate {...props} />
      case 'tilt': return <TiltTemplate {...props} />
      case 'lush': return <LushTemplate {...props} />
      case 'nice': return <NiceAmTemplate {...props} />
      case 'card': return <CardTemplate {...props} />
      case 'vapor': return <VaporTemplate {...props} />
      case 'editorial': default: return <EditorialTemplate {...props} />
    }
  }

  return (
    <div>
      {/* Control Panel */}
      <div className="fixed top-4 right-4 z-[9999] bg-neutral-900/90 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl w-80 text-white font-sans">
        <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
          <span>Sandbox</span>
          <span className="text-xs font-normal text-white/50 px-2 py-1 bg-white/10 rounded-md">Local Testing</span>
        </h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Theme</label>
            <select 
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg p-2 text-white"
            >
              {THEMES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Typography</label>
            <select 
              value={typography}
              onChange={e => setTypography(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg p-2 text-white"
            >
              {TYPOGRAPHIES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Accent Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input 
                type="text" 
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="flex-1 bg-black border border-white/20 rounded-lg p-2 text-white uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Background Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={backgroundColor}
                onChange={e => setBackgroundColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input 
                type="text" 
                value={backgroundColor}
                onChange={e => setBackgroundColor(e.target.value)}
                className="flex-1 bg-black border border-white/20 rounded-lg p-2 text-white uppercase font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4 pt-4 border-t border-white/10">
            <input 
              type="checkbox" 
              checked={isRsvp}
              onChange={e => setIsRsvp(e.target.checked)}
              className="rounded bg-black border-white/20"
            />
            <span>RSVP Event Mode</span>
          </label>
        </div>
      </div>

      {/* Template View */}
      {renderTemplate()}
    </div>
  )
}
