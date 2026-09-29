# RVSPly — Frontend Preview

RVSPly is a campus event discovery and RSVP experience. The **frontend phase is ready for demonstration**: it includes a responsive landing page, preview account flow, event dashboard, event creation/editing/deletion, RSVP selection, guest lists, and a saved theme preference.

## Current project phase

The frontend currently runs in **preview mode** and stores its sample account, events, and RSVP responses in the browser's local storage. This makes it possible to demonstrate the interface without installing Python, PostgreSQL, or starting the backend. Preview data stays in that browser and is not a real account or shared database record.

The backend and cloud integration are the next project phase and are planned for the coming month. The existing Flask backend is in `backend/`, but it is not required for the frontend preview. Do not describe the preview login or events as production authentication or cloud-backed data.

## Run the frontend preview

1. Install Visual Studio Code and the **Live Server** extension.
2. Download/clone the repository and open its folder in VS Code.
3. In the VS Code file explorer, open `frontend/html/index.html`.
4. Right-click in the file and select **Open with Live Server**.
5. Select **Get started**, make a preview account, then sign in. Create an event or RSVP to see the dashboard interactions.

No Python packages or database setup are needed for this frontend-only preview. The preview account password is stored locally in the browser and is only for demonstration; do not reuse a real password.

## Frontend features ready to present

- Responsive landing page with navigation, event-focused content, and calls to action
- Registration and login preview flow
- Event dashboard populated with sample events
- Create, edit, and delete events in the current browser
- RSVP choices and local guest list
- Light/dark theme preference
- Clear preview labels showing that backend integration is in progress

## Next phase: backend and cloud integration

The frontend has a configurable API base URL in `frontend/script/config.js`. It is currently in preview mode:

```js
window.RVSPLY_DEMO_MODE = true;
window.RVSPLY_API_BASE = "http://127.0.0.1:5000";
```

When backend integration begins, the API team can switch the preview flag off, configure the deployed API URL, and connect the forms and event actions to Flask. The intended cloud architecture is a static frontend host/CDN, a hosted Flask API, and managed PostgreSQL. Cloud infrastructure is a planned part of the upcoming phase; this repository does not currently provision or deploy those services.

## Project structure

```text
frontend/
  html/       Landing page and event dashboard
  images/     Frontend image assets
  script/     UI behavior, API configuration, and preview data flow
  style/      Responsive page styles
backend/
  app.py      Existing Flask API prototype
  requirements.txt
```

## Viva introduction

“RVSPly is a campus event management frontend that helps people discover events, create event listings, and respond to invitations. The current deliverable is the frontend preview, built with HTML, CSS, and JavaScript. It includes a landing page and interactive event dashboard. Preview data is saved locally in the browser so the frontend can be demonstrated independently. During the next month, we plan to connect it to the Flask backend and PostgreSQL, then deploy the frontend, API, and database on cloud services.”

### Likely viva questions

**What have you completed so far?**
The responsive frontend: landing page, preview sign-in flow, event dashboard, event forms, RSVP interaction, guest list, and theme toggle.

**Why does the app work without the backend right now?**
Preview mode uses browser local storage and sample data. This supports a frontend demonstration while backend integration is still in progress.

**Is the preview login secure or shared across users?**
No. It is only a local demonstration. A real login must be handled by the backend, use secure password hashing and session/token controls, and communicate over HTTPS.

**What is planned for cloud computing?**
We plan to host the static frontend on a web host/CDN, deploy the Flask API as a cloud application, and use a managed PostgreSQL database. This keeps the interface, application logic, and data tiers separate. Those services are planned and are not yet deployed by this repository.

**How will the frontend connect to the backend?**
JavaScript will send HTTP requests to Flask API endpoints. The base API URL is configured in `frontend/script/config.js`; the next integration phase will connect the forms and dashboard actions to those endpoints.

**What is the next step?**
Agree on the API contract and database schema, connect the UI actions to the API, then configure and deploy the API and database in the selected cloud environment.

## Existing backend prototype

The Flask application and pinned Python dependencies are retained under `backend/`. They are not necessary to open the frontend preview. Backend database configuration/schema and deployment still need work before full-stack use.

## Contributors

- Amaan Shaikh
- Tejas Bafna
- Ishwarsingh Rao