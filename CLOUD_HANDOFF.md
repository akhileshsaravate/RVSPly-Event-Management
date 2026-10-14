# RVSPly Cloud Deployment Handoff

Status recorded: October 14, 2026. This guide summarizes the current demo architecture, cloud configuration, changes made, and steps needed to finish the latest frontend rollout.

## Project and deployment status

- Git repository: [RVSPly-Event-Management](https://github.com/akhileshsaravate/RVSPly-Event-Management)
- Deployment branch: `cloud-deployment`
- Latest backend commit: `74336fb` — `Add RSVP QR event check-in flow`
- Render API: `rvsply-api-demo` at `https://rvsply-api-demo.onrender.com`
- Cloudflare Pages project: `rvsply-event-management-demo` at `https://rvsply-event-management-demo.pages.dev`
- Neon PostgreSQL project: `red-poetry-53763923`, database `neondb`, production branch `br-royal-cake-b56tbekq`
- Render reports commit `74336fb` as **Deploy succeeded | Live**.
- The Neon check-in migration completed successfully on the production branch.
- The latest QR check-in frontend code is in this repository. It still needs to be uploaded and deployed to Cloudflare Pages before the complete flow is available on the public website.

## Cloud architecture

| Service | Role | Project/service |
| --- | --- | --- |
| Cloudflare Pages | Hosts the static HTML, CSS, images, and JavaScript frontend | `rvsply-event-management-demo` |
| Render | Runs the Flask API | `rvsply-api-demo` |
| Neon | Hosts the PostgreSQL database | `neondb` on the production branch |

The frontend's API URL is set in `frontend/script/config.js` to `https://rvsply-api-demo.onrender.com`. The frontend is static, so it contains no database password. Render connects to Neon using the private `DATABASE_URL` environment variable.

The repository also contains a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` for a separate GitHub Pages preview. It runs for the `frontend-cloud-readiness` branch or a manual workflow dispatch; it is not the hosting path for the current Cloudflare Pages demo.

## Render service settings

The service is configured from the `cloud-deployment` branch with `backend` as its root directory.

| Setting | Value |
| --- | --- |
| Runtime | Python |
| Build command | `pip install -r requirements.txt` |
| Start command | `gunicorn --bind 0.0.0.0:$PORT app:app` |
| Health endpoint | `/health` |

Configure these variables in the Render dashboard. Never put their secret values in source control or this guide.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled PostgreSQL connection string |
| `FRONTEND_URL` | Public frontend URL; use the deployed site's landing page URL |
| `FRONTEND_ORIGINS` | Exact Cloudflare Pages origin allowed to call the API |

For `FRONTEND_ORIGINS`, use the origin only, such as `https://rvsply-event-management-demo.pages.dev` (no path, trailing slash, or final dot). If the Pages domain changes, update this value and `FRONTEND_URL` in Render.

Render's free service may sleep while idle, so the first request after inactivity can take longer. Check the current Render dashboard for plan limits and billing details.

## Neon database

The base schema is in `backend/schema.sql`. The check-in database migration is `backend/migrations/001_add_rsvp_checkin.sql`. It adds a unique check-in token and a `checked_in_at` timestamp to guest RSVPs, then assigns tokens to existing guest rows. This migration was run successfully in the Neon production SQL Editor.

For another database environment, create the base schema first, then apply the migration once. The migration uses `IF NOT EXISTS` for its schema additions and can safely be rerun, but always verify the selected Neon project, branch, and database before running SQL.

Use Neon's pooled connection string for Render's `DATABASE_URL`. Keep it private; do not paste it in chat, screenshots, documentation, or frontend files.

## RSVP QR check-in flow

1. A guest RSVPs for an event. The API creates a private random check-in token for the RSVP and returns a QR code.
2. The QR points to the frontend's `html/checkin.html` page. The token is in the URL fragment (`#token=...`), which browsers do not send in the HTTP request to Cloudflare.
3. Scanning the QR shows the RSVP and event details.
4. The event organizer signs in and confirms entry. The API records `checked_in_at`; subsequent scans show that the guest is already checked in. RSVPs marked `Not Going` cannot be checked in.
5. The event guest list displays each guest's check-in status.

The supporting API endpoints are `POST /checkin/lookup` and `POST /checkin/confirm`. The RSVP QR is a bearer token: anyone who has a copy can view the corresponding RSVP details. Avoid posting or sharing QR images publicly.

This is a project demo implementation. The existing login flow stores the user ID in browser storage, and the check-in request sends that ID to the API. The API compares it with the event owner, but this is not equivalent to a signed server-side session or robust authorization. Do not rely on it for production admission/security without adding proper authentication and authorization.

## Changes made for the cloud demo

- Connected the Flask API to PostgreSQL through environment-based configuration and prepared the Neon schema.
- Set the frontend API base URL for the Render service and configured the cross-origin frontend/API integration.
- Fixed event-list serialization for PostgreSQL `TIME` values so events can be returned as JSON.
- Improved registration/login feedback and cloud demo messaging.
- Added per-RSVP QR tokens, the check-in page, organizer confirmation, repeat-check-in handling, and visible check-in status in guest lists.
- Applied the check-in migration in Neon and deployed the latest API commit to Render.

Recent deployment commits on `cloud-deployment` include:

- `357ccbf` — Prepare cloud deployment for Flask and Neon
- `754027e` — Update cloud demo messaging
- `0e3284e` — Show registration progress and API errors
- `c99a269` — Fix event list JSON serialization
- `74336fb` — Add RSVP QR event check-in flow

## Finish the Cloudflare Pages rollout

The latest frontend upload bundle is `rvsply-frontend.zip` in the repository root. The complete project archive also includes the editable frontend source under `frontend/`.

To publish the QR check-in frontend:

1. In the Cloudflare Pages project `rvsply-event-management-demo`, start a new direct upload deployment.
2. Upload the contents of the latest `frontend` directory, including `index.html`, `html/`, `images/`, `script/`, and `style/`. Make sure `html/checkin.html` and `script/checkin.js` are included.
3. Deploy, then verify that `https://rvsply-event-management-demo.pages.dev/html/checkin.html` loads.
4. Create a **new RSVP** and scan its new QR. QR codes created before the check-in change still contain the old destination and need to be regenerated by submitting a fresh RSVP.
5. Sign in as the event organizer and confirm check-in. Review the guest list to verify the status is shown.

The API is already live; deploying the updated static frontend is the remaining cloud rollout step for this feature. No end-to-end QR scan was performed as part of this handoff.

## Files to know

- `frontend/script/config.js` — frontend API base URL
- `frontend/html/checkin.html` and `frontend/script/checkin.js` — QR check-in experience
- `frontend/script/main.js` — login return to an in-progress check-in
- `frontend/script/dashboard.js` — RSVP QR presentation and guest check-in status
- `backend/app.py` — Flask API, PostgreSQL operations, RSVP and check-in endpoints
- `backend/schema.sql` — base database schema, including check-in columns
- `backend/migrations/001_add_rsvp_checkin.sql` — Neon migration for existing database installations
- `backend/requirements.txt` — Python dependencies

## Cost and secrets

The demo was configured using the providers' free options where available. Free-tier quotas, limits, and terms can change; check each provider dashboard before relying on a service or incurring charges. Do not commit `DATABASE_URL`, passwords, API keys, or other secrets. Keep cloud credentials in Render/Neon/Cloudflare account settings and rotate any credential that has been exposed.
