// Global theme — same key 'theme' and <html> class on every page (home, blogs, builds)
var themeKey = 'theme';
var root = document.documentElement;

function getStoredTheme() {
  try {
    var stored = localStorage.getItem(themeKey);
    if (stored === 'theme-light' || stored === 'theme-dark') return stored;
  } catch (e) { }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'theme-light' : 'theme-dark';
}

function initTheme() {
  root.className = getStoredTheme();
}

// Theme toggle icon: half-filled circle inside a ring; both spin on every switch.
// Adapted from Skiper UI "skiper26" ThemeToggleButton (https://skiper-ui.com),
// original concept by rudrodip (https://github.com/rudrodip/theme-toggle-effect).
// Animation + colors live in styles.css.
var THEME_TOGGLE_SVG =
  '<svg class="theme-toggle-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ' +
  'fill="none" viewBox="0 0 240 240">' +
  '<g class="tt-inner">' +
  '<path class="tt-fill" d="M120 67.5C149.25 67.5 172.5 90.75 172.5 120C172.5 149.25 149.25 172.5 120 172.5"/>' +
  '<path class="tt-hole" d="M120 67.5C90.75 67.5 67.5 90.75 67.5 120C67.5 149.25 90.75 172.5 120 172.5"/>' +
  '</g>' +
  '<path class="tt-ring tt-fill" d="M120 3.75C55.5 3.75 3.75 55.5 3.75 120C3.75 184.5 55.5 236.25 120 236.25' +
  'C184.5 236.25 236.25 184.5 236.25 120C236.25 55.5 184.5 3.75 120 3.75ZM120 214.5V172.5C90.75 172.5 67.5 149.25 67.5 120' +
  'C67.5 90.75 90.75 67.5 120 67.5V25.5C172.5 25.5 214.5 67.5 214.5 120C214.5 172.5 172.5 214.5 120 214.5Z"/>' +
  '</svg>';

function createThemeToggle() {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
  }
  if (!btn.querySelector('.theme-toggle-svg')) btn.innerHTML = THEME_TOGGLE_SVG;
  return btn;
}

// Theme toggle accessibility: announced as a "Dark mode" on/off switch
function syncThemeToggle() {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-checked', root.classList.contains('theme-dark') ? 'true' : 'false');
  btn.setAttribute('aria-label', 'Dark mode');
}

function applyTheme(next) {
  root.className = next;
  syncThemeToggle();
  try { localStorage.setItem(themeKey, next); } catch (e) { }
  window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: next } }));
}

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

function toggleTheme(e) {
  var next = root.classList.contains('theme-dark') ? 'theme-light' : 'theme-dark';

  // Circular theme reveal from the toggle button where supported; plain switch otherwise.
  // Adapted from Skiper UI "skiper26" (https://skiper-ui.com),
  // original concept by rudrodip (https://github.com/rudrodip/theme-toggle-effect).
  if (document.startViewTransition && !prefersReducedMotion()) {
    var btn = document.querySelector('.theme-toggle');
    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    if (btn) {
      var r = btn.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    // radius that reaches the farthest corner of the screen
    var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty('--reveal-x', x + 'px');
    root.style.setProperty('--reveal-y', y + 'px');
    root.style.setProperty('--reveal-r', Math.ceil(radius) + 'px');
    root.classList.add('theme-switching');

    var transition = document.startViewTransition(function () {
      applyTheme(next);
      root.classList.add('theme-switching'); // applyTheme resets the class list
    });
    transition.finished.finally(function () {
      root.classList.remove('theme-switching');
    });
  } else {
    applyTheme(next);
  }
}

// Floating controls, bottom-right on every page: [theme toggle] [⌘K]
// (direct child of <body>, so page animations never move them)
(function () {
  if (!document.body || document.querySelector('.floating-controls')) return;
  var controls = document.createElement('div');
  controls.className = 'floating-controls';
  controls.appendChild(createThemeToggle());
  var fab = document.querySelector('.command-palette-fab');
  if (fab) controls.appendChild(fab);
  document.body.appendChild(controls);
})();

// Progressive blur at the top and bottom of the screen on every page.
// Adapted from Skiper UI "skiper41" Progressive Blur (https://skiper-ui.com),
// inspired by https://devouringdetails.com/. Styles live in styles.css.
(function () {
  if (!document.body || document.querySelector('.progressive-blur')) return;
  ['top', 'bottom'].forEach(function (pos) {
    var el = document.createElement('div');
    el.className = 'progressive-blur progressive-blur--' + pos;
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  });
})();

// Top blur appears once you scroll (so it never covers content at rest);
// bottom blur fades away when you reach the end of the page
function initScrollEffects() {
  var blurTop = document.querySelector('.progressive-blur--top');
  var blurBottom = document.querySelector('.progressive-blur--bottom');
  var ticking = false;

  function update() {
    var y = window.scrollY;
    if (blurTop) blurTop.classList.toggle('is-visible', y > 4);
    if (blurBottom) {
      var atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
      blurBottom.classList.toggle('is-hidden', atBottom);
    }
    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('load', requestUpdate); // page height changes once images/blogs load
  update();
}

// Scroll reveal: cards fade/rise in as they enter the viewport
var revealObserver = null;

function revealOnScroll(elements) {
  if (!elements || !elements.length) return;
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    // Trigger matches cookified.github.io (Framer Motion whileInView,
    // viewport { once: true, margin: "-40px" }): start as soon as any part
    // of the element is 40px inside the viewport.
    }, { threshold: 0, rootMargin: '-40px' });
  }

  Array.prototype.forEach.call(elements, function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = ((i % 2) * 90) + 'ms';
    revealObserver.observe(el);
  });
}

//dynamic age counter
function calculateAge() {
  const birthDate = new Date("2006-10-30T00:00:00");
  const now = new Date();

  const ageInMs = now - birthDate;

  //aaverage year = 365.25 days)
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const ageInYears = ageInMs / msPerYear;

  //upto 9 decimal places
  return ageInYears.toFixed(9);
}

function updateAge() {
  const ageElement = document.getElementById("age-counter");
  if (ageElement) {
    ageElement.textContent = calculateAge();
  }
}

// Command palette — pages list (same on every page)
var PALETTE_PAGES = [
  { label: "home", path: "index.html#home", slug: "/" },
  { label: "builds", path: "index.html#builds", slug: "/builds" },
  { label: "blogs", path: "index.html#blogs", slug: "/blogs" },
  { label: "hi", path: "hi.html", slug: "/hi" },
  { label: "my journey on x", path: "myjourneyonx.html", slug: "/myjourneyonx" },
  { label: "people", path: "people.html", slug: "/people" },
  { label: "collections", path: "collections.html", slug: "/collections" },
];

var paletteOverlay = null;
var paletteSearch = null;
var paletteListEl = null;
var selectedIndex = 0;
var filteredPages = PALETTE_PAGES.slice();

function renderPaletteItems() {
  if (!paletteListEl) return;
  paletteListEl.innerHTML = "";
  filteredPages.forEach(function (p, i) {
    var a = document.createElement("a");
    a.href = p.path;
    a.className = "palette-item" + (i === selectedIndex ? " is-selected" : "");
    a.setAttribute("data-index", i);
    a.innerHTML = p.label + "<span>" + p.slug + "</span>";
    a.addEventListener("click", function (e) {
      e.preventDefault();
      closePalette();
      window.location.href = p.path;
    });
    paletteListEl.appendChild(a);
  });
  var selected = paletteListEl.querySelector(".palette-item.is-selected");
  if (selected) selected.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function openPalette() {
  if (!paletteOverlay) return;
  paletteOverlay.classList.add("is-open");
  filteredPages = PALETTE_PAGES.slice();
  selectedIndex = 0;
  if (paletteSearch) {
    paletteSearch.value = "";
    paletteSearch.focus();
  }
  renderPaletteItems();
}

function closePalette() {
  if (paletteOverlay) paletteOverlay.classList.remove("is-open");
}

function onPaletteKeydown(e) {
  if (!paletteOverlay || !paletteOverlay.classList.contains("is-open")) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closePalette();
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % filteredPages.length;
    renderPaletteItems();
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex = selectedIndex <= 0 ? filteredPages.length - 1 : selectedIndex - 1;
    renderPaletteItems();
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    if (filteredPages[selectedIndex]) {
      closePalette();
      window.location.href = filteredPages[selectedIndex].path;
    }
  }
}

function filterPalette(query) {
  var q = (query || "").trim().toLowerCase();
  if (!q) {
    filteredPages = PALETTE_PAGES.slice();
  } else {
    filteredPages = PALETTE_PAGES.filter(function (p) {
      return p.label.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }
  selectedIndex = 0;
  renderPaletteItems();
}

function initCommandPalette() {
  var overlay = document.createElement("div");
  overlay.className = "palette-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML =
    '<div class="palette-modal" role="dialog" aria-label="Navigate">' +
    '  <div class="palette-search-wrap">' +
    '    <input type="text" class="palette-search" placeholder="search links…" autocomplete="off" />' +
    "  </div>" +
    '  <div class="palette-list"></div>' +
    '  <div class="palette-footer">' +
    "    <span>↑↓ navigate</span><span>⏎ select</span><span>esc close</span>" +
    "  </div>" +
    "</div>";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closePalette();
  });
  var modal = overlay.querySelector(".palette-modal");
  modal.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  paletteSearch = overlay.querySelector(".palette-search");
  paletteListEl = overlay.querySelector(".palette-list");
  paletteSearch.addEventListener("input", function () {
    filterPalette(paletteSearch.value);
  });
  paletteSearch.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
      e.preventDefault();
      onPaletteKeydown(e);
      e.stopPropagation(); //dont run twice, stop it here
    }
  });
  document.body.appendChild(overlay);
  paletteOverlay = overlay;
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (paletteOverlay.classList.contains("is-open")) closePalette();
      else openPalette();
    } else {
      onPaletteKeydown(e);
    }
  });
}

//update age immediately then every millisecond
window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  syncThemeToggle();
  initCommandPalette();
  var paletteBtn = document.querySelector(".command-palette-btn");
  if (paletteBtn) {
    paletteBtn.addEventListener("click", openPalette);
  }
  initScrollEffects();
  revealOnScroll(document.querySelectorAll('.project-card'));
  revealOnScroll(document.querySelectorAll('.one-page .page-section > .hero-title, .one-page .page-section > .about'));
  updateAge();
  setInterval(updateAge, 2);
  loadMediumBlogs();
});

// fetching medium blogs
async function loadMediumBlogs() {
  const list = document.getElementById("blog-list");
  if (!list) return;

  const loadingEl = list.querySelector(".blog-loading");

  try {
    const res = await fetch("data/blogs.json");
    if (!res.ok) throw new Error("failed to load blogs.json");

    const posts = await res.json();

    if (!posts.length) {
      if (loadingEl) loadingEl.textContent = "no posts yet — check back soon.";
      return;
    }

    list.innerHTML = "";

    posts.forEach((item) => {
      const card = document.createElement("article");
      card.className = "blog-card";

      if (item.image) {
        const imgEl = document.createElement("img");
        imgEl.className = "blog-card-image";
        imgEl.alt = item.title;
        imgEl.src = item.image;
        imgEl.onerror = () => imgEl.style.display = "none";
        card.appendChild(imgEl);
      }

      const contentDiv = document.createElement("div");
      contentDiv.className = "blog-card-content";

      const titleLink = document.createElement("a");
      titleLink.className = "blog-card-title";
      titleLink.href = item.link;
      titleLink.target = "_blank";
      titleLink.rel = "noreferrer";
      titleLink.textContent = item.title;

      const meta = document.createElement("div");
      meta.className = "blog-card-meta";
      meta.textContent = new Date(item.date).toLocaleDateString("en-IN", {
        year: "numeric", month: "short", day: "numeric",
      });

      const excerptEl = document.createElement("p");
      excerptEl.className = "blog-card-excerpt";
      excerptEl.textContent = item.excerpt;

      contentDiv.append(titleLink, meta, excerptEl);
      card.appendChild(contentDiv);
      list.appendChild(card);
    });

    revealOnScroll(list.querySelectorAll('.blog-card'));

  } catch {
    if (loadingEl) loadingEl.textContent = "couldn't load posts right now.";
  }
}

