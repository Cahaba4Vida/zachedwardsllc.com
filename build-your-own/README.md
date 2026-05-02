# ZachEdwardsLLC Manual Webbuilder

A drag-deployable Netlify project that lets customers configure a **website** or **web app**, see pricing early, build in playground mode, then unlock ZIP export through a Stripe checkout flow.

## Included in this version
- Guided onboarding wizard for project creation
- Early pricing based on selected features
- Website + web app builder in one editor
- Desktop / tablet / phone layout modes
- Multi-page projects
- Image + video uploads in the browser
- Template gallery + style presets
- Netlify Identity front-end login hooks
- Neon-ready save/load function scaffold
- Stripe-gated final export flow
- Final intake form for hosting/domain/gallery permissions
- Public gallery API scaffold for approved customer builds
- Client-side ZIP export for the generated site/app
- PWA export scaffolding for web app projects

## Pricing logic currently built in
- Base website/app package: **$100**
- Payments feature: **+$50**
- Login/account management feature: **+$10**
- Domain request: captured as an intake item and shown as an **estimated** extra cost, usually **$10–$15/year**, but not auto-charged in Stripe because availability varies.
- Hosting selection is captured, but **hosting is not charged extra**.

## Customer-facing terms included in the flow
- Domain is not included in the base price.
- Domain requests may cost extra depending on availability.
- Website/app deployment target is within one week after finalization.
- Customers can choose self-hosting or ask Zach to host.
- Customers can opt into having their build shown in the Zach Edwards LLC gallery with a customer-built note.

## What works immediately
- Drag this folder or zip into Netlify
- Open the builder and create projects in playground mode
- Save projects locally in browser storage
- Export finished projects as a ZIP **after checkout succeeds**

## Required setup
### 1) Netlify Identity
Enable Identity in Netlify:
- Site configuration → Identity → Enable Identity

### 2) Neon database
Create a Neon database and add this environment variable in Netlify:
- `NETLIFY_DATABASE_URL`

Then run the schema in `sql/schema.sql`.

### 3) Stripe
Add:
- `STRIPE_SECRET_KEY`

The checkout function uses dynamic Stripe line items, so you do **not** need pre-created Stripe Price IDs for the MVP.

## Gallery / preview feed for zachedwardsllc.com
This project includes `/.netlify/functions/public-projects`. It returns paid, opted-in customer builds so your main site can pull them into a gallery or preview wall.

## File structure
- `index.html` → app shell
- `styles.css` → builder styles
- `app.js` → main builder logic
- `templates.js` → starter templates
- `netlify/functions/sites.js` → Neon save/load API for builder projects
- `netlify/functions/create-checkout-session.js` → Stripe checkout creator
- `netlify/functions/verify-checkout.js` → Stripe session verification + order finalization
- `netlify/functions/public-projects.js` → gallery feed for approved customer builds
- `sql/schema.sql` → starter DB schema

## Current limitations
- Export is static HTML/CSS/JS, not React or Next
- Gallery publication is stored in Neon and exposed by API, but your main `zachedwardsllc.com` site still needs to consume that endpoint
- Payments/login are quoted as feature flags; full auth/payment product logic inside exported sites still needs custom implementation per project
- Assets are stored as data URLs in the MVP for simplicity
