# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A static personal portfolio written in plain HTML, CSS and JavaScript. It has no framework, no package manager, no build step, no linter and no tests. To preview it, serve the repo root, because `fetch("data/blogs.json")` does not work over `file://`:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

It deploys from the `main` branch of https://github.com/Khusheyy/portfolio.git.

## Owner's ground rules

- Never change the site's written content (text, links, project info) unless asked. Visual and behavioral changes are fine.
- Only edit the pages the owner names. Leave other pages as they are.
- Keep the ⌘K / Ctrl+K command palette working on every page.
- Commit or push only when asked.

## Architecture

**Shared head.** Each page's `<head>` loads `assets/js/head-common.js`, which injects:
- the meta tags,
- the favicon,
- `assets/css/styles.css`,
- Font Awesome,
- the stored theme class, applied early to avoid a flash of the wrong theme.

Change shared head assets there, not in each page.

**Shared behavior.** `assets/js/script.js` loads at the end of the body on every page. It builds these elements at runtime, so you won't find them in the HTML:
- `.floating-controls` (fixed bottom-right). It holds the theme toggle, created by `createThemeToggle()`, and the `.command-palette-fab` (⌘K button), which is moved in from the page markup.
- `.progressive-blur--top` and `--bottom` overlays, a vanilla port of Skiper UI's skiper41. `initScrollEffects()` toggles their `is-visible` / `is-hidden` classes from `window.scrollY`.
- The command palette. Its destinations come from `PALETTE_PAGES`; home, builds and blogs point to `index.html#home`, `#builds` and `#blogs`.
- Scroll reveal with `revealOnScroll(selector)`, using a shared IntersectionObserver and the `translate` property, so it doesn't conflict with `transform` hover effects.
- Blog cards. `loadMediumBlogs()` renders `data/blogs.json` into `#blog-list`. To add a post, add an entry to that JSON.

**Theming.**
- The theme is set by `html.theme-dark` or `html.theme-light`, saved in `localStorage` under `theme`, and announced with a `themechanged` event.
- Colors are CSS custom properties defined for each theme class in `styles.css`.
- `toggleTheme()` (a port of skiper26) runs `document.startViewTransition`. It sets `--reveal-x`, `--reveal-y` and `--reveal-r` on the root and adds the `theme-switching` class, which drives a circular `clip-path` reveal and turns off other transitions while it runs.
- `prefers-reduced-motion` skips these animations.

**Pages.**
- `index.html` (`body.one-page`) is the one-page home. In order, it holds:
  1. the home content,
  2. `<section id="builds">`, a verbatim copy of `builds.html`'s content,
  3. `<section id="blogs">`.
- There is no footer; the owner removed it and doesn't want one.
- `builds.html` and `blogs.html` still exist as separate pages. Edits to builds or blogs content may need to go in both places.
- No page has a top navbar. Navigation is the palette, whose home, builds and blogs entries jump to `#home`, `#builds` and `#blogs`.

**CSS layout.** `styles.css` holds the original rules first, followed by appended blocks: smooth effects, theme toggle, view transitions, progressive blur and one-page layout, and the scroll reveal.
- The scroll reveal is tuned to match https://cookified.github.io/: a 10px rise with a spring (stiffness 140, damping 22) sampled into `linear()` easing, triggered 40px inside the viewport.
- `body { height: auto; min-height: 100% }` must stay. If `body` gets `height: 100%` together with `overflow-x: hidden`, `<body>` becomes the scroll container, `window.scrollY` stays 0, and the progressive blur and smooth scrolling stop working.

**Attribution.** The Skiper UI components (skiper41 and skiper26) are vanilla rebuilds of React/Tailwind originals. Their license requires attribution: keep the credit comments in the code. The visible "ui bits inspired by skiper ui" line went away with the footer.

## Known quirks

- Every page must declare `<meta charset="UTF-8">` as the first line of its `<head>`. The one `head-common.js` injects comes too late for the browser to use. Without it, ⌘, • and ↑↓ render as garbled symbols, including in `script.js` and `styles.css`, which use the page's encoding.
- `.project-card` references `--border-color`, which is never defined.
