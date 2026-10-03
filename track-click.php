<?php
// track-click.php
// Called from the browser (app.js) whenever an article page loads.
// Increments that article's view count in content/click-counts.json,
// which the homepage sidebar's Trending list reads from separately.
//
// This file is NOT managed by the CMS or git — it lives only on the
// live server and grows over time as real visitors read articles.

header('Content-Type: application/json');

// Allow the browser to call this even though it's a background request,
// but don't do anything unless a slug was actually provided.
$slug = isset($_GET['slug']) ? $_GET['slug'] : '';
$slug = preg_replace('/[^a-zA-Z0-9\-]/', '', $slug); // keep this simple/safe

if ($slug === '') {
    http_response_code(400);
    echo json_encode(['error' => 'missing slug']);
    exit;
}

$file = __DIR__ . '/content/click-counts.json';

// Open (or create) the file and lock it so two visitors clicking at the
// same moment can't corrupt the count.
$fp = fopen($file, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'could not open counts file']);
    exit;
}

flock($fp, LOCK_EX);

$contents = stream_get_contents($fp);
$counts = json_decode($contents, true);
if (!is_array($counts)) {
    $counts = [];
}

$counts[$slug] = (isset($counts[$slug]) ? $counts[$slug] : 0) + 1;

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($counts));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['ok' => true, 'slug' => $slug, 'count' => $counts[$slug]]);
