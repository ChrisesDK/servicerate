# Service Rate

A small, spooky service-rating kiosk built as a Halloween costume prop. Guests can rate Vampire Food Services using four large faces, receive a suitably undead response, and activate the Bite Escape safety protocol when necessary.

The kiosk is designed for phones and tablets in landscape orientation. Portrait screens show a rotation prompt. The “Now serving” number starts at `V-001` on every page load and advances on every face tap until the page is refreshed.

## Live site

The project is configured to deploy to:

**https://chrisesdk.github.io/servicerate/**

## Local preview

The site is build-free. Serve the `site` directory with any static web server, for example:

```powershell
npx serve site
```

Opening `site/index.html` directly also works, although a local server is closer to GitHub Pages behavior.

## Deployment

Push the `main` branch to the public GitHub repository `ChrisesDK/servicerate`. The workflow in `.github/workflows/pages.yml` publishes the contents of `site` with GitHub Pages.

If Pages has not been used in the repository before, open **Settings → Pages** and set **Source** to **GitHub Actions** once. Every later push to `main` will deploy automatically.
