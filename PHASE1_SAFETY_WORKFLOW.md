# Phase 1 order-protection workflow

This work is implemented locally and must not be published until the migration and Cloudflare Access policy are ready.

## Customer flow

1. Seller supplies at least four current photos, dimensions, a condition rating, defect flags, and a signed condition certification.
2. Buyer sees those disclosures and separately accepts the item-condition record and BoltPoint delivery-service terms.
3. The Worker recalculates the route and saves an immutable order snapshot with the paid Stripe session.
4. A seller-link order enters `awaiting_seller`; Shipday dispatch is paused.
5. Seller receives an availability-confirmation email. Confirmation releases the paid order to Shipday.
6. Seller receives a one-time pickup PIN. The pickup report endpoint records the inspection result, notes, photos, inspector, and timestamp.
7. A materially different or unavailable item sets pickup status to `paused` for buyer/admin review.

## Production prerequisites

- Apply `migrations/0005_phase_one_order_protection.sql` to production D1.
- Set `ADMIN_EMAILS` to a comma-separated allowlist of BoltPoint administrators.
- Protect the eventual admin hostname/path with Cloudflare Access. The Worker also checks the Access email header.
- Do not set `VITE_LOCAL_ADMIN_EMAIL` in production; it is only a localhost convenience.
- Confirm Resend sender/domain configuration and test seller availability and pickup-PIN emails.
- Test Stripe webhook retries to ensure only one Shipday order is created.
- Add the driver-facing pickup inspection UI before operational use; the protected API and audit record are included in this phase.

## Admin preview

Open `?view=admin-dashboard`. It uses live API records and exports the displayed order ledger as CSV. It is intentionally absent from public navigation.
