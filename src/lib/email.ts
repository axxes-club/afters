import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const { data, error } = await resend.emails.send({
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
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tickets for ${data.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: bold;">
                AFTERS<span style="color: #ff1493;">.</span>
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
                Your tickets for <strong style="color: #fff;">${data.eventTitle}</strong> are attached to this email.
              </p>
              
              <!-- Event Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #222;">
                    <p style="margin: 0 0 10px; color: #ff1493; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Event Details
                    </p>
                    <p style="margin: 0 0 5px; color: #fff; font-size: 18px; font-weight: bold;">
                      ${data.eventTitle}
                    </p>
                    <p style="margin: 0 0 5px; color: #888; font-size: 14px;">
                      📅 ${data.eventDate}
                    </p>
                    <p style="margin: 0 0 5px; color: #888; font-size: 14px;">
                      📍 ${data.venueName}
                    </p>
                    <p style="margin: 0; color: #666; font-size: 13px;">
                      ${data.venueAddress}
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
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="margin: 0 0 10px; color: #666; font-size: 12px;">
                Order #${data.orderNumber}
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
