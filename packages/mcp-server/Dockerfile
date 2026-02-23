# Dockerfile for Afters MCP Server
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN pnpm build

# Expose any ports if needed (MCP typically uses stdio)
# EXPOSE 3000

# Run the MCP server
CMD ["node", "dist/index.js"]