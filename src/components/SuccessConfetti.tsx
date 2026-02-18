"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
  speed: number
  drift: number
}

interface SuccessConfettiProps {
  trigger: boolean
  duration?: number
  particleCount?: number
  colors?: string[]
}

export function SuccessConfetti({
  trigger,
  duration = 3000,
  particleCount = 50,
  colors = ["#ff1493", "#00ff88", "#00d4ff", "#ffd700", "#a855f7"],
}: SuccessConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (trigger && !isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true)

      // Generate particles
      const newParticles: Particle[] = []
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
          speed: 2 + Math.random() * 3,
          drift: -1 + Math.random() * 2,
        })
      }
      setParticles(newParticles)

      // Clear after duration
      const timer = setTimeout(() => {
        setParticles([])
        setIsActive(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [trigger, isActive, particleCount, colors, duration])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute confetti-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            "--speed": `${particle.speed}s`,
            "--drift": `${particle.drift * 100}px`,
          } as React.CSSProperties}
        />
      ))}
      <style jsx>{`
        .confetti-particle {
          width: 10px;
          height: 10px;
          animation: confetti-fall var(--speed) ease-out forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) translateX(var(--drift)) rotate(720deg);
          }
        }
      `}</style>
    </div>
  )
}

// Pulse success indicator
export function SuccessPulse({ active, color = "#00ff88" }: { active: boolean; color?: string }) {
  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[90]">
      <div
        className="absolute inset-0 animate-pulse-success"
        style={{ backgroundColor: color }}
      />
      <style jsx>{`
        @keyframes pulse-success {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-pulse-success {
          animation: pulse-success 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
