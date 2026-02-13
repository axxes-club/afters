"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  Copy,
  Check,
  Search,
  ExternalLink,
  Terminal,
  Code2,
  Key,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

interface ApiEndpoint {
  method: HttpMethod
  path: string
  title: string
  description: string
  scope: string
  parameters?: {
    name: string
    type: string
    required: boolean
    description: string
    location: "path" | "query" | "body"
  }[]
  requestBody?: {
    type: string
    example: Record<string, unknown>
  }
  response?: {
    type: string
    example: Record<string, unknown>
  }
}

interface ApiSection {
  title: string
  description: string
  endpoints: ApiEndpoint[]
}

const API_DOCS: ApiSection[] = [
  {
    title: "Events",
    description: "Create, read, update, and delete events",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/events",
        title: "List Events",
        description: "Retrieve a list of all your events with pagination support.",
        scope: "events:read",
        parameters: [
          {
            name: "status",
            type: "string",
            required: false,
            description: "Filter by status: 'draft', 'published', or 'all'",
            location: "query",
          },
          {
            name: "limit",
            type: "number",
            required: false,
            description: "Maximum number of events to return (default: 20, max: 100)",
            location: "query",
          },
          {
            name: "offset",
            type: "number",
            required: false,
            description: "Number of events to skip for pagination",
            location: "query",
          },
        ],
        response: {
          type: "object",
          example: {
            events: [
              {
                id: "clx1234567890",
                title: "Summer Rave",
                slug: "summer-rave",
                startsAt: "2024-07-15T22:00:00.000Z",
                status: "PUBLISHED",
                isPublished: true,
                ticketTiers: [
                  { id: "tier_1", name: "General Admission", price: 2500, quantity: 200, quantitySold: 45 }
                ],
                _count: { orders: 45, tickets: 67, views: 1234 }
              }
            ],
            pagination: { total: 15, limit: 20, offset: 0, hasMore: false }
          },
        },
      },
      {
        method: "POST",
        path: "/api/v1/events",
        title: "Create Event",
        description: "Create a new event. The event will be created as a draft.",
        scope: "events:write",
        requestBody: {
          type: "object",
          example: {
            title: "Summer Rave",
            description: "The hottest party of the summer",
            startsAt: "2024-07-15T22:00:00.000Z",
            endsAt: "2024-07-16T04:00:00.000Z",
            timezone: "America/New_York",
            venueName: "Warehouse 23",
            venueAddress: "123 Industrial Ave",
            city: "Brooklyn",
            state: "NY",
            flyerUrl: "https://example.com/flyer.jpg",
            pageTheme: "neon",
          },
        },
        response: {
          type: "object",
          example: {
            id: "clx1234567890",
            title: "Summer Rave",
            slug: "summer-rave",
            startsAt: "2024-07-15T22:00:00.000Z",
            status: "DRAFT",
            createdAt: "2024-06-01T12:00:00.000Z",
          },
        },
      },
      {
        method: "GET",
        path: "/api/v1/events/{eventId}",
        title: "Get Event",
        description: "Retrieve detailed information about a specific event.",
        scope: "events:read",
        parameters: [
          {
            name: "eventId",
            type: "string",
            required: true,
            description: "The unique event ID",
            location: "path",
          },
        ],
        response: {
          type: "object",
          example: {
            id: "clx1234567890",
            title: "Summer Rave",
            slug: "summer-rave",
            description: "The hottest party of the summer",
            startsAt: "2024-07-15T22:00:00.000Z",
            endsAt: "2024-07-16T04:00:00.000Z",
            venueName: "Warehouse 23",
            venueAddress: "123 Industrial Ave",
            city: "Brooklyn",
            state: "NY",
            status: "PUBLISHED",
            ticketTiers: [],
            _count: { orders: 45, tickets: 67, views: 1234, scanLogs: 0, guestlistEntries: 12, rsvps: 0 }
          },
        },
      },
      {
        method: "PATCH",
        path: "/api/v1/events/{eventId}",
        title: "Update Event",
        description: "Update an existing event. Only the provided fields will be updated.",
        scope: "events:write",
        parameters: [
          {
            name: "eventId",
            type: "string",
            required: true,
            description: "The unique event ID",
            location: "path",
          },
        ],
        requestBody: {
          type: "object",
          example: {
            title: "Summer Rave 2024",
            description: "Updated description",
          },
        },
        response: {
          type: "object",
          example: {
            id: "clx1234567890",
            title: "Summer Rave 2024",
            slug: "summer-rave",
            status: "PUBLISHED",
            isPublished: true,
            updatedAt: "2024-06-15T12:00:00.000Z",
          },
        },
      },
      {
        method: "DELETE",
        path: "/api/v1/events/{eventId}",
        title: "Delete Event",
        description: "Delete an event. Events with sold tickets cannot be deleted.",
        scope: "events:delete",
        parameters: [
          {
            name: "eventId",
            type: "string",
            required: true,
            description: "The unique event ID",
            location: "path",
          },
        ],
        response: {
          type: "object",
          example: {
            message: "Event deleted successfully",
          },
        },
      },
    ],
  },
]

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-green-500/20 text-green-400 border-green-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PATCH: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default function ApiDocsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(API_DOCS[0].title)

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  function generateCurlExample(endpoint: ApiEndpoint): string {
    const baseUrl = "https://afters.live/api/v1"
    let path = endpoint.path.replace("/api/v1", "")
    path = path.replace("{eventId}", "YOUR_EVENT_ID")

    let curl = `curl -X ${endpoint.method} "${baseUrl}${path}"`
    curl += `\n  -H "Authorization: Bearer YOUR_API_KEY"`

    if (endpoint.requestBody) {
      curl += `\n  -H "Content-Type: application/json"`
      curl += `\n  -d '${JSON.stringify(endpoint.requestBody.example, null, 2).split('\n').join('\n  ')}'`
    }

    return curl
  }

  function generateJsExample(endpoint: ApiEndpoint): string {
    const baseUrl = "https://afters.live/api/v1"
    let path = endpoint.path.replace("/api/v1", "")
    path = path.replace("{eventId}", "${eventId}")

    let code = `const response = await fetch(\`${baseUrl}${path}\`, {\n`
    code += `  method: "${endpoint.method}",\n`
    code += `  headers: {\n`
    code += `    "Authorization": \`Bearer \${apiKey}\`,\n`
    if (endpoint.requestBody) {
      code += `    "Content-Type": "application/json",\n`
    }
    code += `  },\n`
    if (endpoint.requestBody) {
      code += `  body: JSON.stringify(${JSON.stringify(endpoint.requestBody.example, null, 4).split('\n').join('\n  ')}),\n`
    }
    code += `});\n\n`
    code += `const data = await response.json();`

    return code
  }

  const filteredSections = API_DOCS.map((section) => ({
    ...section,
    endpoints: section.endpoints.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((s) => s.endpoints.length > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/d/developers">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Reference documentation for the Afters API
          </p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#ff1493]/10">
                <Terminal className="w-5 h-5 text-[#ff1493]" />
              </div>
              <div>
                <p className="font-medium">Base URL</p>
                <code className="text-sm text-muted-foreground">
                  https://afters.live/api/v1
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#ff1493]/10">
                <Key className="w-5 h-5 text-[#ff1493]" />
              </div>
              <div>
                <p className="font-medium">Authentication</p>
                <code className="text-sm text-muted-foreground">
                  Bearer Token
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#ff1493]/10">
                <Code2 className="w-5 h-5 text-[#ff1493]" />
              </div>
              <div>
                <p className="font-medium">Response Format</p>
                <code className="text-sm text-muted-foreground">JSON</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authentication Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold">Authentication</h2>
          <p className="text-muted-foreground">
            All API requests require authentication using an API key. Include
            your API key in the <code className="bg-white/10 px-1.5 py-0.5 rounded">Authorization</code> header:
          </p>
          <div className="relative">
            <pre className="bg-black/50 border border-white/10 rounded-lg p-4 overflow-x-auto text-sm">
              <code>Authorization: Bearer aftr_your_api_key_here</code>
            </pre>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={() =>
                copyCode(
                  "Authorization: Bearer aftr_your_api_key_here",
                  "auth-header"
                )
              }
            >
              {copiedCode === "auth-header" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Don't have an API key?{" "}
            <Link href="/d/developers" className="text-[#ff1493] hover:underline">
              Create one here
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold">Rate Limiting</h2>
          <p className="text-muted-foreground">
            API requests are limited to <strong>100 requests per minute</strong> per API key.
            Rate limit information is included in response headers:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-black/30 border border-white/10 rounded-lg p-3">
              <code className="text-[#ff1493]">X-RateLimit-Remaining</code>
              <p className="text-muted-foreground mt-1">Requests remaining in current window</p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-3">
              <code className="text-[#ff1493]">X-RateLimit-Reset</code>
              <p className="text-muted-foreground mt-1">Timestamp when the limit resets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search endpoints..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* API Sections */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <nav className="hidden lg:block w-48 shrink-0 space-y-1 sticky top-6 self-start">
          {API_DOCS.map((section) => (
            <button
              key={section.title}
              onClick={() => setActiveSection(section.title)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                activeSection === section.title
                  ? "bg-[#ff1493]/10 text-[#ff1493]"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {section.title}
            </button>
          ))}
        </nav>

        {/* Endpoints */}
        <div className="flex-1 space-y-6">
          {filteredSections.map((section) => (
            <div key={section.title} id={section.title} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="text-muted-foreground">{section.description}</p>
              </div>

              {section.endpoints.map((endpoint) => (
                <Card key={`${endpoint.method}-${endpoint.path}`}>
                  <CardContent className="pt-6 space-y-4">
                    {/* Endpoint Header */}
                    <div className="flex items-start gap-3">
                      <Badge
                        className={`${METHOD_COLORS[endpoint.method]} font-mono text-xs px-2 py-1`}
                      >
                        {endpoint.method}
                      </Badge>
                      <div className="flex-1">
                        <code className="text-sm font-mono">{endpoint.path}</code>
                        <h3 className="text-lg font-semibold mt-1">
                          {endpoint.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {endpoint.description}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Scope: {endpoint.scope}
                        </Badge>
                      </div>
                    </div>

                    {/* Parameters */}
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Parameters</h4>
                        <div className="border border-white/10 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-white/5">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium">
                                  Name
                                </th>
                                <th className="text-left px-3 py-2 font-medium">
                                  Type
                                </th>
                                <th className="text-left px-3 py-2 font-medium">
                                  Description
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {endpoint.parameters.map((param) => (
                                <tr key={param.name}>
                                  <td className="px-3 py-2">
                                    <code className="text-[#ff1493]">
                                      {param.name}
                                    </code>
                                    {param.required && (
                                      <span className="text-red-400 ml-1">*</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {param.type}
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {param.description}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Code Examples */}
                    <Tabs defaultValue="curl" className="w-full">
                      <TabsList className="bg-white/5">
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl" className="relative">
                        <pre className="bg-black/50 border border-white/10 rounded-lg p-4 overflow-x-auto text-sm">
                          <code>{generateCurlExample(endpoint)}</code>
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyCode(
                              generateCurlExample(endpoint),
                              `curl-${endpoint.path}`
                            )
                          }
                        >
                          {copiedCode === `curl-${endpoint.path}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </TabsContent>
                      <TabsContent value="javascript" className="relative">
                        <pre className="bg-black/50 border border-white/10 rounded-lg p-4 overflow-x-auto text-sm">
                          <code>{generateJsExample(endpoint)}</code>
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyCode(
                              generateJsExample(endpoint),
                              `js-${endpoint.path}`
                            )
                          }
                        >
                          {copiedCode === `js-${endpoint.path}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </TabsContent>
                    </Tabs>

                    {/* Response Example */}
                    {endpoint.response && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Response</h4>
                        <div className="relative">
                          <pre className="bg-black/50 border border-white/10 rounded-lg p-4 overflow-x-auto text-sm">
                            <code>
                              {JSON.stringify(endpoint.response.example, null, 2)}
                            </code>
                          </pre>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() =>
                              copyCode(
                                JSON.stringify(endpoint.response!.example, null, 2),
                                `response-${endpoint.path}`
                              )
                            }
                          >
                            {copiedCode === `response-${endpoint.path}` ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No endpoints found matching &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Need help?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our support team or check out the community resources.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href="mailto:developers@afters.live"
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Contact Support
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
