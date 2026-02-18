import { NextRequest } from "next/server";

/**
 * Create a NextRequest for testing API routes.
 * 
 * Usage:
 * ```ts
 * const req = createNextRequest("http://localhost:3000/api/test", {
 *   method: "POST",
 *   body: { foo: "bar" },
 * });
 * ```
 */
export function createNextRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
): NextRequest {
  const { method = "GET", headers = {}, body } = options ?? {};

  const init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  } = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

/**
 * Create a NextRequest with JSON body.
 */
export function createJsonRequest(
  url: string,
  body: unknown,
  options?: {
    method?: string;
    headers?: Record<string, string>;
  }
): NextRequest {
  return createNextRequest(url, {
    method: options?.method ?? "POST",
    headers: options?.headers,
    body,
  });
}

/**
 * Create a GET NextRequest with query parameters.
 */
export function createGetRequest(
  url: string,
  params?: Record<string, string>,
  headers?: Record<string, string>
): NextRequest {
  const urlObj = new URL(url);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
  }
  return createNextRequest(urlObj.toString(), { method: "GET", headers });
}
