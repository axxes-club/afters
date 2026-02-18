# @afters/mcp-server

Model Context Protocol (MCP) server for [afters](https://afters.am) event management.

## Installation

```bash
npm install -g @afters/mcp-server
```

Or use directly with npx:

```bash
npx @afters/mcp-server
```

## Configuration

Set your API key as an environment variable:

```bash
export AFTERS_API_KEY="your-api-key"
```

Get your API key from [afters.am/b/developers](https://afters.am/b/developers).

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "afters": {
      "command": "npx",
      "args": ["@afters/mcp-server"],
      "env": {
        "AFTERS_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

### Events
- **list_events** - List all your events (filter by status: upcoming, past, draft)
- **get_event** - Get details of a specific event
- **create_event** - Create a new event

### Analytics
- **get_event_analytics** - Get ticket sales, check-ins, and revenue data

### Tickets
- **list_tickets** - List tickets for an event
- **checkin_ticket** - Check in a ticket at the door

### Guestlist
- **add_to_guestlist** - Add someone to an event's guestlist

## Examples

Ask Claude:
- "Show me my upcoming events"
- "How many tickets have been sold for my event?"
- "Add John Smith to the guestlist for Saturday's event"
- "Create a new event called 'Summer Party' at Club XYZ"

## API Scopes

Your API key needs the following scopes depending on the tools you want to use:

| Tool | Required Scopes |
|------|----------------|
| list_events, get_event | `events:read` |
| create_event | `events:write` |
| get_event_analytics | `analytics:read` |
| list_tickets | `tickets:read` |
| checkin_ticket | `tickets:checkin` |
| add_to_guestlist | `guestlist:write` |

## Development

```bash
cd packages/mcp-server
npm install
npm run dev   # Watch mode
npm run build # Build for production
```

## License

MIT
