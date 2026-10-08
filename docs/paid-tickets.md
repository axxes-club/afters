# Paid ticket sales

Resumes the `afterssss-auth` conversation and `fix/paid-tickets` WIP from
2026-10-08. Requirements: organizers can set real prices and onboard payouts;
buyers can pay; a successful payment issues tickets exactly once. Stripe's fees
and payment losses belong to the organizer's connected account. afters collects
its existing buyer service fee (10% + $0.99 per ticket) as an application fee.

## Implementation and operating rules

- Settings → Payouts opens Stripe's required identity/bank onboarding. Only an
  organizer owner can change payout details. Account creation is idempotent and
  concurrent requests return the same stored account.
- Ticket prices are cents: zero for free, $1–$10,000 for paid. Paid prices require
  an enabled payout account. A tier with completed sales cannot change price.
- Checkout verifies the order email, age, pending state, and the live payout
  account's controller and charge capability. PaymentIntents are direct charges;
  retries reuse their existing intent and never replace a possibly paid intent
  after an API/network error.
- Creating an order reserves its quantities for one hour. Invalid/negative
  quantities and duplicate tiers are rejected. An event row lock serializes
  reservations and fulfillment; availability includes all pending orders.
- New purchases lazily clean up up to ten expired reservations for their event.
  A reservation with a payment is released only after Stripe confirms cancellation.
  Processing or successful payments retain their inventory until fulfillment.
  Stripe API failures retain reservations rather than risking overselling.
- Webhooks validate signature, payment intent, account, currency, and received
  amount. A pending-to-paid compare-and-set, ticket writes, and sales counts commit
  atomically. Duplicate deliveries do not issue tickets or count sales twice.
  Card declines leave the order pending for a retry.
- The confirmation page refreshes while pending, preserving the guest access
  token. After two minutes it offers a manual check.
- Ticket PDFs/emails use Next.js `after`. Delivery remains best effort; tickets are
  also available from the signed confirmation page. Durable email retries are a
  follow-up, not a payment fulfillment guarantee.

## Stripe configuration

Both destinations use `https://afters.am/api/webhooks/stripe`:

- Connected accounts: `payment_intent.succeeded`,
  `payment_intent.payment_failed`, `account.updated`.
  Signing secret: `STRIPE_CONNECT_WEBHOOK_SECRET`.
- Platform: ticket payment events (legacy) and subscription created/updated/deleted.
  Signing secret: `STRIPE_WEBHOOK_SECRET`.

Live Connect destinations can receive test events; test events are ignored when
running with a live Stripe key. Production secrets live in `afters-env` in GCP
Secret Manager; endpoint details and the previous dotenv are backed up privately
under `~/Developer/_gcp/_cutover/`. Never commit signing secrets.

## Verification record

- Baseline: 293 tests passed on macOS before changes.
- New failing tests reproduced duplicate fulfillment, incorrect payment matching,
  declined-order cancellation, unsafe payment replacement, invalid quantities,
  missing reservations, and concurrent payout account creation.
- Stripe endpoints configured 2026-10-08; signing secrets stored in `afters-env`
  version 10. Existing Payments/Tollbooth destinations were not modified.
- Stripe account inventory at setup: zero connected accounts. Organizers must
  complete identity/bank verification before paid tickets can sell. No real card
  purchase has been performed.
- Remaining verification: full suite, Linux CI including Postgres concurrency,
  production deployment and signed webhook smoke checks.
