<?php
// feed.php
// Replaces the old static feed.xml, which needed someone to manually
// run a script every time an article was published. This generates the
// same RSS feed fresh, straight from content/site-content.json, on
// every request — always current, nothing to remember to re-run.

header('Content-Type: application/rss+xml; charset=UTF-8');

$siteUrl = 'https://readjameswolfe.com';
$jsonPath = __DIR__ . '/content/site-content.json';

function xml_escape($str) {
    return htmlspecialchars($str ?? '', ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

$articles = [];
if (file_exists($jsonPath)) {
    $data = json_decode(file_get_contents($jsonPath), true);
    if (is_array($data) && isset($data['articles'])) {
        $articles = $data['articles'];
        usort($articles, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<rss version="2.0">
  <channel>
    <title>Read James Wolfe</title>
    <link><?php echo $siteUrl; ?></link>
    <description>Helping weary Christians find comfort and confidence in Christ.</description>
    <language>en-us</language>
<?php foreach ($articles as $a): ?>
    <item>
      <title><?php echo xml_escape($a['title'] ?? ''); ?></title>
      <link><?php echo $siteUrl . '/' . xml_escape($a['slug'] ?? ''); ?></link>
      <guid><?php echo $siteUrl . '/' . xml_escape($a['slug'] ?? ''); ?></guid>
      <pubDate><?php echo date(DATE_RSS, strtotime($a['date'] ?? 'now')); ?></pubDate>
      <description><?php echo xml_escape($a['excerpt'] ?? ''); ?></description>
    </item>
<?php endforeach; ?>
  </channel>
</rss>
