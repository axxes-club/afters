import { NextRequest, NextResponse } from "next/server";

const CLERK_FRONTEND_API = "https://frontend-api.clerk.services";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "";
const PROXY_URL = "https://afters.xxx/__clerk";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
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
  // Remove transfer-encoding to avoid issues with Next.js
  responseHeaders.delete("transfer-encoding");

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
