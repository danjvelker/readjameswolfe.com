// ============================================
// Read James Wolfe — site JS
// Fetches content/site-content.json (the file Decap CMS edits directly)
// and renders whichever page elements are present in the DOM.
// ============================================

const CONTENT_URL = "content/site-content.json";

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Converts our small custom ":::scripture REF ... :::" block into the
// styled scripture callout, then hands the rest to marked() for normal
// markdown. Runs before marked so the raw HTML passes through untouched.
function renderMarkdown(md) {
  const withScripture = md.replace(
    /:::scripture\s+([^\n]+)\n([\s\S]*?):::/g,
    (match, ref, body) => {
      const html = window.marked.parseInline(body.trim());
      return `<blockquote class="scripture"><p>${html}</p><span class="scripture-ref">${ref.trim()}</span></blockquote>`;
    }
  );
  return window.marked.parse(withScripture);
}

// Tags from the CMS's list widget normally come back as plain strings,
// but this normalizes defensively in case any entry is an object shape
// instead (e.g. { tag: "Grace" }), so filtering never silently breaks.
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => (typeof t === "string" ? t : t.tag || t.value || Object.values(t)[0] || "")).filter(Boolean);
}

// Article header images can be either a real uploaded file (from the CMS,
// e.g. "assets/uploads/photo.jpg") or one of the built-in gradient
// placeholder classes (img-1..img-4) used by the original dummy content.
function articleImageMarkup(image, className) {
  const cls = className || "card-image";
  const looksLikeFile = image && (image.includes("/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(image));
  if (looksLikeFile) {
    return `<div class="${cls}" style="background-image:url('${image}')"></div>`;
  }
  return `<div class="${cls} ${image || "img-1"}"></div>`;
}

// Gets the current article's slug from either ?slug= (old-style links,
// still supported) or the URL path itself (clean URLs via .htaccess,
// e.g. /this-part) — the browser only ever sees the clean path, so the
// query string is empty even though Apache rewrote it internally.
function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("slug");
  if (fromQuery) return fromQuery;

  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  const knownPages = ["", "index.html", "about.html", "articles.html", "article-template.html", "admin"];
  if (path && !knownPages.includes(path)) return path;
  return null;
}

function buildFeedItems(content) {
  return content.articles
    .filter((a) => a.publishToHomepage)
    .map((a) => ({
      ...a,
      type: "article",
      href: `/${a.slug}`
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ------------ Daily Quote Gallery (sidebar widget + modal) ------------

function renderDailyQuote(content) {
  const el = document.getElementById("daily-quote");
  const gallery = content.dailyQuoteGallery || [];
  if (!el || !gallery.length) return;

  const pick = gallery[Math.floor(Math.random() * gallery.length)];
  el.innerHTML = `
    <button type="button" class="daily-quote-img-btn" id="daily-quote-open">
      <img src="${pick}" alt="Quote graphic" class="quote-photo"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="quote-img-placeholder" style="display:none;"><span>Quote image</span></div>
    </button>
  `;

  const openBtn = document.getElementById("daily-quote-open");
  if (openBtn) openBtn.addEventListener("click", () => openGalleryModal(gallery));
}

function wireGalleryButton(content) {
  const btn = document.getElementById("view-gallery-btn");
  if (!btn) return;
  const gallery = content.dailyQuoteGallery || [];
  btn.addEventListener("click", () => openGalleryModal(gallery));
  if (!gallery.length) btn.disabled = true;
}

function openGalleryModal(images) {
  const existing = document.getElementById("quote-gallery-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "quote-gallery-modal";
  modal.className = "gallery-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-label", "Quote gallery");

  const grid = images
    .map(
      (src) => `
      <img src="${src}" alt="Quote graphic" class="gallery-modal-img"
        onerror="this.style.display='none';">
    `
    )
    .join("");

  modal.innerHTML = `
    <div class="gallery-modal-inner">
      <button type="button" class="gallery-modal-close" aria-label="Close gallery">&times;</button>
      <div class="gallery-modal-grid">${grid || "<p>No quote images uploaded yet.</p>"}</div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  function close() {
    modal.remove();
    document.body.style.overflow = "";
  }

  modal.querySelector(".gallery-modal-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", escHandler);
    }
  });
}

// ------------ Trending (real click counts, separate from CMS content) ------------

async function fetchClickCounts() {
  try {
    const res = await fetch("content/click-counts.json", { cache: "no-store" });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

async function renderTrending(feedItems) {
  const list = document.getElementById("trending-list");
  if (!list) return;

  const counts = await fetchClickCounts();
  const withCounts = feedItems.map((item) => ({ ...item, clicks: counts[item.slug] || 0 }));
  const topThree = withCounts.sort((a, b) => b.clicks - a.clicks).slice(0, 3);

  if (!topThree.some((item) => item.clicks > 0)) {
    list.innerHTML = `<li class="trending-empty">No reader activity tracked yet — check back once a few visits come in.</li>`;
    return;
  }

  list.innerHTML = topThree.map((item) => `<li><a href="${item.href}">${item.title}</a></li>`).join("");
}

// Fires a background click-tracking request when an article page loads.
// Fails silently if the tracking script isn't reachable (e.g. local
// testing without PHP) — trending simply shows no data in that case.
function recordClick(slug) {
  fetch(`/track-click.php?slug=${encodeURIComponent(slug)}`).catch(() => {});
}

// ------------ Feed / Articles archive ------------

function renderFeed(feedItems) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  feed.innerHTML = feedItems
    .map(
      (item) => `
      <a class="card" href="${item.href}">
        ${articleImageMarkup(item.image)}
        <div class="card-body">
          <span class="card-type">Article</span>
          <h2 class="card-title">${item.title}</h2>
          <p class="card-excerpt">${item.excerpt}</p>
          <p class="card-meta">${formatDate(item.date)}</p>
        </div>
      </a>
    `
    )
    .join("");
}

function renderArticlesOnly(content) {
  const grid = document.getElementById("articles-grid");
  if (!grid) return;

  const tagBar = document.getElementById("article-tag-filters");
  const emptyState = document.getElementById("articles-empty");
  const articles = [...content.articles].sort((a, b) => new Date(b.date) - new Date(a.date));

  const allTags = [...new Set(articles.flatMap((a) => normalizeTags(a.tags)))].sort();
  let activeTag = "All";

  function cardHtml(a) {
    return `
      <a class="card" href="/${a.slug}">
        ${articleImageMarkup(a.image)}
        <div class="card-body">
          <span class="card-type">Article</span>
          <h2 class="card-title">${a.title}</h2>
          <p class="card-excerpt">${a.excerpt}</p>
          <ul class="card-tags">${normalizeTags(a.tags).map((t) => `<li>${t}</li>`).join("")}</ul>
          <p class="card-meta">${formatDate(a.date)}</p>
        </div>
      </a>
    `;
  }

  function renderGrid() {
    const filtered = activeTag === "All" ? articles : articles.filter((a) => normalizeTags(a.tags).includes(activeTag));
    if (emptyState) emptyState.hidden = filtered.length !== 0;
    grid.innerHTML = filtered.map(cardHtml).join("");
  }

  if (tagBar) {
    tagBar.innerHTML = ["All", ...allTags]
      .map((tag) => `<button type="button" class="tag-pill${tag === "All" ? " active" : ""}" data-tag="${tag}">${tag}</button>`)
      .join("");
    tagBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-pill");
      if (!btn) return;
      activeTag = btn.dataset.tag;
      tagBar.querySelectorAll(".tag-pill").forEach((el) => el.classList.toggle("active", el === btn));
      renderGrid();
    });
  }

  renderGrid();
}

// ------------ Article page ------------

function renderArticlePage(content) {
  const container = document.getElementById("article-detail");
  if (!container) return;

  const slug = getSlugFromUrl();
  const article = content.articles.find((a) => a.slug === slug) || content.articles[0];
  if (!article) return;

  document.title = `${article.title} — Read James Wolfe`;
  document.querySelector(".article-col").dataset.currentSlug = article.slug;

  const bodyHtml = renderMarkdown(article.body || "");
  const wordCount = (article.body || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 225));

  const author = (content.authors || []).find((a) => a.name === article.author) || {
    name: article.author || "James Wolfe",
    bio: "",
    photo: null
  };
  const authorPhotoStyle = author.photo ? ` style="background-image:url('${author.photo}')"` : "";

  container.innerHTML = `
    <header class="article-header">
      <span class="card-type">Article</span>
      <h1 class="article-title">${article.title}</h1>
      <p class="article-meta">By ${author.name} &nbsp;&middot;&nbsp; ${formatDate(article.date)} &nbsp;&middot;&nbsp; ${minutes} min read</p>
    </header>
    ${articleImageMarkup(article.image, "article-hero")}
    <div class="article-body">${bodyHtml}</div>
    <section class="author-card">
      <div class="author-photo" aria-hidden="true"${authorPhotoStyle}></div>
      <div class="author-card-body">
        <h2 class="author-card-name">${author.name}</h2>
        <p class="author-card-bio">${author.bio || ""}</p>
        <a href="/about.html" class="author-card-link">More about the site →</a>
      </div>
    </section>
  `;

  const relatedGrid = document.getElementById("related-grid");
  if (relatedGrid) {
    const related = content.articles.filter((a) => a.slug !== article.slug).slice(0, 3);
    relatedGrid.innerHTML = related
      .map(
        (a) => `
        <a class="related-card" href="/${a.slug}">
          ${articleImageMarkup(a.image, "related-card-image")}
          <div class="related-card-body">
            <p class="related-card-title">${a.title}</p>
          </div>
        </a>
      `
      )
      .join("");
  }

  recordClick(article.slug);
}

// ------------ About page ------------

function renderAboutPage(content) {
  const container = document.getElementById("about-detail");
  if (!container) return;
  const about = content.about;
  container.innerHTML = `
    <h1 class="article-title">${about.title}</h1>
    <div class="article-body about-body">${renderMarkdown(about.body || "")}</div>
  `;
}

// ------------ Misc ------------

function wireSubscribeForm() {
  const form = document.getElementById("subscribe-form");
  const note = document.getElementById("subscribe-note");
  if (!form || !note) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    note.textContent = "Thanks — subscription form isn't connected yet.";
    form.reset();
  });
}

function showContentLoadError() {
  const isFileProtocol = window.location.protocol === "file:";
  const banner = document.createElement("div");
  banner.setAttribute("role", "alert");
  banner.style.cssText =
    "background:#7A8662; color:#252826; font-family:Inter, sans-serif; " +
    "font-size:14px; line-height:1.6; padding:14px 24px; text-align:center;";
  banner.innerHTML = isFileProtocol
    ? "This page's content didn't load because the file was opened directly (double-clicked) instead of through a real web address. " +
      "This is expected — it will work normally once the site is deployed. See <strong>DEPLOY.md</strong> for the simple steps."
    : "This page's content failed to load. Please refresh, or check your internet connection.";
  document.body.prepend(banner);
}

async function init() {
  wireSubscribeForm();

  let content;
  try {
    const res = await fetch(CONTENT_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
    content = await res.json();
  } catch (err) {
    console.error("Could not load site content:", err);
    showContentLoadError();
    return;
  }

  const feedItems = buildFeedItems(content);

  renderDailyQuote(content);
  wireGalleryButton(content);
  renderTrending(feedItems);
  renderFeed(feedItems);
  renderArticlesOnly(content);
  renderArticlePage(content);
  renderAboutPage(content);
}

init();
