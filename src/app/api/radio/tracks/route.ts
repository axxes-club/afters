import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const tracksDirectory = path.join(process.cwd(), "public", "afters-radio-tracks")
    
    // Check if directory exists
    if (!fs.existsSync(tracksDirectory)) {
      return NextResponse.json({ tracks: [] })
    }

    const files = fs.readdirSync(tracksDirectory)

    // Filter for audio files (mp3, wav, ogg, etc.)
    const tracks = files.filter(file => 
      /\.(mp3|wav|ogg|m4a|flac|aiff)$/i.test(file)
    ).map(file => `/afters-radio-tracks/${file}`)

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("Error reading radio tracks:", error)
    return NextResponse.json({ tracks: [] }, { status: 500 })
  }
}
