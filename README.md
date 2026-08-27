# Sovanna CHHEM — Portfolio Website

A professional, modern, clean, and fully responsive personal portfolio for
**Sovanna CHHEM**, a Full-Stack Web Developer.

Built with **pure HTML5, CSS3, and vanilla JavaScript** — no frameworks,
no build tools, no dependencies.

![Stack](https://img.shields.io/badge/HTML5-CSS3-6366f1) ![JS](https://img.shields.io/badge/vanilla-JavaScript-f0db4f)

---

## ✨ Features

- **Sticky navigation** with smooth scrolling, active-link highlighting, mobile
  hamburger menu, and a **dark / light theme toggle** (preference saved to `localStorage`)
- **Hero section** with staggered entrance animations, an animated typing effect,
  an anime-style avatar in a neon HUD frame (swap in your own photo), and floating technology icons
- **About** section with animated stat counters (numbers editable in HTML)
- **Skills** grouped by category (Frontend / Backend / Database / Tools) with
  animated progress bars (levels editable in HTML)
- **Projects** with AI-generated placeholder screenshots, tech tags, and a
  vanilla-JS **filtering system** (All / Frontend / Backend / Full-Stack)
- **Services** — four glass-style cards
- **Developer Journey** — a vertical timeline that is easy to edit
- **Contact section** with validated form (name, email, subject, message),
  inline error messages, and a professional success state
- **Extras:** scroll progress bar, back-to-top button, scroll-reveal animations,
  `prefers-reduced-motion` support, SEO meta tags, accessible labels & alt text

## 🛠️ Tech Stack

| Layer    | Used                                   |
| -------- | -------------------------------------- |
| Markup   | Semantic HTML5                         |
| Styling  | CSS3 (custom properties, grid, flex)   |
| Logic    | Vanilla JavaScript (ES6+)              |
| Icons    | Inline SVG sprite + Devicon brand icons |
| Fonts    | Orbitron, Poppins, Battambang (Khmer), JetBrains Mono (Google Fonts) |

## 📁 Project Structure

```text
portfolio/
│
├── index.html          # All markup (semantic, commented)
├── style.css           # All styles (themed variables, responsive)
├── script.js           # All interactivity (commented, feature-by-feature)
│
├── assets/
│   ├── images/         # Project screenshots (webp) + original PNG sources
│   └── icons/          # favicon.svg + Devicon brand-icon sources
│
└── README.md
```

## 🚀 Quick Start

No build step needed.

1. **Open directly:** double-click `index.html` — everything works locally.
2. **Or serve it** (recommended for local testing):

```bash
# with Python
python3 -m http.server 8000
# then open http://localhost:8000
```

## ✏️ Customization Guide

Everything that changes often lives right in the HTML, marked with
`<!-- EDIT ... -->` comments.

| What                          | Where                                                              |
| ----------------------------- | ------------------------------------------------------------------ |
| Name, role, bio               | `index.html` → Hero & About sections                                |
| Social / contact links        | `index.html` → search for `sovanna-chhem` placeholders              |
| Stat numbers (counters)       | `data-target` attributes in the About section                       |
| Skill levels                  | `--level: NN%` (and the matching `NN%` text) in the Skills section  |
| Project cards & images        | `index.html` → Projects section — swap the `<img src>` for your own |
| Timeline entries              | `index.html` → Journey section — add/remove `.timeline-item` blocks |
| Typing animation roles        | `roles` array at the top of `script.js`                             |
| Colors & theme                | CSS variables at the top of `style.css` (`:root` and `[data-theme="light"]`) |

### Connecting the contact form to a real backend

The form is intentionally frontend-only. After a valid submission it shows a
success message but sends nothing. To connect a backend, open `script.js` and
find the `FRONTEND-ONLY DEMO` comment in the form section — a ready-made
`fetch()` example is included there.

### Replacing project images

- Drop your screenshots into `assets/images/` (PNG, JPG, or WebP).
- Update the `<img src="...">` path and the `alt` text in the Projects section.
- Original full-size PNG sources are kept in `assets/images/` if you ever want them.

## 🌍 Deployment

The site is fully static — host it anywhere:

- **GitHub Pages:** push the folder and enable Pages
- **Netlify / Vercel:** drag & drop the folder
- **Any static host / CDN:** just upload

## ♿ Accessibility & ⚡ Performance

- Semantic landmarks, skip-link, `aria-*` labels, visible focus rings
- Lazy-loaded images with explicit dimensions (no layout shift)
- WebP images (~80 KB each) with `loading="lazy"`
- `prefers-reduced-motion` support disables animations
- No external JS dependencies; fonts and icons are the only third-party assets

## 📜 Credits

- **Brand icons:** [Devicon](https://devicon.dev/) (MIT license)
- **Fonts:** Google Fonts (Orbitron, Poppins, Battambang, JetBrains Mono)
- **Hero avatar & project screenshots:** AI-generated anime/UI mockups used as placeholders —
  replace them with your own photo and real screenshots

---

© 2026 Sovanna CHHEM. All rights reserved.
