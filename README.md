# Personal Portfolio Website with Admin Dashboard

A complete, responsive **personal portfolio website** with a functional
**Admin Dashboard** — built with **only HTML, CSS and vanilla JavaScript**.
No frameworks, no backend, no database. All content is managed through the
browser's **LocalStorage**, so the admin dashboard and the public website stay
in sync automatically.

![Stack](https://img.shields.io/badge/HTML-CSS-JS-6366f1) ![Storage](https://img.shields.io/badge/Storage-LocalStorage-34d399)

---

## ✨ Features

### Public website
- **Home** — hero with profile image, name, professional title, intro,
  "View My Projects" / "Contact Me" buttons, social links, skills section,
  featured projects, latest blog posts and a call-to-action
- **About** — bio, education, goals and interests, loaded dynamically
- **Projects** — cards with image, title, description, technology badges,
  GitHub + Live Demo buttons; search + technology filters
- **Blog** — post cards with featured image, category, date and a reader
  modal; search + category filters; **only published posts are visible**
- **Contact** — validated form (name, email, subject, message) that saves
  messages to LocalStorage for the admin to read
- Space / developer-terminal theme (following a "command center" reference
  design): near-black navy with a subtle **starfield**, cyan + magenta accent
  palette, Orbitron display headings, numbered section labels ("01 / WHAT I DO"),
  a hero **typewriter effect**, uppercase buttons with arrows, and a gradient
  beam along the top edge — plus a clean light theme via the toggle
- Hand-drawn **inline SVG icon set** (no emoji, no icon fonts, no CDN — works
  fully offline); brand icons for GitHub / LinkedIn / X / Email
- Glassmorphism cards, subtle reveal-on-scroll animations,
  hover effects, smooth scrolling, scroll-to-top button, dark/light mode,
  fully responsive (hamburger menu on mobile)

### Admin dashboard (`admin/`)
- **Login** — demo authentication (see credentials below)
- **Dashboard** — profile photo panel (view + change your picture right from the
  dashboard, with sidebar avatar), a **website logo panel** (upload or paste a
  logo URL — it replaces the default dot in the navbar), live stat cards
  (projects, skills, posts, messages) + recent projects / posts / messages
- **Profile** — edit name, title, intro, bio, profile image (upload or URL),
  education (dynamic rows), goals, interests and social links
- **Skills** — full CRUD with a visual SVG icon picker (16 icons) + level
  (0–100%), search
- **Projects** — full CRUD with image upload, technologies, GitHub & demo
  URLs, search
- **Blog** — full CRUD with featured image, category, date, content and a
  publish/unpublish switch; search + status filters
- **Messages** — table of contact form submissions; view, mark read/unread,
  delete; search + status filters
- **Settings** — site name, description, dark/light theme, accent color
  (presets + custom), social links, and a "reset all data" option
- Sidebar navigation (hamburger on mobile), toast notifications, custom
  confirm dialogs, empty states, form validation everywhere

### Admin → Public flow
```
ADMIN                    PUBLIC
Add Project        →  save to LocalStorage  →  project appears on the site
Visitor submits    →  save to LocalStorage  →  admin reads the message
```

---

## Demo login

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@example.com` |
| Password | `Phantom`           |

> ⚠️ **Security notice — demo authentication only.**
> This project authenticates **entirely in the browser**. The credentials and
> the login check live in client-side JavaScript, so anyone can open the
> source and bypass the login. **Do not use this for production.** A real
> application needs a backend with proper session management (e.g. hashed
> passwords, httpOnly cookies, rate limiting). This login exists purely to
> demonstrate the flow.

---

## Getting started

No build step, no dependencies. Either:

1. **Double-click `index.html`** — everything works from `file://`, or
2. Run a tiny local server for the cleanest experience:

```bash
cd personal-portfolio
python3 -m http.server 8080
# open http://localhost:8080
```

Admin dashboard: open `admin/login.html` (or click **Admin** in the nav)
and sign in with the demo credentials above.

---

## Folder structure

```
personal-portfolio/
│
├── index.html            # Home (hero, skills, featured work, latest posts)
├── about.html            # About (bio, education, goals, interests)
├── projects.html         # Projects (searchable card grid)
├── blog.html             # Blog (published posts + reader modal)
├── contact.html          # Contact form → saves to LocalStorage
│
├── admin/
│   ├── login.html        # Demo login page
│   ├── dashboard.html    # Stat cards + recent items
│   ├── profile.html      # Edit profile, education, goals, interests, socials
│   ├── skills.html       # CRUD skills
│   ├── projects.html     # CRUD projects
│   ├── blog.html         # CRUD posts + publish/unpublish
│   ├── messages.html     # Read/manage contact messages
│   └── settings.html     # Site name, theme, accent, socials, reset
│
├── css/
│   ├── style.css         # Design system + public site styles
│   ├── responsive.css    # Breakpoints for tablet / mobile
│   └── admin.css         # Dashboard layout, tables, modals
│
├── js/
│   ├── icons.js          # Inline SVG icon library (`icon('name')` helper)
│   ├── storage.js        # LocalStorage layer, seed data, toasts, utils
│   ├── main.js           # Public site rendering & interactions
│   ├── auth.js           # Demo auth, route guard, admin shell
│   ├── dashboard.js      # Admin dashboard logic
│   ├── profile.js        # Admin profile CRUD
│   ├── skills.js         # Admin skills CRUD
│   ├── projects.js       # Admin projects CRUD
│   ├── blog.js           # Admin blog CRUD
│   ├── messages.js       # Admin messages management
│   └── settings.js       # Admin settings
│
├── images/
│   ├── profile.svg               # Default profile picture
│   ├── projects/project1-4.svg   # Default project images
│   └── blog/blog1-3.svg          # Default blog images
│
└── README.md
```

---

## LocalStorage keys

| Key              | Contents                                                            |
|------------------|---------------------------------------------------------------------|
| `profile`        | Name, title, intro, bio, image, education, goals, interests         |
| `skills`         | `[{ id, name, level, icon }]` with icon keys from the SVG set     |
| `projects`       | `[{ id, title, description, image, technologies[], github, demo }]` |
| `posts`          | `[{ id, title, category, content, image, published, date }]`        |
| `messages`       | `[{ id, name, email, subject, message, date, read }]`               |
| `settings`       | Site name, description, theme, accent, socials                      |
| `adminLoggedIn`  | SessionStorage flag for the demo login                              |

The site seeds itself with realistic demo content on first load. Use
**Settings → Reset all data** to restore it at any time.

## Image handling

Since there is no backend, images are either:

- **Normal files** in `images/` (defaults shipped with the project), or
- **Uploaded via the admin** — read with the File API, **auto-compressed in
  the browser** (resized to max 1280 px for projects/blog, 600 px for avatars
  and logos, re-encoded as WebP/JPEG at ~82% quality), then stored as Base64
  data-URLs. A 3 MB photo typically becomes ~150–300 KB, so LocalStorage
  (~5 MB) can hold dozens of images. Sources up to 15 MB are accepted.

For production, swap Base64 uploads for a real file host and store the URL.

## ✅ Requirements checklist

- [x] Only HTML, CSS, JavaScript — no frameworks or backends
- [x] Public site: Home, About, Skills, Projects, Blog, Contact
- [x] Admin dashboard with sidebar navigation and login
- [x] Full CRUD for skills, projects, blog posts; messages management
- [x] Contact form → LocalStorage → visible in admin
- [x] Settings: site name/description, theme, accent color, socials
- [x] Dark/light mode with persistent setting
- [x] Toasts, confirm dialogs, empty states, form validation
- [x] Search + filters (projects, posts, messages, skills)
- [x] Responsive: desktop, laptop, tablet, mobile
- [x] Demo auth clearly documented as non-secure

---

Built with ♥ using nothing but the browser.

---

## 🌍 Hosting + getting found on Google

The site is 100% static (HTML/CSS/JS) — it can be hosted for free almost anywhere.

### 1. Deploy (pick one)

**Vercel** (recommended — like the reference site):
1. Push the folder to a GitHub/GitLab repo (or just drag-and-drop the folder at vercel.com/new)
2. Vercel detects it as a static site and deploys automatically
3. You get a URL like `https://sovanna-chhem.vercel.app`

**GitHub Pages:**
1. Create a repo, upload the folder contents
2. Settings → Pages → deploy from branch `main` / root folder
3. URL: `https://<username>.github.io/<repo>/`

**Netlify:** drag-and-drop the folder at app.netlify.com/drop → instant URL.

### 2. Put your real URL in the SEO files
After deploying, replace `YOUR-DOMAIN.com` in:
- `robots.txt` (Sitemap line)
- `sitemap.xml` (all URLs)
- the `<head>` of each public page (`og:url`, `og:image`, `canonical`)
- the JSON-LD blocks in `index.html`

> If you deploy on Vercel, your URL is `https://<project>.vercel.app`.

### 3. Get indexed by Google
1. Go to **Google Search Console** → search.google.com/search-console
2. Add your property → paste your deployed URL
3. Verify ownership (DNS record, HTML tag or file upload — Vercel/Netlify make this easy)
4. In the left menu: **Sitemaps** → submit `https://<your-url>/sitemap.xml`
5. Use **URL Inspection** → paste your homepage → **Request Indexing**
6. Repeat the URL Inspection for `about.html`, `projects.html`, `blog.html`, `contact.html`

Then search for `site:<your-url>` to check progress. Indexing usually takes a few days (first time can take 1–3 weeks).

### SEO extras included
- `sitemap.xml` (with `lastmod`) + `robots.txt` (admin area blocked from indexing)
- Unique, keyword-rich meta description + real page title on every page
- Open Graph + Twitter card meta tags on every page (nice link previews when shared)
- JSON-LD structured data: `Person` + `WebSite` on the homepage, plus **dynamic
  `ItemList` (projects) and `Blog` (posts) schemas generated from your
  LocalStorage content** — Google's crawler executes JS and picks these up
- The **Admin Dashboard pages are `noindex`** so your login/management pages never appear in search results

> Note: blog posts and projects are stored in each visitor's browser LocalStorage, so Google only sees the demo seed content — real CMS-style pages would need a backend or static generation.
