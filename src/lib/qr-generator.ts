import QRCodeStyling from "qr-code-styling"

// Generate a branded QR code for a ticket
export async function generateBrandedQR(
  ticketId: string,
  options?: {
    size?: number
    isTestTicket?: boolean
  }
): Promise<Buffer> {
  const size = options?.size || 300
  const isTest = options?.isTestTicket || false

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    type: "svg",
    data: ticketId,
    dotsOptions: {
      color: isTest ? "#ff8c00" : "#ffffff", // Orange for test, white for real
      type: "rounded",
    },
    cornersSquareOptions: {
      color: "#ff1493", // Hot pink corners
      type: "extra-rounded",
    },
    cornersDotOptions: {
      color: "#ff1493",
      type: "dot",
    },
    backgroundOptions: {
      color: "#000000", // Black background
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 10,
    },
  })

  // Get as buffer
  const rawData = await qrCode.getRawData("png")
  if (!rawData) {
    throw new Error("Failed to generate QR code")
  }
  
  // Handle both Blob and Buffer types
  if (rawData instanceof Buffer) {
    return rawData
  }
  return Buffer.from(await rawData.arrayBuffer())
}

// Generate QR code as data URL for client-side display
export function generateQRDataUrl(ticketId: string, isTestTicket = false): string {
  // This returns a placeholder - actual generation happens server-side
  // Client will fetch from /api/tickets/[ticketId]/qr
  return `/api/tickets/${ticketId}/qr${isTestTicket ? '?test=1' : ''}`
}
