# Hamza Muhammad Sohail — Portfolio

Personal portfolio website. Plain HTML, CSS and JavaScript with no build step.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploy

Every push deploys to GitHub Pages via `.github/workflows/deploy.yml`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Live: https://hamzaansari22.github.io/portfolio/

## Contact form

Set `data-formspree` on `#contactForm` in `index.html` to your Formspree form ID to deliver messages to your inbox. When empty, the form opens the visitor's email app instead.
