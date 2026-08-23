/** Route this Worker on boltpointlogistics.com/marketplacedelivery*.
 * Set MARKETPLACE_ORIGIN to the deployed Node app HTTPS origin, without a trailing slash.
 */
export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const prefix = '/marketplacedelivery';
    if (incoming.pathname === prefix) {
      return Response.redirect(`${incoming.origin}${prefix}/${incoming.search}`, 308);
    }
    if (!incoming.pathname.startsWith(`${prefix}/`)) return new Response('Not found', { status: 404 });
    const origin = new URL(env.MARKETPLACE_ORIGIN);
    origin.pathname = incoming.pathname.slice(prefix.length) || '/';
    origin.search = incoming.search;
    const headers = new Headers(request.headers);
    headers.set('x-forwarded-host', incoming.host);
    headers.set('x-forwarded-prefix', prefix);
    return fetch(new Request(origin, { method: request.method, headers, body: request.body, redirect: 'manual' }));
  },
};
