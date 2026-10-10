# Vynex

Vynex is a frontend prototype for a visual app builder with a code-first workflow.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
npm run start
```

## Project structure

```text
app/
├── layout.jsx
├── page.jsx
└── api/
    └── integrations/
        └── github/
            ├── start/route.js
            ├── callback/route.js
            ├── status/route.js
            ├── repos/route.js
            ├── export/route.js
            └── disconnect/route.js
src/
├── App.jsx
├── styles.css
├── lib/
│   ├── github-api.js
│   └── github-session.js
└── components/
    ├── Logo.jsx
    ├── WorkspacePreview.jsx
    ├── Sidebar.jsx
    ├── Editor.jsx
    ├── FeatureSection.jsx
    ├── WorkflowSection.jsx
    ├── PricingSection.jsx
    ├── ProjectModal.jsx
    └── Footer.jsx
```

## GitHub repository connection and ZIP export

The GitHub integration is a server-side API. It can authorize on desktop and mobile browsers and download a repository archive as a ZIP. GitHub access tokens are never returned by the API to browser JavaScript; the session is encrypted with AES-256-GCM and stored in an HttpOnly cookie. No Vynex account/login is required yet, so each browser/device must authorize GitHub separately.

### Configure a GitHub App

1. Open GitHub **Settings → Developer settings → GitHub Apps → New GitHub App**.
2. Set the Homepage URL to `https://vynex-studio.vercel.app` (or your active Vynex domain).
3. Set the callback URL to `https://vynex-studio.vercel.app/api/integrations/github/callback`.
4. Under repository permissions, grant **Contents: Read-only** and **Metadata: Read-only**. Avoid write permissions.
5. Create the app and install it only on the repositories that Vynex should be allowed to read.
6. Copy its Client ID and generate a Client Secret.

Add these environment variables in Vercel (and locally in an untracked `.env.local` file):

- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET` — server-only; never prefix with `NEXT_PUBLIC_`
- `GITHUB_APP_CALLBACK_URL` — must exactly match the GitHub App callback URL
- `GITHUB_SESSION_SECRET` — 64 hexadecimal characters. Generate one with `openssl rand -hex 32`.

Redeploy after configuring the variables. For local development, set the callback URL to `http://localhost:3000/api/integrations/github/callback` and add that exact callback URL to the GitHub App configuration while testing locally.

### API routes

- `GET /api/integrations/github/start` — starts GitHub authorization.
- `GET /api/integrations/github/callback` — validates OAuth state and establishes the encrypted session.
- `GET /api/integrations/github/status` — returns the connection state and GitHub login, never the access token.
- `GET /api/integrations/github/repos` — lists repositories available to the authorized GitHub App/user.
- `GET /api/integrations/github/export?owner=OWNER&repo=REPO&ref=BRANCH` — streams a ZIP archive of a repository branch/tag/commit for download.
- `POST /api/integrations/github/disconnect` — clears the local connection cookie.

Example export URL:

```text
/api/integrations/github/export?owner=felpz566&repo=Vynex&ref=main
```

The browser's normal download flow works on desktop and mobile. Export requires an active GitHub session and access to the selected repository. The UI to browse repositories and start downloads still needs to be connected to these endpoints.

## Current scope

- Responsive product landing page in Portuguese (Brazil)
- Modular React components with focused responsibilities
- Interactive visual/code editor preview
- Interactive project creation modal (session-only demo state)
- Illustrative Free, Pro and Creator plan cards
- GitHub authorization and repository ZIP-export API

## Not implemented yet

Vynex user accounts, persistent project storage, actual visual/code editing, build workers, Windows `.exe` / Android package generation, AI assistance, and payments. Pricing is illustrative and checkout is intentionally inactive until those features exist.
