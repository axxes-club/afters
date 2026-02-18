"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Key, Smartphone, Clock, ExternalLink } from "lucide-react"

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      {/* Authentication */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg font-mono flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Authentication
          </CardTitle>
          <CardDescription>
            Your account is secured via Clerk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Managed via your authentication provider
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://accounts.clerk.dev/user" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Manage
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add extra security to your account
                </p>
              </div>
            </div>
            <Badge variant="secondary">Via Clerk</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg font-mono flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Devices where you&apos;re currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Session management</p>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
              View and manage your sessions via Clerk
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://accounts.clerk.dev/user" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Manage Sessions
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="text-lg font-mono text-green-300">Security Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-green-300/80">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Use a strong, unique password for your account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Enable two-factor authentication when available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Keep your API keys secure and never share them publicly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Revoke API keys that are no longer in use</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
