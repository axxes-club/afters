import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Centered logo */}
      <main className="flex-1 flex items-center justify-center">
        <h1 className="text-3xl font-bold font-display tracking-tight">
          AFTERS<span className="text-[#ff1493]">.</span>
        </h1>
      </main>

      <Footer />
    </div>
  )
}
