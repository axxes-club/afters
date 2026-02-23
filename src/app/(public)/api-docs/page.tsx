"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
// Import lucide-react icons if needed for header/footer (from original developers page)
// No specific lucide-react icons needed for the header of the docs page itself,
// as the original header only uses "afters docs" text and an external link icon.

// export const metadata: Metadata = { // Removed metadata export
//   title: "API Documentation | afters",
//   description: "API documentation for afters - event ticketing for the underground",
// };

export default function ApiDocsPage() {
  const mainRef = useRef<HTMLElement>(null);
  const [activeHash, setActiveHash] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;

      const sections = mainRef.current.querySelectorAll('section[id]');
      let currentHash = '';

      sections.forEach(section => {
        // Get the top position of the section relative to the viewport
        const top = section.getBoundingClientRect().top;
        // If the section's top is within the viewport and above a certain offset (e.g., 100px from top)
        // this section is considered active. We iterate downwards, so the last one satisfying
        // this condition will be the active one.
        if (top <= 100) { 
          currentHash = section.getAttribute('id') || '';
        }
      });
      setActiveHash(currentHash);
    };

    // Attach scroll listener
    window.addEventListener('scroll', handleScroll);
    // Call initially to set active section on page load
    handleScroll(); 

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-inter">
      {/* Header - Adapted from the original api-docs.html and general project style */}
      <header className="border-b border-white/10 py-6 px-4 md:px-8 sticky top-0 bg-black bg-opacity-90 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-headline tracking-wide">
            <span className="w-3 h-3 bg-[#ff1493] rounded-full"></span>
            afters <span className="text-white/60 font-inter font-normal">docs</span>
          </Link>
          <nav className="flex gap-6">
            <a href="https://afters.am" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors text-sm uppercase tracking-widest">website</a>
            <a href="https://github.com/axxes-club/afters" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors text-sm uppercase tracking-widest">github</a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] min-h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="lg:border-r lg:border-white/10 p-6 lg:sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto hidden lg:block"> {/* Adjusted top for sticky header height */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Getting Started</h3>
            <ul className="space-y-2">
              <li><a href="#introduction" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'introduction' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Introduction</a></li>
              <li><a href="#authentication" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'authentication' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Authentication</a></li>
              <li><a href="#errors" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'errors' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Error Handling</a></li>
              <li><a href="#rate-limits" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'rate-limits' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Rate Limits</a></li>
            </ul>
          </div>
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Events</h3>
            <ul className="space-y-2">
              <li><a href="#list-events" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'list-events' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>List Events</a></li>
              <li><a href="#get-event" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'get-event' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Get Event</a></li>
              <li><a href="#create-event" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'create-event' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Create Event</a></li>
              <li><a href="#update-event" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'update-event' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Update Event</a></li>
            </ul>
          </div>
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Event Series</h3>
            <ul className="space-y-2">
              <li><a href="#list-series" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'list-series' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>List Series</a></li>
              <li><a href="#get-series" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'get-series' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Get Series</a></li>
              <li><a href="#create-series" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'create-series' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Create Series</a></li>
              <li><a href="#generate-occurrences" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'generate-occurrences' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Generate Occurrences</a></li>
            </ul>
          </div>
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Tickets</h3>
            <ul className="space-y-2">
              <li><a href="#list-tickets" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'list-tickets' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>List Tickets</a></li>
              <li><a href="#check-ins" className={`block px-4 py-1.5 text-sm rounded-md transition-colors ${activeHash === 'check-ins' ? 'bg-[#ff1493]/10 text-[#ff1493] border-l-2 border-[#ff1493]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>Check-in History</a></li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main ref={mainRef} className="p-6 md:p-8 max-w-3xl lg:max-w-none mx-auto">
          <h1 className="text-4xl font-light mb-2">afters <span className="text-[#ff1493]">API</span></h1>
          <p className="text-lg text-white/60 mb-12">integrate with the underground</p>

          <section id="introduction" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Introduction</h2>
            <p className="text-white/60 mb-4">
              The afters API allows you to programmatically manage events, access ticket data, 
              and integrate with your own systems. All endpoints return JSON and use standard 
              HTTP response codes.
            </p>
            <p className="text-white/60 mb-4">
              Base URL: <code className="font-mono text-sm bg-white/5 px-2 py-1 rounded border border-white/10">https://afters.am/api/v1</code>
            </p>
          </section>

          <section id="authentication" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Authentication</h2>
            <p className="text-white/60 mb-4">
              Authenticate requests using an API key in the <code className="font-mono text-sm bg-white/5 px-2 py-1 rounded border border-white/10">X-API-Key</code> header. 
              Generate API keys in your dashboard under <strong className="text-white">Settings → Security</strong>.
            </p>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`curl -H "X-API-Key: aftr_xxxxx" \
  https://afters.am/api/v1/events`}</code></pre>

            <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 my-4">
              <strong className="text-orange-300">Keep your API key secret.</strong> <span className="text-orange-200">Never expose it in client-side code or public repositories.</span>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">API Key Scopes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto my-4">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Scope</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">events:read</code></td>
                    <td className="py-2 px-4 text-white/60">Read event data</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">events:write</code></td>
                    <td className="py-2 px-4 text-white/60">Create and modify events</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">tickets:read</code></td>
                    <td className="py-2 px-4 text-white/60">Read ticket and order data</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">analytics:read</code></td>
                    <td className="py-2 px-4 text-white/60">Access event analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="errors" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Error Handling</h2>
            <p className="text-white/60 mb-4">
              The API uses standard HTTP status codes. Errors return a JSON object with 
              an <code className="font-mono text-sm bg-white/5 px-2 py-1 rounded border border-white/10">error</code> message.
            </p>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`{
  "error": "Event not found",
  "code": "NOT_FOUND"
}`}</code></pre>

            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto my-4">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Status</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">200</code></td>
                    <td className="py-2 px-4 text-white/60">Success</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">400</code></td>
                    <td className="py-2 px-4 text-white/60">Bad request — invalid parameters</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">401</code></td>
                    <td className="py-2 px-4 text-white/60">Unauthorized — invalid or missing API key</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">403</code></td>
                    <td className="py-2 px-4 text-white/60">Forbidden — insufficient permissions</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">404</code></td>
                    <td className="py-2 px-4 text-white/60">Not found</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">429</code></td>
                    <td className="py-2 px-4 text-white/60">Rate limited</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">500</code></td>
                    <td className="py-2 px-4 text-white/60">Server error</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="rate-limits" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Rate Limits</h2>
            <p className="text-white/60 mb-4">
              API requests are limited to <strong className="text-white">100 requests per minute</strong> per API key. 
              Rate limit headers are included in every response:
            </p>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000`}</code></pre>
          </section>

          <section id="list-events" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">List Events</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-300">GET</span>
                <span className="font-mono text-sm text-white">/api/v1/events</span>
              </div>
              <p className="text-white/60">Retrieve a list of your events.</p>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">Query Parameters</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto my-4">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Parameter</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Type</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">status</code></td>
                    <td className="py-2 px-4 text-white/60">string</td>
                    <td className="py-2 px-4 text-white/60">Filter by status: <code className="text-[#ff1493]">draft</code>, <code className="text-[#ff1493]">published</code>, or <code className="text-[#ff1493]">all</code></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">seriesId</code></td>
                    <td className="py-2 px-4 text-white/60">string</td>
                    <td className="py-2 px-4 text-white/60">Filter by event series</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">limit</code></td>
                    <td className="py-2 px-4 text-white/60">integer</td>
                    <td className="py-2 px-4 text-white/60">Max results (default: 20, max: 100)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">offset</code></td>
                    <td className="py-2 px-4 text-white/60">integer</td>
                    <td className="py-2 px-4 text-white/60">Pagination offset</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">Response</h3>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`{
  "events": [
    {
      "id": "evt_abc123",
      "title": "Midnight Techno",
      "slug": "midnight-techno",
      "startsAt": "2024-03-15T23:00:00Z",
      "endsAt": "2024-03-16T06:00:00Z",
      "timezone": "America/New_York",
      "venueName": "The Warehouse",
      "city": "Brooklyn",
      "state": "NY",
      "isPublished": true,
      "ticketTiers": [
        {
          "id": "tier_xyz",
          "name": "Early Bird",
          "price": 2500,
          "quantity": 100,
          "quantitySold": 45
        }
      ]
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0
  }
}`}</code></pre>
          </section>

          <section id="get-event" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Get Event</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-300">GET</span>
                <span className="font-mono text-sm text-white">/api/v1/events/:eventId</span>
              </div>
              <p className="text-white/60">Retrieve details for a specific event.</p>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">Response</h3>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`{
  "id": "evt_abc123",
  "title": "Midnight Techno",
  "slug": "midnight-techno",
  "description": "An evening of deep, hypnotic techno...",
  "startsAt": "2024-03-15T23:00:00Z",
  "endsAt": "2024-03-16T06:00:00Z",
  "timezone": "America/New_York",
  "venueName": "The Warehouse",
  "venueAddress": "123 Industrial St",
  "city": "Brooklyn",
  "state": "NY",
  "flyerUrl": "https://...",
  "isPublished": true,
  "ticketTiers": [...],
  "_count": {
    "orders": 45,
    "tickets": 67,
    "views": 1250
  }
}`}</code></pre>
          </section>

          <section id="create-event" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Create Event</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-300">POST</span>
                <span className="font-mono text-sm text-white">/api/v1/events</span>
              </div>
              <p className="text-white/60">Create a new event.</p>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">Request Body</h3>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`{
  "title": "Midnight Techno",
  "description": "An evening of deep, hypnotic techno...",
  "startsAt": "2024-03-15T23:00:00Z",
  "endsAt": "2024-03-16T06:00:00Z",
  "timezone": "America/New_York",
  "venueName": "The Warehouse",
  "venueAddress": "123 Industrial St",
  "city": "Brooklyn",
  "state": "NY",
  "ticketTiers": [
    {
      "name": "General Admission",
      "price": 3500,
      "quantity": 200
    }
  ]
}`}</code></pre>

            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 my-4">
              <strong className="text-blue-300">Note:</strong> <span className="text-blue-200">Prices are in cents (e.g., 3500 = $35.00).</span>
            </div>
          </section>

          <section id="update-event" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Update Event</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-orange-500/20 text-orange-300">PATCH</span>
                <span className="font-mono text-sm text-white">/api/v1/events/:eventId</span>
              </div>
              <p className="text-white/60">Update an existing event. Only include fields you want to change.</p>
            </div>
          </section>

          <section id="list-series" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">List Event Series</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-300">GET</span>
                <span className="font-mono text-sm text-white">/api/v1/event-series</span>
              </div>
              <p className="text-white/60">Retrieve a list of your recurring event series.</p>
            </div>
          </section>

          <section id="get-series" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Get Event Series</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-300">GET</span>
                <span className="font-mono text-sm text-white">/api/v1/event-series/:seriesId</span>
              </div>
              <p className="text-white/60">Retrieve details for a specific event series, including all occurrences.</p>
            </div>
          </section>

          <section id="create-series" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Create Event Series</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-300">POST</span>
                <span className="font-mono text-sm text-white">/api/v1/event-series</span>
              </div>
              <p className="text-white/60">Create a new recurring event series.</p>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">Request Body</h3>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`{
  "title": "Techno Tuesdays",
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": ["tuesday"],
    "startDate": "2024-03-05",
    "endDate": "2024-06-25"
  },
  "template": {
    "startTime": "22:00",
    "endTime": "04:00",
    "venueName": "The Warehouse",
    "city": "Brooklyn"
  }
}`}</code></pre>
          </section>

          <section id="generate-occurrences" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Generate Occurrences</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-300">POST</span>
                <span className="font-mono text-sm text-white">/api/v1/event-series/:seriesId/generate</span>
              </div>
              <p className="text-white/60">Manually trigger generation of future event occurrences from a series template.</p>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">Request Body</h3>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`{
  "count": 4
}`}</code></pre>
            <p className="text-white/60">Generates up to <code className="text-[#ff1493]">count</code> future occurrences based on the series recurrence pattern.</p>
          </section>

          <section id="list-tickets" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">List Tickets</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-300">GET</span>
                <span className="font-mono text-sm text-white">/api/v1/events/:eventId/tickets</span>
              </div>
              <p className="text-white/60">Retrieve tickets sold for an event.</p>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">Query Parameters</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto my-4">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Parameter</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Type</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">status</code></td>
                    <td className="py-2 px-4 text-white/60">string</td>
                    <td className="py-2 px-4 text-white/60">Filter: <code className="text-[#ff1493]">valid</code>, <code className="text-[#ff1493]">used</code>, <code className="text-[#ff1493]">cancelled</code></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">limit</code></td>
                    <td className="py-2 px-4 text-white/60">integer</td>
                    <td className="py-2 px-4 text-white/60">Max results (default: 50, max: 200)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4 text-white/60"><code className="text-[#ff1493]">offset</code></td>
                    <td className="py-2 px-4 text-white/60">integer</td>
                    <td className="py-2 px-4 text-white/60">Pagination offset</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="check-ins" className="pt-8">
            <h2 className="text-2xl font-medium border-t border-white/10 pt-8 mt-12 mb-6">Check-in History</h2>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 my-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-300">GET</span>
                <span className="font-mono text-sm text-white">/api/v1/events/:eventId/check-ins</span>
              </div>
              <p className="text-white/60">Retrieve the check-in log for an event.</p>
            </div>

            <h3 className="text-lg font-semibold text-white/60 mt-8 mb-4">Response</h3>
            <pre className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto text-sm font-mono my-6"><code>{`{
  "checkIns": [
    {
      "ticketId": "tkt_xyz",
      "checkedInAt": "2024-03-15T23:15:00Z",
      "scannerName": "Front Door",
      "holderName": "Jane Doe"
    }
  ],
  "stats": {
    "totalTickets": 150,
    "checkedIn": 89,
    "remaining": 61
  }
}`}</code></pre>
          </section>
        </main>
      </div>

      {/* Footer - Adapted from the original api-docs.html and general project style */}
      <footer className="border-t border-white/10 py-8 px-4 md:px-8 text-center text-white/40 text-sm">
        <p>&copy; {new Date().getFullYear()} afters &middot; built for the underground</p>
      </footer>
    </div>
  );
}
