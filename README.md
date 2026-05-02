Gallery wall site for Netlify.

Current frame routing:
1. Websites -> /websites/
2. AI Agents -> https://zeagentic.netlify.app/
3. AI Apps -> /apps/
4. Custom Software -> /software/
5. Stock Investments -> https://zinvestz.netlify.app/

Homepage CTA:
- Zach Edwards LLC live updates -> https://jarvas-auto-updates.netlify.app/

## What is implemented in code

- onboarding-first homepage flow for visitors without an account
- Netlify Identity front-end auth
- remembered device support via `x-device-id`
- Neon/Postgres-backed profiles, quotes, projects, and admin settings
- request flows for websites and apps
- AI/basic-custom classification with pricing guardrails
- actual quote display before deposit checkout
- FormSubmit inquiry delivery to `zach@zachedwardsllc.com`
- Stripe deposit checkout from server-side quote records
- explicit quote acceptance checkbox before checkout
- post-deposit project verification and project setup handoff
- admin panel for homepage routing/copy and project pipeline updates
- draft legal terms page at `/legal/`

## Required environment variables

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY` (optional, fallback classifier works without it)
- `FORM_SUBMIT_EMAIL` (optional, defaults to `zach@zachedwardsllc.com`)
- `PUBLIC_BASE_URL` (recommended)
- `ADMIN_EMAILS` (comma-separated admin emails, recommended)

## First deploy steps

1. Enable Netlify Identity on the site.
2. Run both SQL files in `/sql/` against Neon/Postgres.
3. Add the environment variables above in Netlify.
4. Deploy.
5. Test `/request-website/`, `/request-app/`, `/request-software/`, `/account/`, `/project-setup/`, `/admin/`, and `/legal/`.

## What still must be verified live

These parts cannot be fully completed offline in the zip and still need your live environment:

- Netlify Identity signup/login/logout on the real site
- Stripe deposit checkout end-to-end with your real key
- FormSubmit delivery into your inbox
- DB migrations against your actual Neon database
- final AI quote tuning after seeing real requests

## Notes

- Website requests: basic defaults to **$100 deposit** and **$10/mo** after approval.
- App requests: basic defaults to **$500 deposit** and **$35/mo** after approval.
- The quote engine now treats deposit and monthly fee as fixed by the selected lane, while the total project quote is clamped inside safe ranges.
- Project terms live at `/legal/`. Review and tighten them before production use if you want stricter policy language.


## User-friendly pass
- onboarding language simplified for first-time visitors
- homepage and service pages now explain what each service is, how quoting works, and what happens after deposit
- website basic vs custom logic clarified in both copy and quote rules


## AI agents internal page
- homepage and onboarding now route AI Agents to `/agents/` first
- `/agents/` explains the rental model, what the bot can do, pricing tiers, and limitations
- external agent workspace remains available as a CTA on the internal AI Agents page


## Full-visibility wall art update
- all 5 homepage wall images were replaced with the new portrait graphics
- wall frames now use object-fit: contain so the full artwork stays visible without cropping
- frame sizes and offsets were adjusted to fit the new portrait set cleanly


## Onboarding skip fix
- onboarding now waits for Netlify Identity session initialization before deciding whether to show
- signed-in users should now go straight to the homepage without seeing onboarding first


## DB-backed device skip
- device identities are now checked through the database before showing onboarding
- once the same device has been seen before, the homepage can open directly without forcing onboarding again
- logged-in users still skip onboarding automatically


## Login/homepage onboarding skip fix
- homepage onboarding now waits for stored Netlify Identity session restoration before deciding
- if a user is logged in, the site should stay on the main wall homepage instead of forcing onboarding
- same-device DB remember logic is still preserved


## Compact onboarding update
- onboarding modal reduced in height and padding so it fits on screen without scrolling in normal desktop view
- onboarding card copy was shortened and benchmark notes were removed from onboarding itself
- service selection and next-step screens were tightened for a faster first impression


## Pricing comparison update
- comparison sections now emphasize the basic benchmark vs your entry price plus monthly maintenance
- the higher custom benchmark cards were removed from the compare sections
- software maintenance was updated to $35/month after completion to match the new direction


## 3-step onboarding flow
- onboarding now uses 3 screens: welcome, service/price comparison, then account choice
- the old 'what do you want to do next' screen was removed
- a compact benchmark table was added to the second screen with your monthly pricing shown directly


## Cleaned onboarding screen
- service comparison screen was simplified into 4 main cards plus 2 smaller secondary cards
- benchmark table was tightened and shortened for a cleaner visual hierarchy
- spacing and sizing were reduced so the second screen reads faster and feels less crowded


## Logged-in users skip onboarding
- homepage now checks immediate user state, stored Netlify Identity session, and last-known user state before showing onboarding
- login and signup hide onboarding directly instead of reloading the homepage
- logged-in users should now land on the wall page instead of seeing onboarding


## No-onboarding build
- all homepage onboarding UI was removed
- homepage now opens straight to the wall and service cards
- login/create account remain available through the dedicated /login/ page


## Login page button fix
- rebuilt /login/ so it no longer depends on the homepage onboarding stack
- login page now waits for the Netlify Identity widget directly, binds the buttons after the widget is ready, and redirects after successful auth


## Homepage UI tweaks
- removed the "Scroll sideways" button completely
- moved the live updates button to the bottom-right corner
- the start-here panel now fades away after the user scrolls off the starting position


## Web gallery preview update
- added NickEdwardsOfficial.com to the website gallery
- website gallery cards now include a “Preview here” button that opens the site inside a preview modal
- some websites may block iframe embedding; when that happens, the “Open live site” button is still available


## Web gallery background + Nick preview
- websites page now uses the new painted mountain background image
- NickEdwardsOfficial.com now has a live iframe preview directly inside its gallery card
- Preview modal remains available for Nick and the other sites


## Inline website previews
- website previews no longer open in a full-screen modal
- Preview here now expands an inline preview inside the selected project card
- this keeps the web gallery visible while viewing a site preview


## Frame spacing update
- increased the visible white matte space inside each wall frame
- spaced the homepage wall frames farther apart so they do not feel crowded


## Websites wall-only page
- websites page was rebuilt into a wall-only layout
- removed hero text, benchmark sections, and extra cards
- page now shows only the painted background image and framed website previews on the wall


## Mobile polish update
- tightened the mobile top navigation and made it horizontally scrollable instead of cramped
- improved the home welcome panel sizing, spacing, and readability on phones
- simplified mobile home content by hiding the benchmark band and stacking actions/cards cleanly
- improved gallery, login, request, account, and websites wall page spacing on small screens


## Bigger mobile website previews
- increased the size of the website wall frames on phones
- scaled the live iframe previews down inside the larger frames so more of each site is visible
- widened the mobile spacing between website frames so the gallery feels less cramped


## Mobile Nick preview fit fix
- made the Nick website frame noticeably larger on phones
- centered the live iframe preview horizontally instead of anchoring it to the left
- reduced footer crowding so more of the preview stays visible


## Stronger Start Here hide
- the Start here panel now disappears after only a small amount of wall movement
- once hidden, it is fully non-interactive and visually removed


## Mobile Nick preview proper fit
- replaced the fragile direct iframe scaling with a fixed desktop-size preview canvas scaled into the Nick frame
- centered the preview so the site fills the frame instead of leaving a blank white side
- slightly increased the Nick mobile frame size and spacing


## Edwards live preview added
- EdwardsHomeBuilders.com now uses a live iframe preview in the websites wall gallery
- mobile and desktop frame-three sizing was tuned so the Edwards site fits better inside the frame


## Scroll-safe website previews
- wall iframe previews are now non-interactive so scrolling across them will not trigger clicks, videos, or hover interactions inside the embedded site
- users can still use the Open live button to visit the real site


## Home wall-first layout
- removed the Start here panel from the homepage
- homepage now loads directly on the framed wall artwork
- initial wall position now centers on the middle artwork instead of starting on a blank section of wall


## Mobile-safe website previews
- on phones, the Nick and Edwards website frames now use static preview images instead of live iframes
- desktop still uses live iframe previews
- this prevents iPhone Safari from crashing or repeatedly reloading when the wall scroll passes over a live embedded site


## Safe live preview page
- Nick and Edwards now have a dedicated “Live preview” page for interactive scrolling through the actual site
- the wall itself stays safe and stable
- this preserves live preview functionality without the embedded wall preview crashing Safari or triggering videos while you scroll


## Nick scriptless live preview
- Nick's dedicated live preview page now loads in a stricter sandbox without scripts
- this keeps the preview scrollable while preventing the video/trailer scripts from opening fullscreen video or hijacking the page
- Edwards keeps the full live-preview sandbox with scripts enabled


## Locked preview behavior
- wall previews are now display-only: you can see the live embedded page, but taps and hovers on the wall preview cannot open links, launch videos, or navigate away
- only the explicit buttons should take users to another page
- dedicated live preview page was also tightened so the embedded site cannot jump the top-level page


## Edwards scrollable frame restore
- removed the Edwards “Live preview” button so it is back to just the frame preview plus Open live
- restored pointer interaction for the Edwards iframe so you can scroll through the site directly inside the picture frame again


## Sawtooth scrollable frame restore
- Sawtooth Thrift now uses the same live iframe preview style as Edwards
- restored pointer interaction for the Sawtooth iframe so you can scroll through the site directly inside the picture frame


## Gallery launcher update
- website frames now start hidden on the websites wall page
- added a centered `Gallery` button that reveals the floating site previews
- added a centered `Request a site` button linking to `/request-website/`


## App gallery page
- rebuilt `/apps/` as a floating phone-screen gallery
- added app icons for Aethon Fuel, ZachFitAI, and Sales Team OS
- clicking an icon now opens the configured web-app URL and highlights the matching phone screen
- `apps-gallery.js` contains the app URL config block; only Aethon is wired to a known live URL, and the other two can be filled in later


## Websites page controls restored
- restored the centered `Gallery` button on `/websites/`
- restored the centered `Request a site` button
- restored the centered `Zach Edwards LLC` background mark behind the framed websites


## Nick-focused website gallery
- changed the websites gallery initial position so it opens centered on NickEdwardsOfficial.com instead of Sawtooth Thrift


## Applications launcher + Aethon showcase
- rebuilt `/apps/` to match the websites launcher pattern with `Gallery` and `Request an app`
- apps gallery currently focuses on one visible app icon: Aethon Fuel
- clicking the Aethon icon opens `/apps/aethon/`
- `/apps/aethon/` rotates through the uploaded Aethon creative on a timer and includes a subtle `Open app` button to the live web app


## Aethon showcase polish
- removed the Aethon icon card from the dedicated Aethon page after the icon click
- improved background image fitting so the full creative is visible more often on desktop
- changed the slideshow so each image floats in from the right, stays visible, then drifts out left while the next one replaces it


## Aethon right-side layout
- moved the small Aethon badge to the top-right on desktop
- moved the main Aethon content card to the right side on desktop so it does not sit over the center of the background creative
- kept mobile centered


## Sawtooth monitor-style preview
- changed Sawtooth Thrift from a phone-like portrait frame to a wider desktop-monitor style frame in the website gallery
- kept the live iframe preview interactive so you can still scroll through the site inside the frame
- widened spacing so the larger monitor frame fits cleanly


## Websites page center mark
- restored a clean centered `Zach Edwards LLC` mark behind the website frames on `/websites/`


## Websites launcher lower position
- moved the `Gallery` and `Request a site` buttons lower on the websites page


## Home page frame-two fix
- restored the home page center frame back to the normal tall artwork shape
- kept the Sawtooth monitor-style preview only on the `/websites/` gallery page


## Aethon card smaller
- reduced the size of the Aethon info/open-app box on desktop so it covers less of the background creative


## Applications launcher lower position
- moved the `Gallery` and `Request an app` buttons lower on the applications page


## Larger main-page brand mark
- increased the size and weight of the `Zach Edwards LLC` label on the main home page


## Home frame fit tightened
- changed the main wall artwork to use `object-fit: cover`
- removed the white fill behind the home-page artwork
- this makes the art fill the frame better so the white gaps are gone


## Request pages simplified + loading fix
- removed the reload-on-init auth behavior that was making request pages feel like they were hanging / reloading
- simplified the website and app request pages so they are much less wordy
- hid the extra benchmark and clarity bands to keep the pages cleaner
- added a lighter loading state while a quote is being reviewed


## Checkout URL fix
- hardened Stripe checkout URL generation so the site always builds success/cancel URLs with an explicit `https://` scheme
- added fallbacks for `PUBLIC_BASE_URL`, `URL`, `DEPLOY_PRIME_URL`, and `DEPLOY_URL`
- added a client-side checkout URL normalizer so redirect still works even if a returned URL is missing its scheme


## Nick Safari gallery fix
- on iPhone / Safari, the NickEdwardsOfficial.com card now uses a still preview image inside the website gallery instead of the live iframe
- this avoids Safari auto-playing or hijacking the page when the gallery opens
- desktop browsers can still use the live iframe behavior for Nick


## Bio page
- added a dedicated `/bio/` page for Zachary Edwards using the supplied bio text
- added a `Bio` button to the main home-page top actions
- added a quick `Bio` link to the website and applications pages


## Combined gallery + universal create-project
- combined the web and app gallery into the hover/scroll work gallery on `/websites/`
- added simple `All / Web / Apps` filters while keeping the floating scroll behavior
- redirected `/apps/` into the combined gallery filtered to apps
- added one universal `/create-project/` intake for website, app, and custom system
- redirected the old request routes into the universal create-project page
