"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Mail, MessageSquare, Ticket, Calendar } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
          NOTIFICATIONS
        </h1>
        <p className="text-white/40 text-sm font-mono mt-1">
          Choose what notifications you receive
        </p>
      </div>

      {/* Email Notifications */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg font-mono flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose what emails you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Ticket className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="ticket-sales" className="font-medium">Ticket Sales</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone buys a ticket
                </p>
              </div>
            </div>
            <Switch id="ticket-sales" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="event-reminders" className="font-medium">Event Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders before your events start
                </p>
              </div>
            </div>
            <Switch id="event-reminders" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="marketing" className="font-medium">Product Updates</Label>
                <p className="text-sm text-muted-foreground">
                  News about new features and improvements
                </p>
              </div>
            </div>
            <Switch id="marketing" />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg font-mono flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Browser and mobile notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Coming soon</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Push notifications will be available in a future update
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
