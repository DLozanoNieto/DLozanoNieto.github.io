/* =====================================================================
   SCRIPT.JS — makes the website move.
   All the page content (text, images, links) now lives in index.html.
   This file only does 4 things:
     1. Shows the right page when the link (#home, #project-01, ...) changes
     2. Fades between pages
     3. Opens / closes the Information panel (without changing the page behind it)
     4. Arranges the home page pictures into neat rows
   ===================================================================== */

const $ = (selector) => document.querySelector(selector);

const app = $("#app");                       // the area that holds all pages
const pages = [...app.querySelectorAll(".page")]; // home + every project
const navLinks = document.querySelectorAll("#nav a"); // bottom menu buttons

let current = null;        // the page currently showing (e.g. "home", "project-01")
let fadeTimer = null;      // used for the fade animation
let layoutTimer = null;    // used to re-arrange the gallery after resizing

/* ---------------------------------------------------------------------
   1. SHOW A PAGE (with fade animation)
   --------------------------------------------------------------------- */
function showPage(id, animate = true) {
  if (id === current) return;   // already showing this page

  const swap = () => {
    current = id;

    // Show only the chosen page, hide all others
    pages.forEach((page) => { page.hidden = page.id !== id; });

    // Big logo on home, small logo on project pages
    document.body.classList.toggle("home", id === "home");

    // Highlight the matching button in the bottom menu
    navLinks.forEach((link) => link.classList.toggle("on", link.dataset.id === id));

    // Home page: shuffle and arrange pictures
    if (id === "home") {
      shuffleTiles();
      arrangeGallery();
    }

    scrollTo(0, 0);
  };

  if (animate && current) {
    // Fade out, swap the page, fade back in
    clearTimeout(fadeTimer);
    app.classList.remove("out");
    void app.offsetWidth;               // restarts the animation
    app.classList.add("out");
    fadeTimer = setTimeout(() => {
      swap();
      requestAnimationFrame(() => app.classList.remove("out"));
    }, 180);
  } else {
    swap();
  }
}

/* ---------------------------------------------------------------------
   2. INFORMATION PANEL
   Opening it never changes the page behind it.
   --------------------------------------------------------------------- */
function setInfo(open) {
  document.body.classList.toggle("info-open", open);
  $("#info").setAttribute("aria-hidden", String(!open));
}

function closeInfo() {
  // Go back to the page that is still showing behind the panel
  location.hash = current || "home";
}

$("#info-close").addEventListener("click", closeInfo);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("info-open")) {
    closeInfo();
  }
});

/* ---------------------------------------------------------------------
   3. ROUTING: react to the link in the address bar
   --------------------------------------------------------------------- */
function route(animate = true) {
  const id = location.hash.slice(1) || "home";

  if (id === "information") {
    setInfo(true);
    if (!current) showPage("home", false);   // opened directly: put home behind it
    return;                                    // otherwise leave the page behind alone
  }

  setInfo(false);
  const exists = pages.some((page) => page.id === id);
  showPage(exists ? id : "home", animate);
}

window.addEventListener("hashchange", () => route(true));

// Clicking the logo always goes home
$("#logo").addEventListener("click", (event) => {
  event.preventDefault();
  location.hash = "home";
});

/* ---------------------------------------------------------------------
   4. HOME GALLERY: shuffle and arrange pictures in even rows
   --------------------------------------------------------------------- */
const gallery = $("#gallery");
const tiles = [...gallery.querySelectorAll(".tile")];

// Random order each time the home page is shown
function shuffleTiles() {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
}

// Builds rows so that each row fills the screen width, keeping every
// picture's real proportions (nothing is cropped).
function arrangeGallery() {
  const style = getComputedStyle(gallery);

  // Usable width = gallery width minus its side padding
  const width = gallery.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  if (width <= 0) return;                    // home page is hidden, nothing to do

  const gap = parseFloat(style.gap) || 16;

  // ROW HEIGHT: bigger number = taller rows with fewer images per row
  const targetHeight = Math.max(180, width * 0.3);

  // MAX ROW HEIGHT: rows are never taller than this. When a row hits the limit,
  // the leftover width is spread between the images, so the row still spans the full width.
  // Lower the 0.9 = taller rows stop sooner = more variable spacing. 1 = spacing only on short rows.
  const maxHeight = targetHeight * 0.9;

  // Height a group of images would have if stretched to the full width
  const fitHeight = (group) => {
    const ratios = group.reduce((sum, tile) => sum + Number(tile.dataset.ratio), 0);
    return (width - gap * (group.length - 1)) / ratios;
  };

  // Read every picture's proportions
  tiles.forEach((tile) => {
    const img = tile.querySelector("img");
    tile.dataset.ratio = img.naturalWidth && img.naturalHeight
      ? img.naturalWidth / img.naturalHeight
      : 1.35;                                // guess until the image has loaded
  });

  // Group pictures into rows (always at least 2 per row)
  const rows = [];
  let row = [];
  tiles.forEach((tile) => {
    row.push(tile);
    if (row.length >= 2 && fitHeight(row) <= targetHeight) {
      rows.push(row);
      row = [];
    }
  });

  // Leftover pictures: add them to the previous row if they would look too big alone
  if (row.length) {
    if (rows.length && (row.length < 2 || fitHeight(row) > targetHeight * 1.3)) {
      rows[rows.length - 1].push(...row);
    } else {
      rows.push(row);
    }
  }

  // Draw the rows. Heights are exact, so every row fills the width perfectly.
    // Draw the rows. Height is capped, and any leftover width becomes extra space between images.
  gallery.innerHTML = "";
  rows.forEach((group) => {
    const height = Math.min(fitHeight(group), maxHeight);
    const rowEl = document.createElement("div");
    rowEl.className = "gallery-row";

    group.forEach((tile) => {
      const w = height * Number(tile.dataset.ratio);
      tile.style.width = `${w}px`;
      tile.style.flexBasis = `${w}px`;
      const img = tile.querySelector("img");
      img.style.height = `${height}px`;
      img.style.objectFit = "contain";
      rowEl.appendChild(img.parentElement);
    });

    gallery.appendChild(rowEl);
  });
}

// Re-arrange when a picture finishes loading or the window is resized
function arrangeSoon(delay) {
  clearTimeout(layoutTimer);
  layoutTimer = setTimeout(arrangeGallery, delay);
}

tiles.forEach((tile) =>
  tile.querySelector("img").addEventListener("load", () => arrangeSoon(50))
);
window.addEventListener("resize", () => arrangeSoon(100), { passive: true });

/* ---------------------------------------------------------------------
   START: show the page that matches the current link (no fade on first load)
   --------------------------------------------------------------------- */
route(false);
