"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Sparkles } from "lucide-react"

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
          BILLING
        </h1>
        <p className="text-white/40 text-sm font-mono mt-1">
          Manage your subscription and payments
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-[#ff1493]/30 bg-[#ff1493]/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-mono flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#ff1493]" />
                Beta Access
              </CardTitle>
              <CardDescription>
                You&apos;re using Afters during our beta period
              </CardDescription>
            </div>
            <Badge className="bg-[#ff1493]/20 text-[#ff1493] border-[#ff1493]/30">
              Free
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              During beta, all features are free. We&apos;ll notify you before any pricing changes.
            </p>
            <div className="p-4 bg-black/20 rounded-lg space-y-2">
              <p className="text-sm font-medium">Included in Beta:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Unlimited events</li>
                <li>✓ Unlimited tickets</li>
                <li>✓ Aftie AI assistant</li>
                <li>✓ Check-in scanners</li>
                <li>✓ Analytics dashboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg font-mono flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Manage your payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No payment methods required</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Payment setup will be available when beta ends
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
