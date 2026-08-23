# Bolt Point Marketplace Delivery launch plan

## What is operational now

The production booking path is Stripe Checkout -> verified Stripe webhook -> Shipday order -> customer and operations email. Prices are recalculated on the server, and a fixed driver payout is stored separately in Stripe metadata. The original dashboards, seller-link generator, driver workflow, and applications remain browser-only demos and are not operational records.

## P0 — required before accepting money

1. Deploy this Node/Express app to Render, Railway, Fly.io, or another long-running Node host. Build with `npm run build` and start with `npm start`. Set every variable in `.env.example` in the host's secret settings; never commit live keys.
2. Activate Stripe and add `https://boltpointlogistics.com/marketplacedelivery/api/stripe/webhook`, subscribed to `checkout.session.completed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`. Run a real low-value end-to-end test and refund it.
3. Copy the API key from Shipday My Account into `SHIPDAY_API_KEY`. Confirm a paid test arrives with both addresses, buyer/seller contacts, requested date, item, notes, customer charge, vehicle class, and Bolt Point order number.
4. Verify `boltpointlogistics.com` in Resend, add its DNS records in Cloudflare, create a restricted API key, and set `EMAIL_FROM`/`BUSINESS_EMAIL`. Test delivery, replies, SPF/DKIM, and bounces.
5. Verify the actual cargo policy in writing. The prototype contains $50,000 insurance/guarantee claims, placeholder phone/address data, and unverified testimonials. Remove or formally approve every claim before launch; have counsel/insurer confirm Terms, Privacy, cancellation, damage, and refund language.

## Exact Cloudflare route

Static Pages hosting alone is insufficient because Stripe webhook verification and Shipday/email secrets must run on a server.

1. Deploy the Node app and copy its HTTPS origin (for example, `https://bpl-marketplace-delivery.onrender.com`).
2. In Cloudflare Workers & Pages, create a Worker and paste `deploy/cloudflare-marketplace-proxy.js`.
3. Add Worker variable `MARKETPLACE_ORIGIN` with that Node origin and deploy.
4. In Worker Settings > Domains & Routes > Add > Route, select the `boltpointlogistics.com` zone and enter `boltpointlogistics.com/marketplacedelivery*`. Leave the existing root-site DNS/origin unchanged and orange-clouded.
5. On the Node host set `APP_URL=https://boltpointlogistics.com/marketplacedelivery` and `VITE_BASE_PATH=/marketplacedelivery/`, then rebuild and redeploy.
6. Verify `/marketplacedelivery/`, an asset URL, `/marketplacedelivery/api/health`, Stripe success/cancel redirects, and the Stripe webhook. Health must report `stripe`, `shipday`, and `email` as `true`.

## P1 — immediately after launch

1. Add a database with immutable orders and events plus idempotent retry state. Stripe metadata is a launch bridge, not a durable operations database.
2. Replace browser-only seller links with database-backed, unguessable tokens. Implement seller-paid/split billing on the server before exposing those choices; secure checkout currently charges the authoritative full quote.
3. Protect admin/driver tools with authentication and roles; remove demo seeds. Store uploads privately with signed URLs and file validation.
4. Add Shipday status webhooks, proof of delivery, cancellation/refund automation, alerts, and reconciliation for paid orders whose dispatch failed.

## Business model controls

- Customer price and driver compensation are calculated independently.
- Customer rate remains category base + mileage + stairs + assembly + rush.
- Fixed driver payout starts at $55 pickup truck, $60 cargo van, or $75 box truck, plus $1.25/mile after 10 miles. Change it in `server.ts` only after checking margin.
- Drivers should see only their fixed payout; customer charge and broker margin belong in operations/admin views.
