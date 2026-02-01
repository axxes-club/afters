import { NextRequest, NextResponse } from "next/server";

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "";
const PROXY_URL = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "https://afters.xxx/clerkproxy";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
};

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  const { path } = await params;
  const targetPath = path.join("/");
  const url = new URL(targetPath, CLERK_FRONTEND_API);
  url.search = req.nextUrl.search;

  const headers = new Headers(req.headers);
  headers.set("Clerk-Proxy-Url", PROXY_URL);
  headers.set("Clerk-Secret-Key", CLERK_SECRET_KEY);
  headers.set(
    "X-Forwarded-For",
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1"
  );
  // Remove host header so it doesn't conflict
  headers.delete("host");

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const response = await fetch(url.toString(), {
    method: req.method,
    headers,
    body,
    // @ts-expect-error - duplex is needed for streaming request bodies
    duplex: body ? "half" : undefined,
  });

  const responseHeaders = new Headers(response.headers);
  // Remove encoding headers to avoid mismatch (fetch decodes, but headers remain)
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  // Add CORS headers (www.afters.xxx → afters.xxx cross-origin)
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
