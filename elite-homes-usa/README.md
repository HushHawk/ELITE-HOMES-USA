# Elite Homes USA

A responsive Next.js App Router website for Elite Homes USA Group LLC, a Jacksonville-based cash home buyer. The hero uses an art-directed photo carousel and muted architecture film. The site includes interactive property details, a four-step offer request, contact and email opt-in, and an owner inbox.

## Run locally

Use Node.js 24 or later.

```sh
npm ci
npm run dev
```

Open [the local website](http://127.0.0.1:3000). The default mode is a preview. Submissions are stored in a real SQLite database under `.data/` and are visibly labeled test records. Use synthetic information for review.

To use the owner inbox, copy `.env.example` to `.env.local` and set `ELITE_ADMIN_SECRET` to your own unique, random value of at least 32 characters. For example, generate one with `openssl rand -hex 32`. Restart the server and open [/admin](http://127.0.0.1:3000/admin). The owner can view, search and filter inquiries, update stages and follow-up dates, and add private notes. Contact and newsletter requests have their own inboxes. Keep the secret in a password manager and rotate it to invalidate existing sessions.

## Pages

- Home, About, Services, Reviews, Contact
- Cash offer request, offer receipt, How It Works and searchable FAQs
- Privacy and Terms links to the published source documents
- Email unsubscribe, owner inbox and a styled 404

## Checks

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Browser tests start a separate Next.js server with a test database. To reuse an installed Chrome, set `ELITE_CHROME` to the browser executable.

## Hosting

Node hosting runs `npm run build` and `npm start` behind HTTPS. Mount a durable private volume and point `ELITE_DATA_PATH` at it. Keep the application on a single host for local SQLite. Schedule protected backups and verify restore before collecting personal information.

Sites uses the same route and validation code through `npm run build:sites`. The Worker uses a managed D1 database via the `DB` binding in `.openai/hosting.json`. Initialize the local or hosted database with the migration under `drizzle/`. Details and launch dependencies are in [integration setup](docs/INTEGRATION_SETUP.md) and [content approval](docs/CONTENT_APPROVAL.md).


## Marketplace and website editor

- **Sell** accepts property details and up to eight photos. The seller sees a confirmation only after the submission and photos are saved.
- **Buy** lists approved properties and development projects. Prospective buyers can open the gallery, read details and send a private cash offer. Offers are accepted only while the listing is published and available.
- **Owner dashboard** has separate seller and buyer queues. Open a record for contact buttons, status, notes and activity. A seller submission appears in Buy only after the owner adds public details, selects photos and confirms permission.
- **Website and media** publishes changes to the homepage headlines, introduction and closing banner. Upload and reorder hero photos and gallery photos. Use a local MP4 or WebM (24 MB), a direct HTTPS MP4/WebM URL, or a supported YouTube or Vimeo link for the hero film.
- **Reviews** accepts visitor feedback for moderation and supports creating, editing, publishing, hiding and removing reviews.

Local media is stored on the private filesystem. Production uses a private R2 binding and database-authorized access. Private contacts, private property notes, draft photos and buyer offers stay in the owner dashboard. See [marketplace operations](docs/MARKETPLACE.md).
