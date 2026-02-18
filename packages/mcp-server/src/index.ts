#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const API_BASE = process.env.AFTERS_API_URL || "https://afters.am/api/v1"
const API_KEY = process.env.AFTERS_API_KEY

if (!API_KEY) {
  console.error("AFTERS_API_KEY environment variable is required")
  process.exit(1)
}

const server = new Server(
  {
    name: "afters-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_events",
      description: "List all your events on afters",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filter by status: upcoming, past, draft, all",
            enum: ["upcoming", "past", "draft", "all"],
          },
          limit: {
            type: "number",
            description: "Maximum number of events to return",
          },
        },
      },
    },
    {
      name: "get_event",
      description: "Get details of a specific event",
      inputSchema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The event ID",
          },
        },
        required: ["eventId"],
      },
    },
    {
      name: "create_event",
      description: "Create a new event on afters",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Event title",
          },
          description: {
            type: "string",
            description: "Event description",
          },
          startsAt: {
            type: "string",
            description: "Start date/time in ISO format",
          },
          endsAt: {
            type: "string",
            description: "End date/time in ISO format (optional)",
          },
          venueName: {
            type: "string",
            description: "Venue name",
          },
          venueAddress: {
            type: "string",
            description: "Venue address",
          },
          city: {
            type: "string",
            description: "City",
          },
        },
        required: ["title", "startsAt", "venueName", "venueAddress", "city"],
      },
    },
    {
      name: "get_event_analytics",
      description: "Get analytics for an event (ticket sales, check-ins, revenue)",
      inputSchema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The event ID",
          },
        },
        required: ["eventId"],
      },
    },
    {
      name: "list_tickets",
      description: "List tickets for an event",
      inputSchema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The event ID",
          },
          status: {
            type: "string",
            description: "Filter by status: valid, checked_in, cancelled",
            enum: ["valid", "checked_in", "cancelled"],
          },
        },
        required: ["eventId"],
      },
    },
    {
      name: "checkin_ticket",
      description: "Check in a ticket at the door",
      inputSchema: {
        type: "object",
        properties: {
          ticketId: {
            type: "string",
            description: "The ticket ID or QR code",
          },
        },
        required: ["ticketId"],
      },
    },
    {
      name: "add_to_guestlist",
      description: "Add someone to an event's guestlist",
      inputSchema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The event ID",
          },
          name: {
            type: "string",
            description: "Guest name",
          },
          email: {
            type: "string",
            description: "Guest email (optional)",
          },
          plusOnes: {
            type: "number",
            description: "Number of plus ones (default: 0)",
          },
          notes: {
            type: "string",
            description: "Notes about the guest",
          },
        },
        required: ["eventId", "name"],
      },
    },
  ],
}))

// Helper to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API error: ${res.status} ${error}`)
  }

  return res.json()
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "list_events": {
        const params = new URLSearchParams()
        if (args?.status) params.set("status", args.status as string)
        if (args?.limit) params.set("limit", String(args.limit))
        const events = await apiRequest(`/events?${params}`)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(events, null, 2),
            },
          ],
        }
      }

      case "get_event": {
        const event = await apiRequest(`/events/${args?.eventId}`)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(event, null, 2),
            },
          ],
        }
      }

      case "create_event": {
        const event = await apiRequest("/events", {
          method: "POST",
          body: JSON.stringify(args),
        })
        return {
          content: [
            {
              type: "text",
              text: `Event created successfully!\n\n${JSON.stringify(event, null, 2)}`,
            },
          ],
        }
      }

      case "get_event_analytics": {
        const analytics = await apiRequest(`/events/${args?.eventId}/analytics`)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analytics, null, 2),
            },
          ],
        }
      }

      case "list_tickets": {
        const params = new URLSearchParams()
        if (args?.status) params.set("status", args.status as string)
        const tickets = await apiRequest(`/events/${args?.eventId}/tickets?${params}`)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tickets, null, 2),
            },
          ],
        }
      }

      case "checkin_ticket": {
        const result = await apiRequest(`/tickets/${args?.ticketId}/checkin`, {
          method: "POST",
        })
        return {
          content: [
            {
              type: "text",
              text: `Ticket checked in successfully!\n\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        }
      }

      case "add_to_guestlist": {
        const guest = await apiRequest(`/events/${args?.eventId}/guestlist`, {
          method: "POST",
          body: JSON.stringify({
            name: args?.name,
            email: args?.email,
            plusOnes: args?.plusOnes || 0,
            notes: args?.notes,
          }),
        })
        return {
          content: [
            {
              type: "text",
              text: `Added to guestlist!\n\n${JSON.stringify(guest, null, 2)}`,
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    }
  }
})

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("afters MCP server running on stdio")
}

main().catch(console.error)
