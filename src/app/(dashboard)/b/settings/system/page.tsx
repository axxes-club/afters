import { APP_VERSION } from "@/lib/constants"
import { GitBranch, Calendar, Package, FileText } from "lucide-react"
import fs from "fs"
import path from "path"

// Read changelog at build time
function getChangelog(): string {
  try {
    const historyPath = path.join(process.cwd(), "HISTORY.md")
    return fs.readFileSync(historyPath, "utf-8")
  } catch {
    return "# Changelog\n\nNo changelog available."
  }
}

// Parse changelog into sections
function parseChangelog(content: string): Array<{ version: string; date?: string; changes: string[] }> {
  const sections: Array<{ version: string; date?: string; changes: string[] }> = []
  const lines = content.split("\n")

  let currentSection: { version: string; date?: string; changes: string[] } | null = null

  for (const line of lines) {
    // Match version headers like "## 0.2.2-beta (2026-02-18)" or "## 0.2.1-beta"
    const versionMatch = line.match(/^## (\S+)(?:\s+\(([^)]+)\))?/)
    if (versionMatch) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        version: versionMatch[1],
        date: versionMatch[2],
        changes: [],
      }
    } else if (currentSection && line.startsWith("- ")) {
      currentSection.changes.push(line.substring(2))
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

export default function SettingsSystemPage() {
  const changelog = getChangelog()
  const changelogSections = parseChangelog(changelog)
  const buildDate = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">SYSTEM</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Build information and changelog</p>
      </div>

      {/* Build Info Card */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">BUILD INFO</span>
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-mono text-white/30 tracking-widest">VERSION</p>
              </div>
              <p className="text-lg font-mono font-bold">{APP_VERSION}</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <p className="text-[10px] font-mono text-white/30 tracking-widest">CHANNEL</p>
              </div>
              <p className="text-lg font-mono font-bold">BETA</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-green-400" />
                <p className="text-[10px] font-mono text-white/30 tracking-widest">BUILD DATE</p>
              </div>
              <p className="text-lg font-mono font-bold">{buildDate}</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-yellow-400" />
                <p className="text-[10px] font-mono text-white/30 tracking-widest">FRAMEWORK</p>
              </div>
              <p className="text-lg font-mono font-bold">NEXT.JS 16</p>
            </div>
          </div>
        </div>
      </div>

      {/* Changelog */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">CHANGELOG</span>
        </div>
        <div className="divide-y divide-white/5">
          {changelogSections.map((section, index) => (
            <div key={section.version} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className={`font-mono font-bold ${index === 0 ? "text-primary" : "text-white/80"}`}>
                  {section.version}
                </span>
                {section.date && (
                  <span className="text-[10px] font-mono text-white/30 px-2 py-0.5 bg-white/5">
                    {section.date}
                  </span>
                )}
                {index === 0 && (
                  <span className="text-[10px] font-mono text-primary px-2 py-0.5 bg-primary/10">
                    CURRENT
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {section.changes.map((change, changeIndex) => (
                  <li
                    key={changeIndex}
                    className="text-sm font-mono text-white/50 pl-4 border-l border-white/10"
                  >
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {changelogSections.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-white/40 font-mono text-sm">No changelog entries</p>
            </div>
          )}
        </div>
      </div>

      {/* Technical Info */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">TECHNICAL</span>
        </div>
        <div className="p-4 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/40">Runtime</span>
            <span className="text-white/60">Node.js (Vercel Edge)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/40">Database</span>
            <span className="text-white/60">PostgreSQL (Neon)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/40">Auth</span>
            <span className="text-white/60">Clerk</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/40">Payments</span>
            <span className="text-white/60">Stripe Connect</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-white/40">AI</span>
            <span className="text-white/60">Groq (Llama 3)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
