"use client"

import { useState, useRef, useCallback } from "react"
import { Volume2, Check, Play, Square } from "lucide-react"
import { toast } from "sonner"

const SCANNER_SOUNDS = [
  { id: "basic", name: "BASIC AF", description: "Simple beep" },
  { id: "lightsaber", name: "LIGHTSABER", description: "Swoosh" },
  { id: "pewpew", name: "PEW PEW", description: "Laser blast" },
  { id: "farts", name: "FARTS", description: "You asked for it" },
  { id: "ding", name: "DING", description: "Classic bell" },
  { id: "cashregister", name: "CASH REGISTER", description: "Ka-ching!" },
]

// Web Audio API sound generation
function createAudioContext() {
  return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
}

function playSound(soundId: string) {
  // Use audio files for farts and pewpew
  if (soundId === "farts" || soundId === "pewpew") {
    const audio = new Audio(`/sounds/${soundId === "farts" ? "fart" : "pewpew"}.mp3`)
    audio.volume = 0.7
    audio.play().catch(() => {})
    return
  }

  const ctx = createAudioContext()
  const now = ctx.currentTime

  switch (soundId) {
    case "basic": {
      // Simple beep
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = "sine"
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.start(now)
      osc.stop(now + 0.15)
      break
    }
    case "lightsaber": {
      // Lightsaber swoosh
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1)
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.3)
      filter.type = "lowpass"
      filter.frequency.value = 2000
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
      osc.start(now)
      osc.stop(now + 0.4)
      break
    }
    case "ding": {
      // Classic bell ding
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      const gain2 = ctx.createGain()
      osc.connect(gain)
      osc2.connect(gain2)
      gain.connect(ctx.destination)
      gain2.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = 830
      osc2.type = "sine"
      osc2.frequency.value = 1660
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
      gain2.gain.setValueAtTime(0.2, now)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
      osc.start(now)
      osc2.start(now)
      osc.stop(now + 0.8)
      osc2.stop(now + 0.4)
      break
    }
    case "cashregister": {
      // Cash register ka-ching
      // First the mechanical click
      const noise = ctx.createBufferSource()
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length)
      }
      noise.buffer = noiseBuffer
      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = "highpass"
      noiseFilter.frequency.value = 1000
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.3
      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start(now)

      // Then the bell ding
      const bell1 = ctx.createOscillator()
      const bell2 = ctx.createOscillator()
      const bellGain1 = ctx.createGain()
      const bellGain2 = ctx.createGain()
      bell1.type = "sine"
      bell1.frequency.value = 2000
      bell2.type = "sine"
      bell2.frequency.value = 2500
      bell1.connect(bellGain1)
      bell2.connect(bellGain2)
      bellGain1.connect(ctx.destination)
      bellGain2.connect(ctx.destination)
      bellGain1.gain.setValueAtTime(0.3, now + 0.05)
      bellGain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
      bellGain2.gain.setValueAtTime(0.15, now + 0.05)
      bellGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      bell1.start(now + 0.05)
      bell2.start(now + 0.05)
      bell1.stop(now + 0.5)
      bell2.stop(now + 0.3)
      break
    }
  }

  // Close context after sounds finish
  setTimeout(() => ctx.close(), 1000)
}

interface ScannerSoundSelectorProps {
  eventId: string
  initialSound?: string
}

export function ScannerSoundSelector({
  eventId,
  initialSound = "basic",
}: ScannerSoundSelectorProps) {
  const [selectedSound, setSelectedSound] = useState(initialSound)
  const [saving, setSaving] = useState(false)
  const [playingSound, setPlayingSound] = useState<string | null>(null)

  const previewSound = useCallback((soundId: string) => {
    setPlayingSound(soundId)
    playSound(soundId)
    setTimeout(() => setPlayingSound(null), 500)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannerSound: selectedSound }),
      })

      if (res.ok) {
        toast.success("Scanner sound saved!")
      } else {
        toast.error("Failed to save sound")
      }
    } catch {
      toast.error("Failed to save sound")
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = selectedSound !== initialSound

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-orange-500/30 bg-orange-500/5 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <span className="text-xs font-mono text-white/60 tracking-widest">SCANNER SOUND</span>
            <p className="text-[10px] font-mono text-white/30">Sound played on successful check-in</p>
          </div>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-[#ff1493] text-black text-[10px] font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all disabled:opacity-50"
          >
            {saving ? "SAVING..." : "SAVE"}
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SCANNER_SOUNDS.map((sound) => {
            const isSelected = selectedSound === sound.id
            const isPlaying = playingSound === sound.id

            return (
              <div
                key={sound.id}
                className={`
                  relative border-2 transition-all cursor-pointer group
                  ${isSelected
                    ? "border-orange-400 bg-orange-400/5"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }
                `}
              >
                {/* Selection checkmark */}
                {isSelected && (
                  <div className="absolute -top-px -right-px w-5 h-5 bg-orange-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}

                <button
                  onClick={() => setSelectedSound(sound.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="font-mono text-xs font-bold tracking-wide mb-0.5">
                    {sound.name}
                  </div>
                  <div className="text-[10px] text-white/40">
                    {sound.description}
                  </div>
                </button>

                {/* Preview button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    previewSound(sound.id)
                  }}
                  className={`
                    absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center
                    transition-all
                    ${isPlaying
                      ? "bg-orange-400 text-black"
                      : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                    }
                  `}
                >
                  {isPlaying ? (
                    <Square className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Export the playSound function for use in the scanner
export { playSound, SCANNER_SOUNDS }
