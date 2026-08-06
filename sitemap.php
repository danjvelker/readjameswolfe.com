<?php
// sitemap.php
// Generated fresh from content/site-content.json on every request, so
// it's always accurate without needing manual regeneration.

header('Content-Type: application/xml; charset=UTF-8');

$siteUrl = 'https://readjameswolfe.com';
$jsonPath = __DIR__ . '/content/site-content.json';

$articles = [];
if (file_exists($jsonPath)) {
    $data = json_decode(file_get_contents($jsonPath), true);
    if (is_array($data) && isset($data['articles'])) {
        $articles = $data['articles'];
    }
}

function esc($str) {
    return htmlspecialchars($str ?? '', ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc><?php echo $siteUrl; ?>/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc><?php echo $siteUrl; ?>/articles.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc><?php echo $siteUrl; ?>/about.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
<?php foreach ($articles as $a): ?>
  <url>
    <loc><?php echo $siteUrl . '/' . esc($a['slug'] ?? ''); ?></loc>
    <lastmod><?php echo esc($a['date'] ?? ''); ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
<?php endforeach; ?>
</urlset>
