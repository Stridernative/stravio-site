# stravio-site

The Stravio marketing site, live at https://stravioai.com. Static HTML with vanilla Three.js. No framework, no build step: what is in this repo is exactly what ships.

## How it deploys

Push to `main` and GitHub Pages redeploys the site. There is no other pipeline. The `CNAME` file binds the custom domain; do not delete it.

## Architecture map

```
stravio-site/
├── index.html          Homepage. Cinematic scroll journey along the path.
├── services.html       Three ways in: Diagnostic, Outcomes, Training.
├── about.html          Founder story, the road traveled.
├── contact.html        Arrival at the dot. Contact form.
├── CNAME               Custom domain binding for GitHub Pages.
├── assets/
│   ├── css/            All styling. One shared stylesheet.
│   └── js/             Site behavior and 3D scenes.
│                       site.js = nav, reveals, shared page behavior.
│                       scenes.js = Three.js scenes, one per page beat.
└── vendor/
    ├── three.module.min.js   Three.js r178, vendored. Imports the core file
    └── three.core.min.js     as a sibling. BOTH must ship or scenes fail silently.
```

## Rules of the house

- ES modules everywhere, so local preview needs a server: `python -m http.server` from the repo root. Opening files directly will not run the scenes.
- This repo is public. No secrets, no client names, no unshipped copy. Ever.
- The 3D carries structure and story. Exact numbers and key information always live in flat HTML text, never inside the 3D scene.
- Brand is locked: Midnight #11192A, Brass #C9853A as accent only, Pearl #F2EFE7. No gradients, no glow.
