<?php
// img.php
// Resizes and compresses images on request, then caches the result so
// the work only happens once per image/size combination. This exists
// because the CMS uploads whatever size/quality file was originally
// selected, with nothing shrinking it down for visitors automatically.
//
// Usage: img.php?src=assets/uploads/photo.jpg&w=900
//
// Originals in assets/uploads/ and assets/quotes/ are never modified —
// this only ever reads them and writes separate cached copies, so there
// is no risk of this conflicting with git/the CMS's own file tracking.

$src = isset($_GET['src']) ? $_GET['src'] : '';
$width = isset($_GET['w']) ? max(50, min(2000, (int) $_GET['w'])) : 900;

// --- Security: only allow images actually inside assets/uploads or
// assets/quotes, and block any path-traversal attempt. ---
$allowedDirs = ['assets/uploads/', 'assets/quotes/'];
$isAllowed = false;
foreach ($allowedDirs as $dir) {
    if (strpos($src, $dir) === 0) {
        $isAllowed = true;
        break;
    }
}
$hasTraversal = strpos($src, '..') !== false;

if (!$isAllowed || $hasTraversal || $src === '') {
    http_response_code(400);
    header('Content-Type: text/plain');
    echo 'Invalid image path.';
    exit;
}

$sourcePath = __DIR__ . '/' . $src;

if (!file_exists($sourcePath)) {
    http_response_code(404);
    header('Content-Type: text/plain');
    echo 'Image not found.';
    exit;
}

// --- Cache lookup ---
$cacheDir = __DIR__ . '/assets/cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$cacheKey = md5($src . '|' . $width) . '.' . strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
$cachePath = $cacheDir . '/' . $cacheKey;

if (file_exists($cachePath)) {
    serveFile($cachePath);
    exit;
}

// --- If GD isn't available for some reason, fail safe: just serve the
// original rather than a broken image. ---
if (!extension_loaded('gd')) {
    serveFile($sourcePath);
    exit;
}

$imageInfo = @getimagesize($sourcePath);
if (!$imageInfo) {
    serveFile($sourcePath);
    exit;
}

[$origWidth, $origHeight, $type] = $imageInfo;

// Don't upscale — if the original is already smaller than requested,
// just use its real width.
$targetWidth = min($width, $origWidth);
$targetHeight = (int) round($origHeight * ($targetWidth / $origWidth));

switch ($type) {
    case IMAGETYPE_JPEG:
        $image = @imagecreatefromjpeg($sourcePath);
        break;
    case IMAGETYPE_PNG:
        $image = @imagecreatefrompng($sourcePath);
        break;
    case IMAGETYPE_WEBP:
        $image = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($sourcePath) : false;
        break;
    case IMAGETYPE_GIF:
        $image = @imagecreatefromgif($sourcePath);
        break;
    default:
        $image = false;
}

if (!$image) {
    serveFile($sourcePath);
    exit;
}

$resized = imagecreatetruecolor($targetWidth, $targetHeight);

// Preserve transparency for PNG/GIF/WebP
if (in_array($type, [IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP], true)) {
    imagealphablending($resized, false);
    imagesavealpha($resized, true);
    $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
    imagefilledrectangle($resized, 0, 0, $targetWidth, $targetHeight, $transparent);
}

imagecopyresampled($resized, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $origWidth, $origHeight);

switch ($type) {
    case IMAGETYPE_JPEG:
        imagejpeg($resized, $cachePath, 82);
        break;
    case IMAGETYPE_PNG:
        imagepng($resized, $cachePath, 7);
        break;
    case IMAGETYPE_WEBP:
        if (function_exists('imagewebp')) {
            imagewebp($resized, $cachePath, 82);
        } else {
            imagepng($resized, $cachePath, 7);
        }
        break;
    case IMAGETYPE_GIF:
        imagegif($resized, $cachePath);
        break;
}

imagedestroy($image);
imagedestroy($resized);

if (file_exists($cachePath)) {
    serveFile($cachePath);
} else {
    // Resize somehow failed to write — fall back to the original so the
    // page never shows a broken image.
    serveFile($sourcePath);
}

function serveFile($path)
{
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $types = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif'
    ];
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile($path);
}
