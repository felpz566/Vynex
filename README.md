# Vynex

Vynex is a web workspace prototype for creating projects, importing files from a computer or phone, and syncing source files with GitHub.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Create a production build with `npm run build`, then run it with `npm run start`.

## Project structure

```text
app/
├── layout.jsx
├── page.jsx
├── projects/
│   ├── page.jsx
│   └── projects.css
├── github/
│   ├── page.jsx
│   └── github.css
└── api/
    ├── projects/
    │   └── push/route.js
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

## GitHub OAuth setup

1. Open [GitHub Developer settings](https://github.com/settings/developers) and create an **OAuth App**.
2. Homepage URL: `https://vynex-studio.vercel.app` (or the active Vynex domain).
3. Authorization callback URL: `https://vynex-studio.vercel.app/api/integrations/github/callback`.
4. Copy the Client ID and generate a Client Secret.

Configure these Vercel environment variables:

- `GITHUB_APP_CLIENT_ID` — OAuth App Client ID.
- `GITHUB_APP_CLIENT_SECRET` — OAuth App Client Secret; server-only, never use the `NEXT_PUBLIC_` prefix.
- `GITHUB_APP_CALLBACK_URL` — must exactly match the callback URL in GitHub.
- `GITHUB_SESSION_SECRET` — 64 hexadecimal characters; generate with `openssl rand -hex 32`.

The OAuth flow requests `repo` and `user:email`. The `repo` scope permits repository read/write actions, which are required for pushing files. Review the GitHub authorization screen carefully. Tokens are kept in an encrypted server-side session cookie and are not returned to browser JavaScript.

After changing environment variables, redeploy Vynex. For local development, use `http://localhost:3000/api/integrations/github/callback` as the callback and register it in the OAuth App settings while testing locally.

## Routes

- `GET /api/integrations/github/start` — begins OAuth authorization. Add `?next=%2Fprojects` to return to Projects after login.
- `GET /api/integrations/github/callback` — validates OAuth state, exchanges the code, and establishes the encrypted session.
- `GET /api/integrations/github/status` — reports whether GitHub is connected without exposing the token.
- `GET /api/integrations/github/repos` — lists repositories accessible to the connected user.
- `GET /api/integrations/github/export?owner=OWNER&repo=REPO&ref=BRANCH` — streams a repository archive as ZIP.
- `POST /api/integrations/github/disconnect` — clears the local GitHub session cookie.
- `POST /api/projects/push` — creates a repository or pushes files to an existing repository's default branch.

The project push endpoint accepts 1–50 files, up to 2 MB per file and 4 MB total per request. It validates paths and payloads and requires a connected GitHub session.

## Current behavior and limitations

- `/projects` lets users create a starter project, import files or a folder when the browser supports it, remove files, and push to GitHub.
- Local drafts are stored in the current browser's local storage. They are not cloud-synced between devices until pushed to GitHub.
- GitHub authorization is per browser/device.
- `/github` lists repositories and downloads ZIP archives.
- The actual visual/code editor, Vynex-native accounts and cloud project storage, build workers, Windows `.exe` / Android package generation, AI assistance, and payments are not implemented yet.
- Plan cards are illustrative and checkout is not active.
