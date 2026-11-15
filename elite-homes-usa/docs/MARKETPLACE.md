# Marketplace operations

## Seller and buyer workflows

1. A seller visits [/sell](/sell), adds the address, property details and at least one photo, and provides a name, an email and a phone number. Record references appear after a successful save.
2. In **Owner dashboard → Seller submissions**, open the address. Review the private submission and contact the seller using the verified intake details. Add notes and update the review status.
3. To publish a public listing, write its title and description, verify its city/type/price, select up to eight photos and confirm permission. Enter a public street address only when authorized. A **Published** property appears under [/buy](/buy).
4. Buyers can browse approved properties or development projects, compare details and send a cash offer. In **Buyer offers**, review the amount, terms and contact information, then follow up directly. Status changes are internal records. The parties finalize a sale separately.
5. Set the listing to **Under contract** to keep it visible and stop accepting additional offers. Set it to **Sold**, **Archived** or another nonpublic state to remove it and close its public photos.

## Website editor

- Upload reusable photos to **Website and media**. Add selected images to **Hero photos** or **Homepage gallery**, supply a short description, and arrange the order.
- Select an uploaded MP4 or WebM under 24 MB or enter an HTTPS direct video link, YouTube link, or Vimeo link. The site loads a custom film when a visitor selects **View film**. Third-party playback depends on the source allowing embeds.
- Use **Save Website Changes** to make the changes visible. Removing a photo from every public placement revokes its public URL. The private library retains the uploaded file for reuse.
- In **Reviews**, publish only material the business has permission to display. The display name, title and text can be public. Submitted email addresses remain private.

## Hosting, data and review mode

- The owner dashboard is protected by the server-only `ELITE_ADMIN_SECRET` and a signed session, with the hosted Site also protected by the configured Sites audience.
- SQLite and `ELITE_MEDIA_PATH` are the local private storage. Keep both on a durable private volume where applicable. Sites provides D1 and an R2 bucket using the `DB` and `BUCKET` bindings. R2 is private. The application checks database visibility before returning any media.
- The upload API caps file size and serves only recognized WebP, MP4 or WebM. Photos are scaled in the browser and the server removes non-image metadata from published copies. Review images for visible personal details before publication.
- Review and live records use separate scopes. The private review website is for representative sample data. For public intake, approve the marketplace data-handling and photo publishing language, choose retention and backup procedures, and configure the intended audience and runtime environment. Buyer and seller contact occurs directly from the dashboard.
