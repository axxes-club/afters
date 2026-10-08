"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Turnstile } from "@/components/Turnstile"
import { authClient } from "@/lib/auth/client"
import { safeReturnPath } from "@/lib/auth/redirect"

/**
 * The afters sign-in and sign-up card. One surface for every way in:
 * "Continue with AXXES", email + password, and a code by email.
 */

type Step =
  | { kind: "password" }
  | { kind: "code"; purpose: "sign-in" | "email-verification" }
  | { kind: "forgot" }
  | { kind: "reset" }
  | { kind: "sign-up" }

const label = "block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-2"
const input =
  "w-full bg-black border border-white/15 px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/25 outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493]/30 rounded-none"
const primary =
  "w-full flex items-center justify-center gap-2 bg-[#ff1493] hover:bg-[#ff1493]/90 disabled:opacity-60 text-black font-mono font-bold uppercase tracking-wider text-sm py-3 rounded-none transition-colors"
const secondary =
  "w-full flex items-center justify-center gap-2 border border-white/15 bg-white/[0.03] hover:bg-white/[0.07] hover:border-[#ff1493]/40 text-white font-mono text-sm py-3 rounded-none transition-colors"
const link = "text-[#ff1493] hover:text-[#ff1493]/80 font-mono"

function messageFor(error: { code?: string; message?: string; status?: number } | null | undefined): string {
  switch (error?.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match."
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "There's already an account with this email. Sign in instead."
    case "INVALID_OTP":
      return "That code isn't right. Check it and try again."
    case "OTP_EXPIRED":
      return "That code has expired. Send a new one."
    case "TOO_MANY_ATTEMPTS":
      return "Too many tries with that code. Send a new one."
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters."
  }
  if (error?.status === 429) return "Too many attempts. Wait a minute and try again."
  if (error?.status === 403 && error.message) return error.message
  return error?.message || "Something went wrong. Try again."
}

export function AuthCard({
  mode,
  axxesEnabled,
  notice,
  turnstileSiteKey,
}: {
  mode: "sign-in" | "sign-up"
  axxesEnabled: boolean
  notice?: string
  turnstileSiteKey?: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const returnTo = safeReturnPath(params.get("redirect_url"))

  const [step, setStep] = useState<Step>(mode === "sign-up" ? { kind: "sign-up" } : { kind: "password" })
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(notice ?? null)
  const [info, setInfo] = useState<string | null>(null)

  const done = () => {
    router.replace(returnTo)
    router.refresh()
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  const sendCode = (type: "sign-in" | "email-verification" | "forget-password") =>
    authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type })

  const onPassword = (e: React.FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const { error } = await authClient.signIn.email({ email: email.trim(), password })
      if (!error) return done()
      if (error.code === "EMAIL_NOT_VERIFIED") {
        await sendCode("email-verification")
        setCode("")
        setStep({ kind: "code", purpose: "email-verification" })
        setInfo(`Verify your email first. We sent a code to ${email.trim()}.`)
        return
      }
      setError(messageFor(error))
    })
  }

  const onRequestCode = () => {
    if (!email.trim()) return setError("Enter your email first.")
    void run(async () => {
      const { error } = await sendCode("sign-in")
      if (error) return setError(messageFor(error))
      setCode("")
      setStep({ kind: "code", purpose: "sign-in" })
      setInfo(`If there's an afters account for ${email.trim()}, a code is on its way.`)
    })
  }

  const onCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (step.kind !== "code") return
    void run(async () => {
      const otp = code.trim()
      const { error } =
        step.purpose === "sign-in"
          ? await authClient.signIn.emailOtp({ email: email.trim(), otp })
          : await authClient.emailOtp.verifyEmail({ email: email.trim(), otp })
      if (error) return setError(messageFor(error))
      done()
    })
  }

  const onForgot = (e: React.FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const { error } = await authClient.emailOtp.requestPasswordReset({ email: email.trim() })
      if (error) return setError(messageFor(error))
      setCode("")
      setPassword("")
      setStep({ kind: "reset" })
      setInfo(`If there's an afters account for ${email.trim()}, a code is on its way.`)
    })
  }

  const onReset = (e: React.FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const { error } = await authClient.emailOtp.resetPassword({ email: email.trim(), otp: code.trim(), password })
      if (error) return setError(messageFor(error))
      const signedIn = await authClient.signIn.email({ email: email.trim(), password })
      if (signedIn.error) {
        setStep({ kind: "password" })
        setInfo("Password changed. Sign in with it now.")
        return
      }
      done()
    })
  }

  const onSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (turnstileSiteKey && !captcha) return setError("Wait for the check below to finish, then try again.")
    void run(async () => {
      const { error } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim() || email.trim().split("@")[0],
        fetchOptions: captcha ? { headers: { "x-captcha-response": captcha } } : undefined,
      })
      // A Turnstile token works once.
      setCaptcha(null)
      setCaptchaKey((k) => k + 1)
      if (error) return setError(messageFor(error))
      setCode("")
      setStep({ kind: "code", purpose: "email-verification" })
      setInfo(`We sent a code to ${email.trim()}. Enter it to finish.`)
    })
  }

  const heading =
    step.kind === "sign-up"
      ? "Create your afters account"
      : step.kind === "code"
        ? "Check your email"
        : step.kind === "forgot" || step.kind === "reset"
          ? "Reset your password"
          : "Sign in to afters"

  const startAxxes = `/api/auth/axxes/start${returnTo !== "/b" ? `?redirect_url=${encodeURIComponent(returnTo)}` : ""}`

  return (
    <div className="w-full max-w-md border border-white/10 bg-black shadow-2xl shadow-[#ff1493]/5">
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-center text-white font-mono text-xl tracking-wider">{heading}</h1>

        {(step.kind === "password" || step.kind === "sign-up") && axxesEnabled && (
          <>
            {/* A plain link: the start route redirects to Handshake. */}
            <a href={startAxxes} className={`${secondary} mt-6`}>
              Continue with AXXES
            </a>
            <div className="my-6 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-white/30 font-mono text-xs">or</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}
        {!((step.kind === "password" || step.kind === "sign-up") && axxesEnabled) && <div className="h-6" />}

        {error && (
          <p role="alert" className="mb-4 border border-[#ff1493]/30 bg-[#ff1493]/10 px-3 py-2 text-sm font-mono text-[#ff1493]">
            {error}
          </p>
        )}
        {info && !error && (
          <p role="status" className="mb-4 border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-mono text-white/70">
            {info}
          </p>
        )}

        {step.kind === "password" && (
          <form onSubmit={onPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className={label}>Password</label>
                <button type="button" className={`${link} text-[11px]`} onClick={() => { setError(null); setInfo(null); setStep({ kind: "forgot" }) }}>
                  Forgot password?
                </button>
              </div>
              <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </div>
            <button type="submit" disabled={busy} className={primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
            <button type="button" disabled={busy} onClick={onRequestCode} className={`${link} block w-full text-center text-xs pt-1`}>
              Email me a sign-in code instead
            </button>
          </form>
        )}

        {step.kind === "code" && (
          <form onSubmit={onCode} className="space-y-4">
            <div>
              <label htmlFor="code" className={label}>6-digit code</label>
              <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${input} text-center text-lg tracking-[0.5em]`} />
            </div>
            <button type="submit" disabled={busy} className={primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" className={link} onClick={() => { setError(null); setInfo(null); setStep(mode === "sign-up" ? { kind: "sign-up" } : { kind: "password" }) }}>
                Back
              </button>
              <button type="button" disabled={busy} className={link} onClick={() => void run(async () => { const { error } = await sendCode(step.purpose); if (error) setError(messageFor(error)); else setInfo(`New code sent to ${email.trim()}.`) })}>
                Send a new code
              </button>
            </div>
          </form>
        )}

        {step.kind === "forgot" && (
          <form onSubmit={onForgot} className="space-y-4">
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </div>
            <button type="submit" disabled={busy} className={primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Email me a code
            </button>
            <button type="button" className={`${link} block w-full text-center text-xs`} onClick={() => { setError(null); setInfo(null); setStep({ kind: "password" }) }}>
              Back to sign in
            </button>
          </form>
        )}

        {step.kind === "reset" && (
          <form onSubmit={onReset} className="space-y-4">
            <div>
              <label htmlFor="code" className={label}>6-digit code</label>
              <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${input} text-center text-lg tracking-[0.5em]`} />
            </div>
            <div>
              <label htmlFor="new-password" className={label}>New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </div>
            <button type="submit" disabled={busy} className={primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Set password and sign in
            </button>
          </form>
        )}

        {step.kind === "sign-up" && (
          <form onSubmit={onSignUp} className="space-y-4">
            <div>
              <label htmlFor="name" className={label}>Name</label>
              <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className={label}>Password</label>
              <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
              <p className="mt-1.5 text-[11px] font-mono text-white/30">At least 8 characters.</p>
            </div>
            {turnstileSiteKey && <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha(null)} className="flex justify-center" />}
            <button type="submit" disabled={busy} className={primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Create account
            </button>
          </form>
        )}
      </div>

      <div className="border-t border-white/10 bg-white/[0.02] px-8 py-4 text-center text-sm font-mono text-white/40">
        {mode === "sign-in" ? (
          <>Don&apos;t have an account? <Link href="/sign-up" className={link}>Sign up</Link></>
        ) : (
          <>Already have an account? <Link href={returnTo !== "/b" ? `/sign-in?redirect_url=${encodeURIComponent(returnTo)}` : "/sign-in"} className={link}>Sign in</Link></>
        )}
      </div>
    </div>
  )
}
