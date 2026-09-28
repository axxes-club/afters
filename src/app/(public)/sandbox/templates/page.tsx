import TemplatePreview from "@/components/sandbox/TemplatePreview"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Template Sandbox | Afters",
  description: "Preview event page templates",
}

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <TemplatePreview />
    </div>
  )
}
