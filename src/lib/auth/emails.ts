import { sendEmail } from "@/lib/email"

type CodeType = "sign-in" | "email-verification" | "forget-password" | "change-email"

const COPY: Record<CodeType, { subject: string; line: string }> = {
  "sign-in": { subject: "Your afters sign-in code", line: "Use this code to sign in to afters." },
  "email-verification": { subject: "Verify your email for afters", line: "Use this code to verify your email." },
  "forget-password": { subject: "Reset your afters password", line: "Use this code to choose a new password." },
  "change-email": { subject: "Confirm your new email for afters", line: "Use this code to confirm your new email." },
}

/** A one-time code. Plain and short: it is read on a phone at the door as often as not. */
export async function sendAuthCodeEmail(email: string, otp: string, type: CodeType) {
  const { subject, line } = COPY[type]
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
    // Local development without email: the code goes to the server log instead.
    console.log(`[auth] ${type} code for ${email}: ${otp}`)
    return
  }
  const result = await sendEmail({
    to: email,
    subject,
    html: `<!doctype html><html><body style="margin:0;background:#000;color:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">
<div style="max-width:420px;margin:0 auto;padding:40px 24px">
<p style="color:#ff1493;font-size:32px;margin:0 0 24px">.</p>
<p style="color:rgba(255,255,255,.7);font-size:14px;margin:0 0 16px">${line}</p>
<p style="font-size:32px;letter-spacing:8px;margin:0 0 24px">${otp}</p>
<p style="color:rgba(255,255,255,.4);font-size:12px;margin:0">It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>
</div></body></html>`,
  })
  if (!result.success) throw new Error("Could not send the code email")
}
