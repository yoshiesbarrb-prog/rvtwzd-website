# Revit Wizard Static Site

This is a clean static replacement for the current Google Sites page at `https://www.rvtwzd.com/`.

It keeps the same core content:

- RvtWzd.com hero section
- iRay render showcase
- Carousel images from `assets/Carousel/`
- YouTube video sections from `videos.txt`
- Contact/request form that opens a pre-filled email

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static web server.

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Hosting

This site can be hosted on GitHub Pages, Cloudflare Pages, Netlify, Vercel, or any cheap static host. Point the `rvtwzd.com` DNS records at the host you choose.

## Contact Form

The contact form uses `mailto:` and opens the visitor's email app with a pre-filled message to `RevitWizard@proton.me`. This avoids third-party form services and the phishing warnings they can trigger in browser security extensions.

## Public Repo Safety

Do not commit passwords, API keys, private downloads, paid plugin files, customer files, or private Revit models. This site is static and public, so every file in the repository can be downloaded by visitors.

The browser code only reads local JSON manifests and public YouTube/image URLs. If you add external links to `videos.txt`, keep them to public `https://` URLs.

Public Revit family downloads can live in `assets/Families/` and be linked from `videos.txt` using a relative path such as `assets/Families/LED Arc.rfa`.

## Assets

The original Google image URLs block direct downloads with 403 errors, so the hero image was captured from the rendered public page. The iRay carousel uses the original render files in `assets/Carousel/`.

## Updating The Carousel

Add or delete image files in `assets/Carousel/`, then run:

```powershell
.\scripts\update-carousel.ps1
```

That rebuilds `assets/carousel.json`, which is what the site uses for the carousel. Supported image types are `.jpg`, `.jpeg`, `.png`, `.webp`, and `.gif`.

## Updating The Videos

Add, remove, or reorder lines in `videos.txt`, then run:

```powershell
.\scripts\update-videos.ps1
```

Each video line uses this format:

```text
YouTube URL | Heading | Description | Optional link label | Optional link URL
```

That rebuilds `assets/videos.json`, which is what the site uses for the video sections.