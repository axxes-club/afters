"use client"

import { useEffect, useState } from "react"
import { Key, LogOut, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient, signOut, useUser } from "@/lib/auth/client"
import { UserButton } from "./session"

/** Account, password and sessions, on Settings → Security. */
export function AccountSecurity() {
  const { user } = useUser()
  const [providers, setProviders] = useState<string[] | null>(null)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    authClient.listAccounts().then(({ data }) => setProviders(data?.map((a) => a.providerId) ?? []))
  }, [])

  const hasPassword = providers?.includes("credential") ?? false

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true })
    setBusy(false)
    if (error) return toast.error(error.code === "INVALID_PASSWORD" ? "Current password is wrong" : error.message || "Couldn't change the password")
    setCurrent("")
    setNext("")
    toast.success("Password changed. Other devices were signed out.")
  }

  async function sendCode() {
    if (!user) return
    setBusy(true)
    const { error } = await authClient.emailOtp.requestPasswordReset({ email: user.email })
    setBusy(false)
    if (error) return toast.error(error.message || "Couldn't send the code")
    setCodeSent(true)
    toast.success(`Code sent to ${user.email}`)
  }

  async function setPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    const { error } = await authClient.emailOtp.resetPassword({ email: user.email, otp: code.trim(), password: next })
    if (error) {
      setBusy(false)
      return toast.error(error.message || "Couldn't set the password")
    }
    // Setting a password signs every device out, this one included; sign straight back in.
    await authClient.signIn.email({ email: user.email, password: next })
    setBusy(false)
    setProviders((p) => [...(p ?? []), "credential"])
    setCode("")
    setNext("")
    setCodeSent(false)
    toast.success("Password set")
  }

  return (
    <>
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">ACCOUNT</span>
        </div>
        <div className="p-4 flex items-center gap-3">
          <UserButton className="w-10 h-10" />
          <div className="min-w-0">
            <p className="text-sm font-mono truncate">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Your account"}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
          {providers?.includes("axxes") && (
            <span className="ml-auto text-[10px] font-mono text-white/30 px-2 py-1 bg-white/5">AXXES LINKED</span>
          )}
        </div>
      </div>

      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">PASSWORD</span>
        </div>
        <div className="p-4">
          {providers === null ? (
            <Loader2 className="w-4 h-4 animate-spin text-white/30" />
          ) : hasPassword ? (
            <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="current-password" className="text-xs font-mono text-white/50">Current password</Label>
                <Input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-mono text-white/50">New password</Label>
                <Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={next} onChange={(e) => setNext(e.target.value)} />
              </div>
              <Button type="submit" size="sm" disabled={busy} className="text-xs">
                {busy ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Key className="w-3 h-3 mr-1.5" />}
                Change
              </Button>
            </form>
          ) : codeSent ? (
            <form onSubmit={setPassword} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-mono text-white/50">Code from your email</Label>
                <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-mono text-white/50">New password</Label>
                <Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={next} onChange={(e) => setNext(e.target.value)} />
              </div>
              <Button type="submit" size="sm" disabled={busy} className="text-xs">
                {busy && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Set password
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-white/40">You sign in with AXXES or an email code. You can add a password too.</p>
              <Button variant="outline" size="sm" disabled={busy} onClick={sendCode} className="text-xs shrink-0">
                <Mail className="w-3 h-3 mr-1.5" />
                Add a password
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">SESSIONS</span>
        </div>
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/40">Signed in somewhere you don&apos;t recognize?</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={async () => {
                const { error } = await authClient.revokeOtherSessions()
                if (error) toast.error("Couldn't sign out other devices")
                else toast.success("Other devices signed out")
              }}
            >
              Sign out other devices
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => void signOut("/")}>
              <LogOut className="w-3 h-3 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
