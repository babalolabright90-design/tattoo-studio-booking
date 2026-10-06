/**
 * Cloudflare Pages middleware
 * Routes API calls and serves the Next.js app
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // API routes should be handled by the function routes
  if (url.pathname.startsWith('/api/')) {
    return context.next();
  }

  // Serve static assets and Next.js pages
  return context.next();
}
