# Backend and integration setup

## Persistence

- Offer and contact submissions validate in the browser and/or API and are written with unique request IDs. Offer retries return the persisted reference.
- Newsletter subscriptions require affirmative email consent and store its version, wording and timestamp. Active email subscriptions are deduplicated. The initial subscriber can save an unsubscribe link backed by a random token. The database stores its hash.
- The owner inbox uses an HTTP-only signed cookie and a server-only access secret. The API verifies the session on reads and mutations. Pipeline edits, follow-up dates and internal notes persist with an activity entry.
- Same-origin requests, size limits, a honeypot and database-backed throttling guard intake. By default throttling uses a shared bucket. Set `ELITE_TRUST_PROXY=1` only behind a trusted proxy that overwrites `CF-Connecting-IP`. Set the canonical HTTPS `ELITE_SITE_URL` to match the sole intended origin in public deployment.
- For local SQLite, the schema is initialized on first use. For Cloudflare D1, apply the SQL migration before serving forms. Sites uses the manifest's logical D1 binding.

## Runtime configuration

| Variable | Setting |
|---|---|
| `ELITE_MODE` | Defaults to `preview`. Set `live` after launch approvals. |
| `ELITE_ADMIN_SECRET` | Required to enable owner sign-in. Use a high-entropy secret of at least 32 characters. |
| `ELITE_DATA_PATH` | Local or self-hosted SQLite path on a private durable volume. |
| `ELITE_SITE_URL` | Canonical site origin for production form origin validation, metadata and sitemap. |
| `ELITE_TRUST_PROXY` | Optional trusted Cloudflare IP header integration. |

Never commit secrets, populated databases, customer attachments or exports. Restrict access to backups and remove sample data before a launch. The single-owner sign-in can be replaced by managed staff identities and role permissions when multiple users need access.

## Integrations

The inbox provides the current operational workflow. Outbound email, SMS, CRM synchronization, CAPTCHA, uploads, tracking pixels and Zoom/calendar scheduling require approved tools or accounts and implementation before activation. Newsletter requests are consent records for future email delivery. Configure a mailing provider to include a working unsubscribe link in each outgoing message, synchronize opt-outs and define retention before mailing. Any future SMS workflow requires approved disclosures, separate opt-in and provider-managed STOP and HELP handling.
