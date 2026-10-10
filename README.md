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
npm run preview
```

## Project structure

```text
src/
├── main.jsx                  # React entry point and global stylesheet
├── App.jsx                   # Page composition and shared UI state
├── styles.css                # Global styles, layout, and responsive rules
└── components/
    ├── Logo.jsx              # Reusable Vynex brand
    ├── WorkspacePreview.jsx  # Editor preview layout and local state
    ├── Sidebar.jsx           # Component list, layers, and properties panel
    ├── Editor.jsx            # Visual canvas and code-editor preview
    ├── FeatureSection.jsx    # Product features section
    ├── WorkflowSection.jsx   # How the product works section
    ├── PricingSection.jsx    # Free, Pro, and Creator plan cards
    ├── ProjectModal.jsx      # New-project modal
    └── Footer.jsx            # Site footer
```

## Current scope

- Responsive product landing page in Portuguese (Brazil)
- Modular React components with focused responsibilities
- Interactive visual/code editor preview
- Interactive project creation modal (session-only demo state)
- Illustrative Free, Pro and Creator pricing cards
- Responsive desktop and mobile layouts

## Not implemented yet

Authentication, persistent project storage, actual visual/code editing, build workers, Windows `.exe` / Android package generation, AI assistance, and payments. Pricing is illustrative and checkout is intentionally inactive until those features exist.
