# Phase 1 — Eleventy Architecture (Review Before Phase 2)

This is **not connected to your live site**. Nothing here has touched
GitHub, Netlify, DecapBridge, or EthernetServers. This is purely the new
foundation, built for you to look over before Phase 2 wires it up for
real.

## What's in here

- `.eleventy.js` — the whole configuration: input/output folders, the
  custom markdown processor (Scripture/Image/YouTube blocks), and a
  handful of small helper functions ("filters") the templates use.
- `src/_includes/` — the reusable page pieces: `base.njk` (the outer
  shell every page shares), `header.njk`, `footer.njk`, `sidebar.njk`,
  and `article.njk` (the template every article gets wrapped in).
- `src/articles/` — **two of your real, recovered articles**
  ("Why does my life have to be this way?" and "Make God Loud"), used
  as proof this actually works with your real content rather than
  placeholder text. The other four aren't in here yet — no need to
  duplicate that work until Phase 3, when re-entering content happens
  through the new CMS interface anyway.
- `src/index.njk`, `src/articles.njk`, `src/about.njk` — the homepage,
  articles archive, and about page.
- `src/styles.css`, `src/assets/`, `src/favicon.ico` — copied directly
  from your live site, completely unchanged.

## What changed architecturally (the actual point of this phase)

**The homepage and articles archive no longer need JavaScript to show
you content.** Previously, the page loaded blank and then JavaScript
fetched `content/site-content.json` and built the page from scratch —
which is exactly the mechanism behind the "content failed to load"
banner you saw way back when testing locally. Now, Eleventy bakes the
actual article list directly into the HTML before it ever reaches a
browser. That entire category of failure goes away.

**Only two things still use JavaScript, and they genuinely have to:**
the Daily Quote's randomness (a static build can't "randomize" — the
random pick has to happen freshly in each visitor's browser) and
Trending (real visitor click data can't be known at build time). Both
are handled by a small script in `sidebar.njk` — everything else on the
page is now plain, pre-built HTML.

## What I've verified vs. what's still unverified

I don't have the ability to actually run Eleventy in this environment
(no internet access here to install it), so I want to be precise about
what "checked" means for this delivery:

**Actually tested, with real output:**
- The Scripture/Image/YouTube block-parsing logic — tested directly
  against your real recovered article text, confirmed it correctly
  finds and transforms the Scripture block in "Why does my life have to
  be this way?"
- Every template's `{% %}` and `{{ }}` tags are balanced, and every
  `for`/`endfor` and `if`/`endif` pair matches.
- Both sample article files parse correctly as valid frontmatter +
  body.

**Written carefully and cross-checked against real Nunjucks
documentation, but not run:** the templates themselves. While building
these, I actually caught and fixed three real mistakes this way —
filters I'd half-remembered from a different templating tool that
don't actually exist in Nunjucks (`limit`, `mapAttribute`), and a spot
where I'd written JavaScript-style `.endswith()` directly in a
template, which Nunjucks doesn't support. I mention this not to alarm
you, but so you know the review process is actually catching real
things, and so it's clear why Phase 2 (where this gets its first real
build) still matters even after this careful a pass.

## What Phase 2 will actually do

Wire this into GitHub Actions, which will run `eleventy` for real for
the first time — that's when we'll see if anything I couldn't verify
here needs a fix. If something breaks, that's expected and normal for
a project like this, not a sign anything went wrong in Phase 1.

---

# Phase 2 — Automated Building (Preview Only, Not Live)

## What this phase does, and doesn't do

Adds a GitHub Actions workflow (`.github/workflows/build.yml`) that
automatically runs the actual Eleventy build every time anything is
pushed to `main` — including when DecapBridge publishes a CMS edit,
since that's a push under the hood too. The finished result gets pushed
to a new branch called **`built-site`**, purely for inspection.

**Your live site is not affected in any way.** Your EthernetServers
cron job keeps pulling from `main` exactly as it does today, and
`main` still contains your current live site files, completely
unchanged. This phase exists to answer one question — does the actual
build succeed? — without any risk to what's currently working.

## One required one-time setting, before this will work

GitHub Actions needs permission to push the `built-site` branch back to
your repo. By default, some repos have this locked to read-only. Check
it now:

1. On GitHub.com, go to your repo → **Settings** → **Actions** →
   **General**
2. Scroll to **Workflow permissions**
3. Make sure **"Read and write permissions"** is selected (not
   "Read repository contents permission")
4. Save if you changed it

If this is set wrong, the workflow will run but fail on its last step
with a permissions error — worth checking now rather than debugging
that later.

## Getting this into your repo

1. In GitHub Desktop, **Fetch origin** first (standing rule, always)
2. Copy everything from this delivery into your local repo folder —
   this adds new files (`.eleventy.js`, `package.json`, `src/`,
   `.github/`) alongside your existing live site files. Nothing
   existing gets overwritten or removed.
3. Commit (e.g. `Add Eleventy build system (Phase 2, not yet live)`) →
   Push origin

## Watching it actually run

1. On GitHub.com, go to your repo → the **Actions** tab
2. You should see a workflow run start within a few seconds of your
   push, named after your commit
3. Click into it to watch the steps run live — this is the real,
   honest first test of everything built in Phase 1
4. Green checkmark = it worked. Red X = something needs fixing, and
   the logs will show exactly which step and why — paste me whatever
   it shows and I'll fix it from there.

## If it succeeds — what to actually look at

Switch your repo's branch dropdown (top-left, next to the file list)
from `main` to `built-site`. You're looking at exactly what your
website's `index.html`, article pages, etc. would be if this were
live — generated automatically, matching your real recovered content.
Worth opening a few of the generated HTML files directly to sanity
check them, though nothing here is connected to a live URL yet to
click through in a browser.

## What's next

Once you've confirmed the build genuinely works, Phase 3 is where the
real cutover happens — migrating the CMS to the new per-article
editing experience, re-entering your 6 articles through it, and
pointing your live server at `built-site` instead of `main` for the
final time, all together as one coordinated step.

---

# Phase 3 — Real Content Management (Built, Not Yet Cut Over)

## What's actually in this delivery

- **All 6 of your real recovered articles**, migrated into individual
  files in `src/articles/` — nothing re-typed, nothing summarized,
  full original text and formatting preserved.
- **`src/admin/config.yml`**, rebuilt so Articles is a genuine folder
  collection — this is the actual UX payoff. Clicking "Articles" in
  the CMS sidebar now shows a clean list of just your posts; "New
  Article" opens a dedicated full-screen editor for that one article,
  nothing else on screen.
- **About, Authors, and the Daily Quote Gallery**, each now their own
  section in the CMS instead of sharing one big form.
- **New: Site Settings** — the header tagline, footer subscribe text,
  copyright line, and social/Quotes/Substack links are all editable
  through the CMS now, not hardcoded. The site title itself
  ("Read James Wolfe") stays fixed in the template, since you mentioned
  that one shouldn't need to change.

## The one setting I'm least certain about

Every article's filename needs to match its `slug` field (e.g. the
article with slug `whenjesusturned29` needs to live in a file called
`whenjesusturned29.md`) so the site's URLs keep working. I've set this
up using `slug: "{{fields.slug}}"` in the config, which is my best
understanding of the correct syntax — but this is a genuine "first
real test" item, more than most of what's in this project. If a newly
created article's filename doesn't match what you typed in the Slug
field, that's the first thing to tell me about, and it's a small,
isolated fix.

## Cutover checklist — do this once Phase 2 is confirmed working

**Don't do this yet if you haven't checked the Actions tab for a green
checkmark.** Once you have:

1. Push this Phase 3 delivery the same way as before (Fetch origin
   first, copy files in, commit, push) — this will trigger another
   Actions build automatically
2. Check the Actions tab again for this new run — this is the real
   test of the folder-collection restructuring and Site Settings wiring
3. If it succeeds, browse the `built-site` branch and spot-check a
   couple of real articles — do they look right, with Scripture blocks
   intact?
4. **The actual cutover, on your server**: in cPanel Terminal —
   ```
   cd ~/public_html
   git fetch origin built-site
   git reset --hard origin/built-site
   ```
   This is different from your usual `git pull` — worth running by
   hand once to see it work before it becomes the automated cron
   command.
5. **Update your cron job** to run that same two-line command instead
   of the current `git pull origin main` — this is what makes future
   publishes actually go live automatically again
6. Visit your live site and confirm it looks right
7. Log into `/admin` and confirm you see the new clean Articles list

I'd suggest doing this step, specifically, when you have a few minutes
to sit with it rather than as the very last thing before bed — not
because I expect it to fail, but because it's the one step that
actually touches your live server, and it deserves a moment where
you're not rushing.


