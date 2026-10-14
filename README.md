# RVSPly — Event Management

RVSPly is a campus event discovery and RSVP app. The static frontend calls a Flask API backed by PostgreSQL for registration, login, events, RSVPs, and guest lists.

**Live website:** [Open the RVSPly frontend preview](https://akhileshsaravate.github.io/RVSPly-Event-Management/html/)

## Project team

**Project by**

- Akhilesh Saravate (1132231320)
- Jay Mokal (1132230864)
- Chinmay Pophale (1132231116)

**Under the guidance of Navnath Shete Sir**

## Features

- Responsive landing page with navigation, event-focused content, and calls to action
- Registration and login backed by the Flask API
- Event creation, editing, and deletion backed by PostgreSQL
- RSVP tracking and shared guest lists
- Light/dark theme preference stored in the browser
- Flask API with PostgreSQL storage

## Cloud demo architecture

- **Neon** provides PostgreSQL.
- **Render** hosts the Flask API.
- **Cloudflare Pages** serves the static frontend from the `frontend` directory.

The frontend API settings are in `frontend/script/config.js`. Keep credentials out of this file; set them in the cloud provider's environment settings.

```js
window.RVSPLY_DEMO_MODE = false;
window.RVSPLY_API_BASE = "https://rvsply-api-demo.onrender.com";
```

Change the API URL if the Render service uses another name.

## Create the Neon database

Run the following SQL in the Neon SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE,
    time TIME,
    venue TEXT,
    description TEXT,
    image_url TEXT DEFAULT '',
    created_by INTEGER REFERENCES users(id),
    visibility TEXT DEFAULT 'public'
);

CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    time_stamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Use Neon's pooled connection string as Render's `DATABASE_URL`. Keep it private.

## Deploy the Flask API on Render

Create a free Web Service from this repository with these settings:

| Setting | Value |
| --- | --- |
| Branch | `cloud-deployment` |
| Root directory | `backend` |
| Runtime | Python |
| Build command | `pip install -r requirements.txt` |
| Start command | `gunicorn --bind 0.0.0.0:$PORT app:app` |
| Health check path | `/health` |

Add these environment variables in Render:

- `DATABASE_URL`: Neon's pooled connection string
- `FRONTEND_URL`: the deployed frontend page URL, ending in `/html/index.html`
- `FRONTEND_ORIGINS`: the frontend origin only (for example, `https://your-site.pages.dev`)

The free Render web service sleeps after 15 minutes of inactivity and can take about a minute to wake. Free services are intended for demos and testing.

## Deploy the frontend on Cloudflare Pages

Create a Pages project using the `cloud-deployment` branch. Set the project root to `frontend`; no build command is required, and the output directory is `.`. The landing page URL ends with `/html/index.html`.

## Project structure

```text
frontend/
  html/       Landing page and event dashboard
  images/     Frontend image assets
  script/     UI behavior, API configuration, and preview data flow
  style/      Responsive page styles
backend/
  app.py      Flask API
  schema.sql  PostgreSQL schema
  requirements.txt
```

## Landing page photography

- Campus club fair photograph: [Unsplash photo](https://unsplash.com/photos/a-group-of-people-sitting-on-the-grass-88Z2PpC5jqU)
- Student organization fair photograph: [Unsplash photo](https://unsplash.com/photos/a-group-of-people-at-an-outdoor-event-m17nqsThLeY)
