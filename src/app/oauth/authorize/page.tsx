"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Shield, AlertTriangle, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface AppInfo {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  websiteUrl: string | null
  isVerified: boolean
}

interface ScopeInfo {
  name: string
  description: string
}

const SCOPE_INFO: Record<string, ScopeInfo> = {
  'read:profile': { name: 'Read Profile', description: 'View your basic profile info' },
  'read:events': { name: 'Read Events', description: 'View your events' },
  'write:events': { name: 'Manage Events', description: 'Create and modify events' },
  'read:orders': { name: 'Read Orders', description: 'View ticket sales' },
  'read:tickets': { name: 'Read Tickets', description: 'View ticket info' },
  'write:tickets': { name: 'Check In', description: 'Check in tickets' },
  'read:guestlist': { name: 'Read Guestlist', description: 'View guestlist' },
  'write:guestlist': { name: 'Manage Guestlist', description: 'Modify guestlist' },
  'read:analytics': { name: 'Analytics', description: 'View event analytics' },
  'webhooks': { name: 'Webhooks', description: 'Manage webhooks' },
}

export default function OAuthAuthorizePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [app, setApp] = useState<AppInfo | null>(null)
  const [scopes, setScopes] = useState<string[]>([])
  
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const scope = searchParams.get('scope')
  const state = searchParams.get('state')
  const responseType = searchParams.get('response_type')
  const codeChallenge = searchParams.get('code_challenge')
  const codeChallengeMethod = searchParams.get('code_challenge_method')
  
  useEffect(() => {
    const validateRequest = async () => {
      if (!clientId || !redirectUri) {
        setError('Missing required parameters: client_id and redirect_uri')
        setLoading(false)
        return
      }
      
      if (responseType && responseType !== 'code') {
        setError('Invalid response_type. Only "code" is supported.')
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch(`/api/oauth/authorize/validate?${new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: scope || '',
        })}`)
        
        const data = await response.json()
        
        if (!response.ok) {
          if (data.loginUrl) {
            window.location.href = data.loginUrl
            return
          }
          setError(data.error || 'Invalid authorization request')
          setLoading(false)
          return
        }
        
        setApp(data.app)
        setScopes(data.scopes)
        setLoading(false)
      } catch {
        setError('Failed to validate authorization request')
        setLoading(false)
      }
    }
    
    validateRequest()
  }, [clientId, redirectUri, scope, responseType])
  
  const handleAuthorize = async (approved: boolean) => {
    if (!clientId || !redirectUri) return
    
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          redirectUri,
          scopes,
          state,
          codeChallenge,
          codeChallengeMethod,
          approved,
        }),
      })
      
      const data = await response.json()
      
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else if (data.error) {
        setError(data.error)
        setSubmitting(false)
      }
    } catch {
      setError('Failed to process authorization')
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-lg font-mono font-bold text-white mb-2">AUTHORIZATION ERROR</h1>
          <p className="text-white/40 text-sm font-mono mb-6">{error}</p>
          <Button variant="outline" onClick={() => router.push('/b')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }
  
  if (!app) return null
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-white/10 bg-white/[0.02] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ff1493]/20 to-transparent p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black border border-white/10 flex items-center justify-center">
              {app.logoUrl ? (
                <Image src={app.logoUrl} alt={app.name} width={40} height={40} className="rounded" />
              ) : (
                <span className="text-xl font-mono font-bold text-[#ff1493]">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                {app.name}
                {app.isVerified && (
                  <Shield className="w-4 h-4 text-[#ff1493]" />
                )}
              </h1>
              {app.websiteUrl && (
                <p className="text-xs text-white/40 font-mono">{new URL(app.websiteUrl).hostname}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-white/60 text-sm font-mono mb-6">
            <span className="text-white">{app.name}</span> wants to access your afters account
          </p>
          
          {/* Scopes */}
          <div className="space-y-2 mb-6">
            <p className="text-[10px] font-mono text-white/40 tracking-widest mb-3">PERMISSIONS</p>
            {scopes.map((scope) => {
              const info = SCOPE_INFO[scope]
              if (!info) return null
              return (
                <div key={scope} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5">
                  <Check className="w-4 h-4 text-[#ff1493] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-mono text-white">{info.name}</p>
                    <p className="text-xs text-white/40">{info.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Warning for unverified */}
          {!app.isVerified && (
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-mono text-yellow-400">Unverified App</p>
                <p className="text-xs text-yellow-400/60">Only authorize apps you trust</p>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleAuthorize(false)}
              disabled={submitting}
            >
              <X className="w-4 h-4 mr-2" />
              Deny
            </Button>
            <Button
              className="flex-1 bg-[#ff1493] hover:bg-[#ff1493]/80 text-black"
              onClick={() => handleAuthorize(true)}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Authorize
                </>
              )}
            </Button>
          </div>
          
          <p className="text-[10px] text-white/30 text-center mt-6 font-mono">
            You can revoke access anytime from Settings → Security
          </p>
        </div>
      </div>
    </div>
  )
}
