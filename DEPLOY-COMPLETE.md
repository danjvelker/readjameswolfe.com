# Deploying the New Site — Complete Guide

This covers everything, start to finish: getting these files into your
repo, watching the automated build run for the first time, checking it
carefully, and switching your live site over. Nothing in this file
assumes you've done any of it already.

**Time estimate**: 30–45 minutes if everything goes smoothly, done in
one sitting, ideally when you're not rushed — the cutover step near the
end is the one part that touches your live server.

---

## Before you start: what's actually about to happen

Right now, your live site is a mix of static HTML pages and PHP files
(`article.php`, `feed.php`, etc.), reading content from one big
`content/site-content.json` file. After this deploy, your site will be
**pre-built automatically** by a tool called Eleventy every time you
publish something — faster, more reliable, and your content editor
(`/admin`) will have a much cleaner "click Articles, see a clean list"
experience instead of one long scrolling form.

Your hosting doesn't change. Your domain doesn't change. DecapBridge
doesn't change. The only things that change are: how the site gets
built, and how the CMS is organized.

**This all happens in two stages**, and that split matters:

- **Stage A** — push the new files, let the automated build run, and
  actually look at what it produces. Your live site is **completely
  unaffected** during this stage — it keeps working exactly as it does
  right now.
- **Stage B** — the actual cutover, where your live server starts
  serving the new build instead of the old one.

Do not skip straight to Stage B. The whole point of Stage A is to catch
any problems while your real site is still safely running the old way.

---

## Stage A — Get the build running, and check it

### A1. One-time GitHub setting (do this first)

GitHub Actions (the automation that builds your site) needs permission
to save its results back to your repo. Check this before anything else:

1. On GitHub.com, go to your repository → **Settings** → **Actions** →
   **General**
2. Scroll to **Workflow permissions**
3. Select **"Read and write permissions"** (not the read-only option)
4. Click **Save** if you changed anything

If this is set wrong, everything else below will *appear* to work and
only fail on the very last step, so it's worth 30 seconds now.

### A2. Get the files into your local repo

1. Unzip the file I gave you (`eleventy-phase3.zip`) — this contains
   everything from all three phases combined into one project, so you
   only need to do this once, not in stages.
2. Open **GitHub Desktop**. Click **Fetch origin** first, always — this
   is the standing rule from here on, every single time, no exceptions.
3. Open the unzipped folder, select everything inside it (Ctrl+A /
   Cmd+A), and copy it directly into your local repo folder — the same
   one GitHub Desktop is tracking. Confirm "Replace" if asked about any
   matching filenames.
4. Back in GitHub Desktop, glance at the list of changes on the left.
   You should see a large number of **new** files (`.eleventy.js`,
   `package.json`, everything under `src/`, `.github/`) and your
   existing site files should mostly show as **unchanged** — this step
   adds a parallel new system alongside your current one, it doesn't
   replace it yet.
5. Type a commit message like `Add Eleventy build system` → **Commit
   to main** → **Push origin**

### A3. Watch the first real build happen

1. On GitHub.com, go to your repo → the **Actions** tab
2. Within a few seconds, you should see a new workflow run appear,
   named after your commit
3. Click into it and watch the steps run live. This is the actual,
   genuine first test of everything that's been built — up to this
   point, all of it was carefully written but never executed.
4. **Green checkmark** = it worked, move on to A4.
   **Red X** = something needs fixing — click into the failed step to
   see the error, and send me exactly what it says. This is completely
   fixable; it just means we debug it here, with your live site still
   safe and unaffected the whole time.

### A4. Check what it actually built

1. Back on your repo's main page, use the branch dropdown (top-left,
   near the file list) to switch from `main` to **`built-site`**
2. You're now looking at the real, generated output — actual HTML
   files for your homepage, each article, etc., built automatically
   from your real content
3. Worth opening a couple of the article files and skimming them —
   especially checking that a Scripture block rendered correctly
   (search for `class="scripture"` in one of the article HTML files
   that should have one, like `whydoesmylifehavetobethisway`)

If this all looks right, you're done with Stage A and ready for the
real cutover whenever you have a clear few minutes — no need to do it
in the same sitting if you're tired.

---

## Stage B — The actual cutover

Do this when you can give it a little focus — not because it's likely
to go wrong, but because it's the one step that touches your real,
live server.

### B1. Do a manual test pull on your server first

In cPanel → Terminal:

```
cd ~/public_html
git fetch origin built-site
git reset --hard origin/built-site
```

This is different from your usual `git pull` — `git reset --hard`
forces your server's files to exactly match the `built-site` branch,
discarding anything that doesn't match. That's exactly what you want
here, and it will **not** touch `content/click-counts.json` (it's
gitignored, so click-tracking data survives this untouched).

### B2. Check your live site

Visit `https://readjameswolfe.com` in a normal browser tab. It should
look identical to before — same design, same content, same everything
— just built differently under the hood now. Click into a couple of
articles. Try the Daily Quote gallery button.

### B3. Update your cron job

cPanel → **Cron Jobs** → find your existing job → edit it.

Replace the command with:

```
cd ~/public_html && git fetch origin built-site && git reset --hard origin/built-site >> ~/cron-deploy.log 2>&1
```

This is what makes future publishes go live automatically again, the
same way they do today — just pointed at the new branch.

### B4. Log into the CMS and confirm the new experience

1. Visit `https://readjameswolfe.com/admin/`
2. Log in as usual
3. Click **Articles** in the sidebar — you should see a clean list of
   your 6 real articles, not a long scrolling form
4. Click into one, confirm the content looks right, and that a
   Scripture-block article shows the special formatting in the preview
5. Check **Site Settings** — this is new. Try editing the tagline,
   publish, and confirm it updates on the live site after the cron job
   runs (or trigger `git fetch && git reset --hard` manually again for
   an instant check)

### B5. One thing to verify specifically: new article filenames

The very next time you create a brand-new article (not editing an
existing one), check that the file it creates in
`src/articles/` on GitHub matches the Slug you typed in. This is the
one piece of the CMS config I flagged as genuinely uncertain going in
— if the filename doesn't match, that's a quick, isolated fix, not a
sign anything else is wrong.

---

## If something goes wrong

At every stage above, your safety net is the same one that's saved you
twice already: **git keeps everything**. Nothing is ever truly lost —
worst case, your server's `git reset --hard` target can be pointed back
at `origin/main` (your old, working setup) in the same two commands
from B1, just swapping the branch name back.

If a build fails, or something looks wrong after cutover, tell me
exactly what you're seeing — the specific error text, which page,
what you expected vs. what happened — and we'll work through it the
same way we have with everything else so far.
