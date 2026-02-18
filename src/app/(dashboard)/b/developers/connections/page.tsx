"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Link2, X, Shield, Calendar, Cube, Loader2, Globe } from "lucide-react"
import { toast } from "sonner"

interface Connection {
  id: string
  app: {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    websiteUrl: string | null
    isVerified: boolean
  }
  scopes: string[]
  createdAt: string
  updatedAt: string
}

const SCOPE_LABELS: Record<string, string> = {
  "read:profile": "Profile",
  "read:events": "Events (read)",
  "write:events": "Events (write)",
  "read:orders": "Orders",
  "read:tickets": "Tickets",
  "write:tickets": "Check-in",
  "read:guestlist": "Guestlist (read)",
  "write:guestlist": "Guestlist (write)",
  "read:analytics": "Analytics",
  "webhooks": "Webhooks",
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  
  useEffect(() => {
    fetchConnections()
  }, [])
  
  async function fetchConnections() {
    try {
      const res = await fetch("/api/oauth/connections")
      const data = await res.json()
      if (data.success) {
        setConnections(data.data)
      }
    } catch (error) {
      console.error("Error fetching connections:", error)
      toast.error("Failed to load connections")
    } finally {
      setLoading(false)
    }
  }
  
  async function handleRevoke(connection: Connection) {
    setRevoking(connection.id)
    try {
      const res = await fetch(`/api/oauth/connections/${connection.id}`, { method: "DELETE" })
      if (res.ok) {
        setConnections(prev => prev.filter(c => c.id !== connection.id))
        toast.success(`Disconnected ${connection.app.name}`)
      } else {
        toast.error("Failed to revoke access")
      }
    } catch {
      toast.error("Failed to revoke access")
    } finally {
      setRevoking(null)
    }
  }
  
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">CONNECTED APPS</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Apps you&apos;ve authorized to access your account</p>
      </div>
      
      {/* Connections List */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">AUTHORIZED APPS</span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-white/20" />
          </div>
        ) : connections.length === 0 ? (
          <div className="p-8 text-center">
            <Link2 className="w-6 h-6 mx-auto text-white/10 mb-2" />
            <p className="text-white/40 font-mono text-xs">No connected apps</p>
            <p className="text-white/20 font-mono text-[10px] mt-1">
              When you authorize third-party apps, they&apos;ll appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {connections.map((connection) => (
              <div key={connection.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center">
                        {connection.app.logoUrl ? (
                          <img src={connection.app.logoUrl} alt="" className="w-6 h-6 rounded" />
                        ) : (
                          <Cube className="w-4 h-4 text-[#ff1493]" />
                        )}
                      </div>
                      <div>
                        <span className="font-mono text-sm text-white flex items-center gap-1.5">
                          {connection.app.name}
                          {connection.app.isVerified && <Shield className="w-3.5 h-3.5 text-[#ff1493]" />}
                        </span>
                        {connection.app.description && (
                          <p className="text-[10px] text-white/30">{connection.app.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] text-white/30 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Connected {formatDate(connection.createdAt)}
                      </div>
                      {connection.app.websiteUrl && (
                        <a
                          href={connection.app.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-white"
                        >
                          <Globe className="w-3 h-3" />
                          {new URL(connection.app.websiteUrl).hostname}
                        </a>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {connection.scopes.map(scope => (
                        <Badge key={scope} variant="secondary" className="text-[9px] bg-white/5 border-0 px-1.5 py-0">
                          {SCOPE_LABELS[scope] || scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={revoking === connection.id}
                        className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      >
                        {revoking === connection.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Access</AlertDialogTitle>
                        <AlertDialogDescription>
                          Disconnect &quot;{connection.app.name}&quot;? It will no longer be able to access your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRevoke(connection)} className="bg-red-600 hover:bg-red-700">
                          Revoke Access
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
