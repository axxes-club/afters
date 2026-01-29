import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, request) => {
  // Check if the request is coming from the Netlify URL
  if (request.headers.get('host')?.includes('afters.netlify.app')) {
    // Create a response that shows a message and then redirects
    const url = request.nextUrl.clone();
    url.hostname = 'afters.crativo.xyz';
    url.protocol = 'https:';

    // Return a response with HTML that shows the message and redirects
    return new Response (
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
          <meta http-equiv="refresh" content="3; url=${url.toString()}">
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #000;
              color: white;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .container {
              text-align: center;
              padding: 2rem;
              border-radius: 8px;
              background-color: rgba(30, 30, 30, 0.8);
              max-width: 90%;
              width: 500px;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 4px solid rgba(255, 20, 147, 0.3);
              border-top: 4px solid #ff1493;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 2rem auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>We're moving you to our latest deployment!</h1>
            <p>Please hold on while we redirect you to the official site.</p>
            <div class="spinner"></div>
            <p>You'll be redirected in a few seconds, or <a href="${url.toString()}" style="color: #ff1493;">click here</a> if you don't want to wait.</p>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = "${url.toString()}";
            }, 3000);
          </script>
        </body>
      </html>
    `, 
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
