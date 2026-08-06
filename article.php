<?php
// article.php
// Handles the SEO/social-preview problem: since the article body is
// normally filled in by JavaScript after the page loads, search engines
// and link-preview bots (which mostly don't run JS) would otherwise see
// the same generic title/description on every article. This file reads
// the same content/site-content.json JS uses, server-side, just to fill
// in accurate <title>/meta tags before the page is sent out. The actual
// visible content is still rendered by app.js exactly as before —
// nothing about how the page *works* changes, only what's in <head>.

$slug = isset($_GET['slug']) ? preg_replace('/[^a-zA-Z0-9\-]/', '', $_GET['slug']) : '';

$siteUrl = 'https://readjameswolfe.com';
$defaultImage = $siteUrl . '/assets/favicon/favicon-512.png';

$article = null;
$jsonPath = __DIR__ . '/content/site-content.json';
if (file_exists($jsonPath)) {
    $data = json_decode(file_get_contents($jsonPath), true);
    if (is_array($data) && isset($data['articles'])) {
        foreach ($data['articles'] as $a) {
            if (isset($a['slug']) && $a['slug'] === $slug) {
                $article = $a;
                break;
            }
        }
    }
}

if ($article) {
    $pageTitle = htmlspecialchars($article['title']) . ' — Read James Wolfe';
    $pageDescription = htmlspecialchars($article['excerpt'] ?? 'An article from Read James Wolfe.');
    $canonicalUrl = $siteUrl . '/' . htmlspecialchars($article['slug']);
    $imageRaw = $article['image'] ?? '';
    $looksLikeFile = $imageRaw && (strpos($imageRaw, '/') !== false || preg_match('/\.(png|jpe?g|webp|gif)$/i', $imageRaw));
    $pageImage = $looksLikeFile ? $siteUrl . '/img.php?src=' . urlencode(ltrim($imageRaw, '/')) . '&w=1200' : $defaultImage;
} else {
    http_response_code(404);
    $pageTitle = 'Article Not Found — Read James Wolfe';
    $pageDescription = "This article doesn't exist or may have been removed.";
    $canonicalUrl = $siteUrl . '/' . htmlspecialchars($slug);
    $pageImage = $defaultImage;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo $pageTitle; ?></title>
<meta name="description" content="<?php echo $pageDescription; ?>">
<link rel="canonical" href="<?php echo $canonicalUrl; ?>">

<meta property="og:type" content="article">
<meta property="og:title" content="<?php echo $pageTitle; ?>">
<meta property="og:description" content="<?php echo $pageDescription; ?>">
<meta property="og:url" content="<?php echo $canonicalUrl; ?>">
<meta property="og:image" content="<?php echo $pageImage; ?>">
<meta property="og:site_name" content="Read James Wolfe">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?php echo $pageTitle; ?>">
<meta name="twitter:description" content="<?php echo $pageDescription; ?>">
<meta name="twitter:image" content="<?php echo $pageImage; ?>">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<link rel="stylesheet" href="styles.css">

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/assets/favicon/lantern.svg">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png">
</head>
<body>

<header class="site-header">
  <div class="wrap header-inner">
    <div class="brand">
      <a href="/" class="brand-name">Read James Wolfe</a>
      <p class="tagline">Helping weary Christians find comfort and confidence in Christ.</p>
    </div>
    <nav class="site-nav" aria-label="Primary">
      <a href="articles.html">Articles</a>
      <a href="https://quotes.readjameswolfe.com">Quotes</a>
      <a href="https://substack.com/@jameswolfewrites" target="_blank" rel="noopener">Substack</a>
      <a href="about.html">About</a>
    </nav>
  </div>
</header>

<main class="wrap content-layout">

  <!-- Article -->
  <article class="article-col" data-current-slug="">

    <div id="article-detail">
      <!-- populated by app.js: header, hero, body, author card -->
    </div>

    <!-- Related articles -->
    <section class="related-articles" aria-label="Related articles">
      <h2 class="sidebar-heading">Related Reading</h2>
      <div class="related-grid" id="related-grid">
        <!-- populated by app.js -->
      </div>
    </section>

  </article>

  <!-- Sidebar -->
  <aside class="sidebar" aria-label="Sidebar">

    <div class="sidebar-block author-blurb">
      <p>
        Welcome. Every article and quote here is written or personally
        selected by me — no ghostwriters, no content mills. If something
        on this site is meaningful to you, it's because it was meaningful
        to me first.
      </p>
    </div>

    <div class="sidebar-block daily-quote-block">
      <div class="daily-quote" id="daily-quote">
        <!-- populated by app.js -->
      </div>
      <p class="daily-quote-caption">Daily Quote</p>
      <button type="button" class="view-gallery-btn" id="view-gallery-btn">View Gallery</button>
    </div>

    <div class="sidebar-block trending-block">
      <h2 class="sidebar-heading">Trending</h2>
      <ol class="trending-list" id="trending-list">
        <!-- populated by app.js -->
      </ol>
    </div>

  </aside>

</main>

<footer class="site-footer">
  <div class="wrap footer-toolbar">

    <div class="footer-subscribe">
      <h2 class="sidebar-heading">Subscribe</h2>
      <p class="footer-subscribe-copy">Get new articles by email, roughly weekly.</p>
      <form class="subscribe-form" id="subscribe-form">
        <label for="subscribe-email" class="sr-only">Email address</label>
        <input type="email" id="subscribe-email" name="email" placeholder="you@example.com" required>
        <button type="submit">Subscribe</button>
      </form>
      <p class="subscribe-note" id="subscribe-note" role="status"></p>
    </div>

    <div class="footer-follow">
      <h2 class="sidebar-heading">Follow</h2>
      <ul class="follow-list follow-icons">
        <li>
          <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.4"/><text x="12" y="16.5" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="currentColor">f</text></svg>
          </a>
        </li>
        <li>
          <a href="https://x.com" target="_blank" rel="noopener" aria-label="X (formerly Twitter)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.4"/><text x="12" y="16" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="currentColor">X</text></svg>
          </a>
        </li>
        <li>
          <a href="https://substack.com/@jameswolfewrites" target="_blank" rel="noopener" aria-label="Substack">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.4"/><text x="12" y="16" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="currentColor">S</text></svg>
          </a>
        </li>
        <li>
          <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="10"/><rect x="7.5" y="7.5" width="9" height="9" rx="2.5"/><circle cx="12" cy="12" r="2.1"/><circle cx="15.3" cy="8.7" r="0.4" fill="currentColor" stroke="none"/></svg>
          </a>
        </li>
        <li>
          <a href="/feed.xml" aria-label="RSS Feed">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none"/><path d="M7.5 11.5a5 5 0 0 1 5 5"/><path d="M7.5 8a8.5 8.5 0 0 1 8.5 8.5"/></svg>
          </a>
        </li>
      </ul>
    </div>

    <div class="footer-colophon">
      <p>&copy; 2026 James Wolfe. All writing reproduced by permission of the author.</p>
    </div>

  </div>
</footer>

<script src="assets/vendor/marked.umd.js"></script>
<script src="app.js"></script>
</body>
</html>
