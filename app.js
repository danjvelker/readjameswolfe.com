// ============================================
// Read James Wolfe — site JS
// Fetches content/site-content.json (the file Decap CMS edits directly)
// and renders whichever page elements are present in the DOM.
// No build step, no framework — content updates the moment the JSON
// file changes, whether edited by hand or published through the CMS.
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

function quoteVisual(item, extraClass) {
  const cls = extraClass ? ` ${extraClass}` : "";
  const placeholderHtml = `<div class="quote-img-placeholder${cls}" style="display:none;"><span>&ldquo;${item.text}&rdquo;</span></div>`;

  if (!item.image) {
    return `<div class="quote-img-placeholder${cls}"><span>&ldquo;${item.text}&rdquo;</span></div>`;
  }

  return `
    <div class="quote-visual">
      <img src="${item.image}" alt="Quote: &ldquo;${item.text}&rdquo; — ${item.author}" class="quote-photo${cls}"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      ${placeholderHtml}
    </div>
  `;
}

function buildFeedItems(content) {
  const homepageArticles = content.articles
    .filter((a) => a.publishToHomepage)
    .map((a) => ({
      ...a,
      type: "article",
      href: `article-template.html?slug=${a.slug}`
    }));
  const homepageQuotes = content.quotes
    .filter((q) => q.publishToHomepage)
    .map((q) => ({
      ...q,
      type: "quote",
      href: `quote-template.html?id=${q.id}`
    }));
  return [...homepageArticles, ...homepageQuotes].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderDailyQuote(content) {
  const el = document.getElementById("daily-quote");
  if (!el || !content.quotes.length) return;
  const pick = content.quotes[Math.floor(Math.random() * content.quotes.length)];
  el.innerHTML = `<a href="quote-template.html?id=${pick.id}">${quoteVisual(pick)}</a>`;
}

function renderTrending(feedItems) {
  const list = document.getElementById("trending-list");
  if (!list) return;
  const topThree = [...feedItems].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 3);
  list.innerHTML = topThree
    .map((item) => {
      const label = item.type === "quote" ? item.text : item.title;
      return `<li><a href="${item.href}">${label}</a></li>`;
    })
    .join("");
}

function renderFeed(feedItems) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  feed.innerHTML = feedItems
    .map((item) => {
      if (item.type === "quote") {
        const tags = (item.tags || []).map((t) => `<li>${t}</li>`).join("");
        return `
          <a class="card card-quote" href="${item.href}">
            ${quoteVisual(item)}
            <div class="card-body">
              <span class="card-type">Quote</span>
              <p class="card-title">&ldquo;${item.text}&rdquo;</p>
              <p class="card-author">— ${item.author}</p>
              <ul class="card-tags">${tags}</ul>
              <p class="card-meta">${formatDate(item.date)}</p>
            </div>
          </a>
        `;
      }
      return `
        <a class="card" href="${item.href}">
          ${articleImageMarkup(item.image)}
          <div class="card-body">
            <span class="card-type">Article</span>
            <h2 class="card-title">${item.title}</h2>
            <p class="card-excerpt">${item.excerpt}</p>
            <p class="card-meta">${formatDate(item.date)}</p>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderArticlesOnly(content) {
  const grid = document.getElementById("articles-grid");
  if (!grid) return;

  const tagBar = document.getElementById("article-tag-filters");
  const emptyState = document.getElementById("articles-empty");
  const articles = [...content.articles].sort((a, b) => new Date(b.date) - new Date(a.date));

  const allTags = [...new Set(articles.flatMap((a) => a.tags || []))].sort();
  let activeTag = "All";

  function cardHtml(a) {
    return `
      <a class="card" href="article-template.html?slug=${a.slug}">
        ${articleImageMarkup(a.image)}
        <div class="card-body">
          <span class="card-type">Article</span>
          <h2 class="card-title">${a.title}</h2>
          <p class="card-excerpt">${a.excerpt}</p>
          <ul class="card-tags">${(a.tags || []).map((t) => `<li>${t}</li>`).join("")}</ul>
          <p class="card-meta">${formatDate(a.date)}</p>
        </div>
      </a>
    `;
  }

  function renderGrid() {
    const filtered = activeTag === "All" ? articles : articles.filter((a) => (a.tags || []).includes(activeTag));
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

function renderArticlePage(content) {
  const container = document.getElementById("article-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const article = content.articles.find((a) => a.slug === slug) || content.articles[0];
  if (!article) return;

  document.title = `${article.title} — Read James Wolfe`;
  document.querySelector(".article-col").dataset.currentSlug = article.slug;

  const bodyHtml = renderMarkdown(article.body || "");
  const wordCount = (article.body || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 225));

  container.innerHTML = `
    <header class="article-header">
      <span class="card-type">Article</span>
      <h1 class="article-title">${article.title}</h1>
      <p class="article-meta">${formatDate(article.date)} &nbsp;&middot;&nbsp; ${minutes} min read</p>
    </header>
    ${articleImageMarkup(article.image, "article-hero")}
    <div class="article-body">${bodyHtml}</div>
    <section class="author-card">
      <div class="author-photo" aria-hidden="true"></div>
      <div class="author-card-body">
        <h2 class="author-card-name">James Wolfe</h2>
        <p class="author-card-bio">
          James writes on grace, patience, and the ordinary shape of the
          Christian life. He lives with his family and is currently working
          on his first book.
        </p>
        <a href="about.html" class="author-card-link">More about James →</a>
      </div>
    </section>
  `;

  const relatedGrid = document.getElementById("related-grid");
  if (relatedGrid) {
    const related = content.articles.filter((a) => a.slug !== article.slug).slice(0, 3);
    relatedGrid.innerHTML = related
      .map(
        (a) => `
        <a class="related-card" href="article-template.html?slug=${a.slug}">
          ${articleImageMarkup(a.image, "related-card-image")}
          <div class="related-card-body">
            <p class="related-card-title">${a.title}</p>
          </div>
        </a>
      `
      )
      .join("");
  }
}

function renderQuoteArchive(content) {
  const grid = document.getElementById("archive-grid");
  if (!grid) return;

  const tagBar = document.getElementById("tag-filters");
  const authorSelect = document.getElementById("author-filter");
  const emptyState = document.getElementById("archive-empty");
  const quotes = content.quotes;

  const allTags = [...new Set(quotes.flatMap((q) => q.tags))].sort();
  const allAuthors = [...new Set(quotes.map((q) => q.author))].sort();

  let activeTag = "All";

  tagBar.innerHTML = ["All", ...allTags]
    .map((tag) => `<button type="button" class="tag-pill${tag === "All" ? " active" : ""}" data-tag="${tag}">${tag}</button>`)
    .join("");

  authorSelect.innerHTML =
    `<option value="All">All Authors</option>` + allAuthors.map((a) => `<option value="${a}">${a}</option>`).join("");

  function renderGrid() {
    const author = authorSelect.value;
    const filtered = quotes.filter((q) => {
      const tagMatch = activeTag === "All" || q.tags.includes(activeTag);
      const authorMatch = author === "All" || q.author === author;
      return tagMatch && authorMatch;
    });

    emptyState.hidden = filtered.length !== 0;

    grid.innerHTML = filtered
      .map(
        (q) => `
        <a class="quote-tile" href="quote-template.html?id=${q.id}">
          ${quoteVisual(q)}
          <div class="quote-tile-body">
            <p class="quote-tile-author">${q.author}</p>
            <ul class="card-tags">${q.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
          </div>
        </a>
      `
      )
      .join("");
  }

  tagBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tag-pill");
    if (!btn) return;
    activeTag = btn.dataset.tag;
    tagBar.querySelectorAll(".tag-pill").forEach((el) => el.classList.toggle("active", el === btn));
    renderGrid();
  });
  authorSelect.addEventListener("change", renderGrid);

  renderGrid();
}

function renderQuotePage(content) {
  const container = document.getElementById("quote-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const quote = content.quotes.find((q) => q.id === id) || content.quotes[0];

  container.innerHTML = `
    <div class="quote-detail-image">${quoteVisual(quote)}</div>
    <div class="quote-detail-body">
      <p class="quote-detail-text">&ldquo;${quote.text}&rdquo;</p>
      <p class="quote-detail-author">— ${quote.author}</p>
      <ul class="card-tags">${quote.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
    </div>
  `;
  document.title = `${quote.author} — Read James Wolfe`;

  const moreGrid = document.getElementById("more-quotes-grid");
  if (moreGrid) {
    const more = content.quotes
      .filter((q) => q.id !== quote.id && (q.author === quote.author || q.tags.some((t) => quote.tags.includes(t))))
      .slice(0, 3);
    moreGrid.innerHTML = more
      .map(
        (q) => `
        <a class="related-card quote-related-card" href="quote-template.html?id=${q.id}">
          ${quoteVisual(q, "related-card-image")}
          <div class="related-card-body">
            <p class="related-card-title">${q.author}</p>
          </div>
        </a>
      `
      )
      .join("");
  }
}

function renderAboutPage(content) {
  const container = document.getElementById("about-detail");
  if (!container) return;
  const about = content.about;
  container.innerHTML = `
    <h1 class="article-title">${about.title}</h1>
    <div class="article-body about-body">${renderMarkdown(about.body || "")}</div>
  `;
}

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
    const res = await fetch(CONTENT_URL);
    if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
    content = await res.json();
  } catch (err) {
    console.error("Could not load site content:", err);
    showContentLoadError();
    return;
  }

  const feedItems = buildFeedItems(content);

  renderDailyQuote(content);
  renderTrending(feedItems);
  renderFeed(feedItems);
  renderArticlesOnly(content);
  renderArticlePage(content);
  renderQuoteArchive(content);
  renderQuotePage(content);
  renderAboutPage(content);
}

init();
