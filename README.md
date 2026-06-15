# NeuroTrace Interactive

NeuroTrace Interactive is a polished static web demo that presents an illustrative cognitive pathway explorer for AI-style responses. A user enters a prompt, receives a locally simulated response, and sees fictional activation zones animate around a central AI core.

The project is designed for public showcase use: premium dark visual design, responsive layout, accessible controls, local-only interaction, and no external runtime dependencies.

## Run locally

Open `index.html` directly in a modern browser. No installation, backend, build step, API key, or framework is required.

You can also serve it locally from the project directory:

```bash
python3 -m http.server 8000
```

Then visit `http://127.0.0.1:8000/index.html`.

## Privacy note

All prompt handling and response simulation happens locally in the browser. The project does not use third-party scripts, analytics, cookies, localStorage, external APIs, accounts, databases, or network-based processing.

## Important disclaimer

NeuroTrace is an illustrative visualization of AI response dynamics. It does not expose real neural activations, hidden prompts, proprietary model internals, internal scoring systems, real evaluation frameworks, or certified AI safety audit results.

## Deployment

Because this is a static HTML/CSS/JavaScript project, it can be deployed directly to GitHub Pages, IONOS, Netlify, Vercel, Cloudflare Pages, or any static hosting provider. For GitHub Pages, publish the repository root and set `index.html` as the landing page.

## Files

- `index.html` — page structure, public disclaimer, demo controls, visualization container, and social metadata.
- `styles.css` — premium dark UI, responsive layout, animations, focus states, and reduced-motion support.
- `script.js` — local prompt classification, simulated responses, activation scoring, loading states, and animation orchestration.
