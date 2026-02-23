import Link from "next/link";
import { Metadata } from "next";
import { Key, ArrowRight, LogIn } from "lucide-react";

export const metadata: Metadata = {
  title: "Get API Access | afters",
  description: "Information on how to get API access for afters.",
};

export default function ApiAccessInfoPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-8 h-8 text-[#ff1493]" />
          <h1 className="text-4xl font-headline tracking-wide">
            Get API Access
          </h1>
        </div>
        
        <p className="text-lg text-white/60 mb-8">
          To start building with the afters API, you{"'"}ll need an organizer account and an API key.
          API keys are generated and managed within your personal dashboard.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Steps to get started:</h2>
        
        <ol className="list-decimal list-inside text-white/60 space-y-3 mb-12">
          <li>
            <strong className="text-white">Create an afters organizer account:</strong> If you don{"'"}t have one, 
            you{"'"}ll need to <Link href="/sign-up" className="text-[#ff1493] hover:underline">sign up here</Link>. 
            It{"'"}s quick and easy!
          </li>
          <li>
            <strong className="text-white">Sign in to your dashboard:</strong> Once you have an account, 
            <Link href="/sign-in" className="text-[#ff1493] hover:underline">log in to your dashboard</Link>.
          </li>
          <li>
            <strong className="text-white">Generate an API Key:</strong> Navigate to <span className="font-mono bg-white/5 px-1 py-0.5 rounded text-sm text-white/80">Settings → Security</span> 
            within your dashboard to create and manage your API keys. Remember to keep your keys secure!
          </li>
          <li>
            <strong className="text-white">Start Building:</strong> With your API key, you can now authenticate 
            requests and integrate with the afters API. Check out our comprehensive 
            <Link href="/api-docs" className="text-[#ff1493] hover:underline">API documentation</Link> for details.
          </li>
        </ol>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff1493] text-black font-mono font-bold text-sm tracking-wider hover:bg-[#ff1493]/90 transition-all"
          >
            CREATE ACCOUNT
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-mono text-sm tracking-wider hover:bg-white/5 transition-all"
          >
            <LogIn className="w-4 h-4" />
            SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
}