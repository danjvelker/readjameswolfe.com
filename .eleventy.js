const markdownIt = require("markdown-it");

// ============================================
// Custom markdown-it plugin: recognizes our three
// custom content blocks and renders them to the same
// HTML structure (and CSS classes) the site already uses.
//
//   :::scripture REFERENCE
//   verse text
//   :::
//
//   :::image path/to/file.jpg|Optional caption
//   :::
//
//   :::youtube
//   https://www.youtube.com/watch?v=XXXXXXXXXXX
//   :::
//
// This runs as a markdown-it "core rule" that scans the raw source
// before normal block parsing, replacing each matched block with a
// literal HTML token — the same technique used previously in the
// browser-side version of this logic, just moved to build time.
// ============================================

function customBlocksPlugin(md) {
  function extractYouTubeId(raw) {
    const trimmed = (raw || "").trim();
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const re of patterns) {
      const match = trimmed.match(re);
      if (match) return match[1];
    }
    return null;
  }

  md.core.ruler.before("normalize", "custom_blocks", (state) => {
    let src = state.src;

    // Scripture block
    src = src.replace(/:::scripture\s+([^\n]+)\n([\s\S]*?):::/g, (match, ref, body) => {
      const html = md.renderInline(body.trim());
      return `<blockquote class="scripture"><p>${html}</p><span class="scripture-ref">${md.utils.escapeHtml(ref.trim())}</span></blockquote>\n\n`;
    });

    // Image block: :::image path|caption:::
    src = src.replace(/:::image\s+([^\n|]+?)(?:\|([^\n]*))?\s*:::/g, (match, imgSrc, caption) => {
      const cleanSrc = imgSrc.trim();
      const cap = caption && caption.trim() ? `<figcaption>${md.renderInline(caption.trim())}</figcaption>` : "";
      const alt = caption && caption.trim() ? md.utils.escapeHtml(caption.trim()) : "Article image";
      return `<figure class="article-embed-image"><img src="/img.php?src=${encodeURIComponent(cleanSrc)}&w=1200" alt="${alt}" loading="lazy">${cap}</figure>\n\n`;
    });

    // YouTube block
    src = src.replace(/:::youtube\s*\n([^\n]+)\n:::/g, (match, url) => {
      const id = extractYouTubeId(url);
      if (!id) return `<p><em>Invalid YouTube link: ${md.utils.escapeHtml(url.trim())}</em></p>\n\n`;
      return `<div class="article-embed-video"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>\n\n`;
    });

    state.src = src;
  });
}

module.exports = function (eleventyConfig) {
  // Copy these straight through to the output folder, unchanged.
  // Note: assets/ and favicon.ico live at the project root, not inside
  // src/ — this matters because your real uploaded images already live
  // at assets/uploads/ on the server, and this keeps that path
  // identical, so nothing needs to be moved during cutover.
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/img.php");
  eleventyConfig.addPassthroughCopy("src/track-click.php");
  eleventyConfig.addPassthroughCopy("src/.htaccess");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Swap in our extended markdown-it (custom blocks + normal markdown).
  const md = markdownIt({ html: true, breaks: false, linkify: true }).use(customBlocksPlugin);
  eleventyConfig.setLibrary("md", md);

  // Lets non-.md templates (like the About page, driven from a data
  // file rather than its own markdown file) render a markdown string.
  eleventyConfig.addFilter("markdown", (str) => md.render(str || ""));

  // Reading time, used in article headers — same 225wpm estimate as
  // the previous client-side version.
  eleventyConfig.addFilter("readingTime", (html) => {
    const text = (html || "").replace(/<[^>]*>/g, " ");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 225));
  });

  eleventyConfig.addFilter("formatDate", (dateObj) => {
    return new Date(dateObj).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  });

  eleventyConfig.addFilter("limit", (arr, n) => {
    return Array.isArray(arr) ? arr.slice(0, n) : arr;
  });

  eleventyConfig.addFilter("toArticleIndex", (collection) => {
    return (collection || []).map((item) => ({
      title: item.data.title,
      slug: item.data.slug
    }));
  });

  // True for a real uploaded file path (e.g. "assets/uploads/x.jpg"),
  // false for one of the built-in gradient placeholder class names
  // (e.g. "img-1"). Used everywhere an image field could be either.
  eleventyConfig.addFilter("isImageFile", (image) => {
    if (!image) return false;
    return /\.(png|jpe?g|webp|gif|svg)$/i.test(image) || image.includes("/");
  });

  // Strips a single leading slash, e.g. "/assets/uploads/x.jpg" ->
  // "assets/uploads/x.jpg" — img.php expects a relative path.
  eleventyConfig.addFilter("stripLeadingSlash", (str) => {
    return (str || "").replace(/^\/+/, "");
  });

  // Builds a full img.php compression-proxy URL from an image path and
  // a target width, e.g. imgProxy("/assets/uploads/x.jpg", 900).
  eleventyConfig.addFilter("imgProxy", (image, width) => {
    const clean = (image || "").replace(/^\/+/, "");
    return `/img.php?src=${encodeURIComponent(clean)}&w=${width}`;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
