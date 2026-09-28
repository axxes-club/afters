import { Resend } from 'resend'
import { escapeHtml } from './security'

// Lazy initialization to avoid build-time errors when RESEND_API_KEY is not set
let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export async function sendEmail(options: EmailOptions) {
  const from = process.env.EMAIL_FROM || "Afters <tickets@afters.am>"

  try {
    const client = getResendClient()
    const { data, error } = await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
      })),
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error }
    }

    console.log("Email sent:", data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error }
  }
}

export function generateTicketEmailHtml(data: {
  eventTitle: string
  eventDate: string
  venueName: string
  venueAddress: string
  ticketCount: number
  orderNumber: string
  walletPasses?: { ticketNumber: string; url: string }[]
}) {
  // Escape all user-supplied content to prevent XSS/HTML injection
  const safeTitle = escapeHtml(data.eventTitle)
  const safeDate = escapeHtml(data.eventDate)
  const safeVenue = escapeHtml(data.venueName)
  const safeAddress = escapeHtml(data.venueAddress)
  const safeOrderNumber = escapeHtml(data.orderNumber)

  const walletHtml = data.walletPasses?.length
    ? `
              <!-- Apple Wallet -->
              <div style="margin-top: 30px;">
                <p style="margin: 0 0 12px; color: #fff; font-size: 14px; font-weight: bold;">
                  On iPhone? Add your tickets to Apple Wallet:
                </p>
                ${data.walletPasses
                  .map(
                    (pass) => `
                <a href="${escapeHtml(pass.url)}" style="display: block; margin: 0 0 8px; padding: 12px 16px; background-color: #fff; color: #000; text-decoration: none; font-size: 14px; font-weight: bold; text-align: center; border-radius: 6px;">
                  Add to Apple Wallet${data.walletPasses!.length > 1 ? ` &middot; ${escapeHtml(pass.ticketNumber)}` : ""}
                </a>`
                  )
                  .join("")}
              </div>`
    : ""

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tickets for ${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; color: #ff1493; font-size: 48px; font-weight: bold;">
                .
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #111; border: 1px solid #222; padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">
                You're In! 🎉
              </h2>
              
              <p style="margin: 0 0 30px; color: #888; font-size: 16px; line-height: 1.6;">
                Your tickets for <strong style="color: #fff;">${safeTitle}</strong> are attached to this email.
              </p>
              
              <!-- Event Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #222;">
                    <p style="margin: 0 0 10px; color: #ff1493; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Event Details
                    </p>
                    <p style="margin: 0 0 5px; color: #fff; font-size: 18px; font-weight: bold;">
                      ${safeTitle}
                    </p>
                    <p style="margin: 0 0 5px; color: #888; font-size: 14px;">
                      📅 ${safeDate}
                    </p>
                    <p style="margin: 0 0 5px; color: #888; font-size: 14px;">
                      📍 ${safeVenue}
                    </p>
                    <p style="margin: 0; color: #666; font-size: 13px;">
                      ${safeAddress}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Ticket Count -->
              <p style="margin: 0 0 30px; color: #fff; font-size: 16px;">
                <strong>${data.ticketCount} ticket${data.ticketCount > 1 ? 's' : ''}</strong> attached as PDF
              </p>
              
              <!-- Instructions -->
              <div style="padding: 20px; background-color: #0a0a0a; border-left: 3px solid #ff1493;">
                <p style="margin: 0 0 10px; color: #fff; font-size: 14px; font-weight: bold;">
                  How to use your tickets:
                </p>
                <ol style="margin: 0; padding-left: 20px; color: #888; font-size: 14px; line-height: 1.8;">
                  <li>Download the attached PDF</li>
                  <li>Show the QR code at the door</li>
                  <li>That's it!</li>
                </ol>
              </div>
              ${walletHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="margin: 0 0 10px; color: #666; font-size: 12px;">
                Order #${safeOrderNumber}
              </p>
              <p style="margin: 0; color: #444; font-size: 11px;">
                © ${new Date().getFullYear()} Afters. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generateEventReminderEmailHtml(data: {
  eventTitle: string
  hoursUntilStart: number
  eventDate: string
  venueName: string
}) {
  const safeTitle = escapeHtml(data.eventTitle)
  const safeDate = escapeHtml(data.eventDate)
  const safeVenue = escapeHtml(data.venueName)
  const timeText = data.hoursUntilStart === 1 ? "1 hour" : `${data.hoursUntilStart} hours`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder - ${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; color: #ff1493; font-size: 48px; font-weight: bold;">
                .
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #111; border: 1px solid #222; padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">
                ⏰ ${safeTitle} starts in ${timeText}!
              </h2>
              
              <p style="margin: 0 0 30px; color: #888; font-size: 16px; line-height: 1.6;">
                This is a friendly reminder that your event is coming up soon.
              </p>
              
              <!-- Event Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #222;">
                    <p style="margin: 0 0 5px; color: #fff; font-size: 18px; font-weight: bold;">
                      ${safeTitle}
                    </p>
                    <p style="margin: 0 0 5px; color: #888; font-size: 14px;">
                      📅 ${safeDate}
                    </p>
                    <p style="margin: 0; color: #888; font-size: 14px;">
                      📍 ${safeVenue}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <a href="https://afters.am/d/events" style="display: inline-block; padding: 14px 28px; background-color: #ff1493; color: #000; text-decoration: none; font-weight: bold; font-size: 14px;">
                View Event Dashboard →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="margin: 0; color: #444; font-size: 11px;">
                © ${new Date().getFullYear()} Afters. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generateEventRescheduledEmailHtml(data: {
  eventTitle: string
  oldDate: string
  newDate: string
  venueName: string
  venueAddress: string
  eventUrl: string
  organizerMessage?: string
}) {
  const safeTitle = escapeHtml(data.eventTitle)
  const safeOldDate = escapeHtml(data.oldDate)
  const safeNewDate = escapeHtml(data.newDate)
  const safeVenue = escapeHtml(data.venueName)
  const safeAddress = escapeHtml(data.venueAddress)
  const safeEventUrl = escapeHtml(data.eventUrl)
  const safeMessage = data.organizerMessage ? escapeHtml(data.organizerMessage) : null

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} has been rescheduled</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; color: #ff1493; font-size: 48px; font-weight: bold;">
                .
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #111; border: 1px solid #222; padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #ffa500; font-size: 24px;">
                📅 Event Rescheduled
              </h2>
              
              <p style="margin: 0 0 30px; color: #888; font-size: 16px; line-height: 1.6;">
                <strong style="color: #fff;">${safeTitle}</strong> has been rescheduled to a new date.
              </p>
              
              <!-- Date Change -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #ffa500;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                          <span style="color: #888; font-size: 14px;">Old Date</span>
                          <span style="color: #ff4444; font-size: 14px; float: right; text-decoration: line-through;">${safeOldDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #888; font-size: 14px;">New Date</span>
                          <span style="color: #00ff88; font-size: 14px; float: right; font-weight: bold;">${safeNewDate}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${safeMessage ? `
              <!-- Organizer Message -->
              <div style="margin-bottom: 30px; padding: 20px; background-color: #0a0a0a; border-left: 3px solid #ff1493;">
                <p style="margin: 0 0 10px; color: #ff1493; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                  Message from the organizer
                </p>
                <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.6;">
                  ${safeMessage}
                </p>
              </div>
              ` : ''}
              
              <!-- Venue Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #222;">
                    <p style="margin: 0 0 10px; color: #ff1493; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Location
                    </p>
                    <p style="margin: 0 0 5px; color: #fff; font-size: 16px; font-weight: bold;">
                      ${safeVenue}
                    </p>
                    <p style="margin: 0; color: #666; font-size: 13px;">
                      ${safeAddress}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #888; font-size: 14px;">
                Your ticket is still valid for the new date. No action is required.
              </p>
              
              <!-- CTA -->
              <a href="${safeEventUrl}" style="display: inline-block; padding: 14px 28px; background-color: #ff1493; color: #000; text-decoration: none; font-weight: bold; font-size: 14px;">
                View Event Details →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="margin: 0; color: #444; font-size: 11px;">
                © ${new Date().getFullYear()} Afters. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generateOrganizerSaleEmailHtml(data: {
  eventTitle: string
  ticketCount: number
  amount: number
  buyerEmail: string
  orderNumber: string
}) {
  const safeTitle = escapeHtml(data.eventTitle)
  const safeBuyerEmail = escapeHtml(data.buyerEmail)
  const safeOrderNumber = escapeHtml(data.orderNumber)
  const formattedAmount = (data.amount / 100).toFixed(2)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Sale - ${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; color: #ff1493; font-size: 48px; font-weight: bold;">
                .
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #111; border: 1px solid #222; padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #00ff88; font-size: 24px;">
                💰 You made a sale!
              </h2>
              
              <p style="margin: 0 0 30px; color: #888; font-size: 16px; line-height: 1.6;">
                Someone just bought tickets for <strong style="color: #fff;">${safeTitle}</strong>
              </p>
              
              <!-- Sale Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #00ff88;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                          <span style="color: #888; font-size: 14px;">Tickets</span>
                          <span style="color: #fff; font-size: 14px; float: right; font-weight: bold;">${data.ticketCount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                          <span style="color: #888; font-size: 14px;">Amount</span>
                          <span style="color: #00ff88; font-size: 14px; float: right; font-weight: bold;">$${formattedAmount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                          <span style="color: #888; font-size: 14px;">Buyer</span>
                          <span style="color: #fff; font-size: 14px; float: right;">${safeBuyerEmail}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #888; font-size: 14px;">Order</span>
                          <span style="color: #666; font-size: 14px; float: right;">#${safeOrderNumber}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <a href="https://afters.am/d/events" style="display: inline-block; padding: 14px 28px; background-color: #ff1493; color: #000; text-decoration: none; font-weight: bold; font-size: 14px;">
                View Dashboard →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="margin: 0; color: #444; font-size: 11px;">
                © ${new Date().getFullYear()} Afters. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generateScannerCredentialsEmailHtml(data: {
  scannerName: string
  eventTitle: string
  eventDate: string
  eventVenue: string
  scannerCode: string
  scanUrl: string
}) {
  const safeName = escapeHtml(data.scannerName)
  const safeTitle = escapeHtml(data.eventTitle)
  const safeDate = escapeHtml(data.eventDate)
  const safeVenue = escapeHtml(data.eventVenue)
  const safeCode = escapeHtml(data.scannerCode)
  const safeUrl = escapeHtml(data.scanUrl)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scanner Access for ${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; color: #ff1493; font-size: 48px; font-weight: bold;">
                .
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #111; border: 1px solid #222; padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">
                Hey ${safeName}! 🎫
              </h2>
              
              <p style="margin: 0 0 30px; color: #888; font-size: 16px; line-height: 1.6;">
                You've been added as a door scanner for <strong style="color: #fff;">${safeTitle}</strong>.
              </p>
              
              <!-- Event Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #222;">
                    <p style="margin: 0 0 10px; color: #ff1493; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Event Details
                    </p>
                    <p style="margin: 0 0 5px; color: #fff; font-size: 18px; font-weight: bold;">
                      ${safeTitle}
                    </p>
                    <p style="margin: 0 0 5px; color: #888; font-size: 14px;">
                      📅 ${safeDate}
                    </p>
                    <p style="margin: 0; color: #888; font-size: 14px;">
                      📍 ${safeVenue}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Scanner Code (prominent) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px; background-color: #0a0a0a; border: 2px solid #ff1493; text-align: center;">
                    <p style="margin: 0 0 10px; color: #ff1493; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Your Scanner Code
                    </p>
                    <p style="margin: 0; color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
                      ${safeCode}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${safeUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ff1493; color: #000; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Open Scanner →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Instructions -->
              <div style="padding: 20px; background-color: #0a0a0a; border-left: 3px solid #ff1493;">
                <p style="margin: 0 0 10px; color: #fff; font-size: 14px; font-weight: bold;">
                  How to scan tickets:
                </p>
                <ol style="margin: 0; padding-left: 20px; color: #888; font-size: 14px; line-height: 1.8;">
                  <li>Open the scanner link on your phone</li>
                  <li>Enter your 6-digit code</li>
                  <li>Point your camera at ticket QR codes</li>
                </ol>
              </div>
              
              <!-- Security Note -->
              <p style="margin: 30px 0 0; color: #666; font-size: 12px; line-height: 1.6;">
                ⚠️ Keep this code private — don't share it with others. If you have any issues, contact the event organizer.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="margin: 0; color: #444; font-size: 11px;">
                © ${new Date().getFullYear()} Afters. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export async function sendScannerCredentialsEmail(data: {
  to: string
  scannerName: string
  eventTitle: string
  eventDate: string
  eventVenue: string
  scannerCode: string
  scanUrl: string
}) {
  const html = generateScannerCredentialsEmailHtml({
    scannerName: data.scannerName,
    eventTitle: data.eventTitle,
    eventDate: data.eventDate,
    eventVenue: data.eventVenue,
    scannerCode: data.scannerCode,
    scanUrl: data.scanUrl,
  })

  return sendEmail({
    to: data.to,
    subject: `You've been added as a scanner for "${data.eventTitle}"`,
    html,
  })
}
