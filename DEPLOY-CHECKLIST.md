# Live deploy checklist

## Before deploy
- [ ] Run `sql/001_service_auth.sql`
- [ ] Run `sql/002_projects_admin.sql`
- [ ] Enable Netlify Identity
- [ ] Add `DATABASE_URL`
- [ ] Add `STRIPE_SECRET_KEY`
- [ ] Add `PUBLIC_BASE_URL`
- [ ] Add `FORM_SUBMIT_EMAIL=zach@zachedwardsllc.com`
- [ ] Add `ADMIN_EMAILS`
- [ ] Add `OPENAI_API_KEY` if you want live AI classification

## Live smoke tests
- [ ] Homepage onboarding shows for non-account visitors
- [ ] Signed-in user skips onboarding
- [ ] `/websites/`, `/apps/`, `/software/`, `/legal/` all load
- [ ] Website request returns a quote and shows agreement checkbox
- [ ] App request returns a quote and shows agreement checkbox
- [ ] FormSubmit email arrives
- [ ] Stripe deposit checkout redirects successfully
- [ ] `/account/` shows the quote and paid project after success redirect
- [ ] `/admin/` is hidden from non-admin users and works for admin users

## Pricing checks
- [ ] Basic website quote stays inside expected range
- [ ] Custom website quote stays inside expected range
- [ ] Basic app quote stays inside expected range
- [ ] Custom app quote stays inside expected range
