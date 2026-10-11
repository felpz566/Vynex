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
├── login/
│   ├── page.jsx
│   └── login.css
├── projects/
│   ├── page.jsx
│   └── projects.css
├── github/
│   ├── page.jsx
│   └── github.css
└── api/
    ├── auth/
    │   └── google/
    │       ├── start/route.js
    │       ├── callback/route.js
    │       ├── status/route.js
    │       └── logout/route.js
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
│   ├── github-session.js
│   └── cloud-session.js
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

## Google / Gmail sign-in

Gmail and Google sign-in use the same Google account. The `/login` page offers both Google and GitHub authorization.

1. Open [Google Cloud Console — Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an OAuth client ID of type **Web application**.
3. Add `https://vynex-studio.vercel.app` under **Authorized JavaScript origins**.
4. Add `https://vynex-studio.vercel.app/api/auth/google/callback` under **Authorized redirect URIs**.
5. Copy the client ID and client secret into Vercel environment variables.

Required variables:

- `GOOGLE_OAUTH_CLIENT_ID` — Google OAuth client ID.
- `GOOGLE_OAUTH_CLIENT_SECRET` — server-only secret; never use the `NEXT_PUBLIC_` prefix.
- `GOOGLE_OAUTH_CALLBACK_URL` — must exactly match the authorized redirect URI.
- `CLOUD_SESSION_SECRET` — 64 hexadecimal characters; generate with `openssl rand -hex 32`.

The backend uses OAuth state validation, checks Google's verified email, and stores the resulting account identity in an encrypted HttpOnly cookie. It does not send the Google Client Secret to browser code. `GET /api/auth/google/status` reports the current Google login state. `POST /api/auth/google/logout` clears the local session.

For local development, add `http://localhost:3000` to authorized JavaScript origins and `http://localhost:3000/api/auth/google/callback` to authorized redirect URIs. Set `GOOGLE_OAUTH_CALLBACK_URL` to that exact local callback while testing locally.

**Important:** Google sign-in establishes the Vynex identity session, but does not by itself create cloud-synced project storage. At this stage, project drafts remain in the current browser's local storage until pushed to GitHub. Persistent Vynex cloud projects need a dedicated database/storage configuration.

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

The GitHub OAuth flow requests `repo` and `user:email`. The `repo` scope permits repository read/write actions, which are required for pushing files. Tokens are kept in an encrypted server-side session cookie and are not returned to browser JavaScript.

After changing environment variables, redeploy Vynex.

## Routes

- `GET /api/auth/google/start` — begins Google authorization.
- `GET /api/auth/google/callback` — validates OAuth state and establishes the encrypted Google session.
- `GET /api/auth/google/status` — reports Google login state without exposing secrets.
- `POST /api/auth/google/logout` — clears the local Google session cookie.
- `GET /api/integrations/github/start` — begins GitHub authorization. Add `?next=%2Fprojects` to return to Projects after login.
- `GET /api/integrations/github/callback` — validates OAuth state, exchanges the code, and establishes the encrypted session.
- `GET /api/integrations/github/status` — reports whether GitHub is connected without exposing the token.
- `GET /api/integrations/github/repos` — lists repositories accessible to the connected user.
- `GET /api/integrations/github/export?owner=OWNER&repo=REPO&ref=BRANCH` — streams a repository archive as ZIP.
- `POST /api/integrations/github/disconnect` — clears the local GitHub session cookie.
- `POST /api/projects/push` — creates a repository or pushes files to an existing repository's default branch.

The project push endpoint accepts 1–50 files, up to 2 MB per file and 3 MB total per request. It validates paths and payloads and requires a connected GitHub session.

## Current behavior and limitations

- `/login` provides Google/Gmail and GitHub sign-in choices.
- `/projects` lets users create a starter project, import files or a folder when the browser supports it, remove files, and push to GitHub.
- Local drafts are stored in the current browser's local storage. They are not cloud-synced between devices until pushed to GitHub.
- Google and GitHub are independent login sessions at this stage.
- `/github` lists repositories and downloads ZIP archives.
- The visual/code editor, Vynex-native cloud project storage, AI assistance, and payments are not implemented yet.\n- Windows `.exe` packaging is available for simple web projects with a root `index.html` and HTML/CSS/JS assets. The build runs on GitHub Actions Windows runners; GitHub must be connected and the OAuth grant must include `repo`, `user:email`, and `workflow`. The feature creates a private build repository in the connected GitHub account for each build (it is not automatically deleted) and currently accepts up to 50 source files / 3 MB total. Projects that require a server, database, custom native modules, or npm build scripts are not supported by this first version.\n- The installer is an Electron wrapper around the web project; it is not code obfuscation or a security boundary. Review untrusted project code before building it.
- Plan cards are illustrative and checkout is not active.
