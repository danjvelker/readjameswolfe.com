# Deploying ReadJamesWolfe.com — Step by Step

## Important: don't double-click the files to preview them

This site loads its content dynamically, the way a real website does.
That means if you just double-click `index.html` (or any page) and it
opens directly in your browser as a local file, **the content won't
load** — you'll see a green banner explaining this, and empty-looking
pages. This is expected, not a bug, and it isn't something that can be
fixed on the file side — it's a standard browser security rule.

**The fix is simple: skip local previewing entirely and deploy to
Netlify first (step 1 below).** Once it's live on the internet — even on
the free `netlify.app` address, before you connect your real domain —
every page will work correctly, including the content editor. The whole
process below takes about 10 minutes and costs nothing.

## Should you delete your old files first?

**Yes.** Replace everything in your project folder with the files from
this latest export — don't mix old and new versions together. The
biggest reason: earlier versions used a file called `data.js` that this
version doesn't use anymore (it's been replaced by
`content/site-content.json`). If both exist together it'll cause
confusion, not breakage, but it's cleanest to start fresh with exactly
the files provided now.

This site needs two free accounts to get the "log in and publish" content
editor working: **GitHub** (stores your files and tracks every change) and
**Netlify** (hosts the live site and provides the login system for the
editor). Total cost: $0.

**Already have your site live on Netlify?** Skip to **section 3** below —
that's the only part that needs fixing.

---

## 1. Create a GitHub account and repository

1. Go to [github.com](https://github.com) and sign up (skip if you already
   did this).
2. Click the **+** in the top right → **New repository**.
3. Name it something like `readjameswolfe-site`. Keep it **Private** if
   you'd rather your drafts not be publicly visible in the repo (this
   doesn't affect the live site, which is public either way).
4. Click **Create repository**.
5. On the next page, follow GitHub's instructions under
   **"…or push an existing repository from the command line"** — this
   uploads all the files in this folder to GitHub. If you're not
   comfortable with the command line, GitHub also lets you drag-and-drop
   files directly on the repository page ("Add file" → "Upload files").

## 2. Connect the repo to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up using your GitHub
   account (this makes step 3 much simpler).
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub**, then select the repository you just created.
4. Netlify will detect `netlify.toml` automatically. You don't need to
   set a build command — leave that field blank. Click **Deploy**.
5. After a minute, Netlify gives you a live URL like
   `https://random-name-123.netlify.app`. That's your site, live on the
   internet. (You can add your real domain name later under
   **Site settings → Domain management** — that step isn't required to
   keep working on the site today.)

## 3. Turn on the login system (DecapBridge)

This is what makes `/admin` actually let you log in and publish. Netlify
used to offer this (called "Identity" + "Git Gateway"), but **Netlify
discontinued that in February 2025** — so the version of this guide you
may have seen before no longer works for new sites. This uses
**DecapBridge**, a free service built specifically to replace it.

1. Create a GitHub **personal access token** (this is what lets
   DecapBridge save your published changes to your repo):
   - Go to <https://github.com/settings/tokens> → **Fine-grained tokens**
     → **Generate new token**.
   - Give it a name like "DecapBridge", set it to only your
     `readjameswolfe-site` repository, and under **Permissions** grant
     **Contents: Read and write**.
   - Generate it and **copy the token somewhere safe** — GitHub only
     shows it once.
2. Go to [decapbridge.com](https://decapbridge.com) and create a free
   account.
3. In the dashboard, click **Add a site** and fill in:
   - **Git provider**: GitHub
   - **Git repository**: `your-github-username/your-repo-name`
   - **Git access token**: the token you created in step 1
   - **Decap CMS login URL**: `https://your-site-name.netlify.app/admin/index.html`
     (use your real Netlify URL, or your custom domain once connected)
   - **Auth type**: choose **Classic** (a simple email + password login)
     unless you specifically want "Login with Google/Microsoft," in
     which case choose **PKCE**.
4. Click **Create site**. DecapBridge will show you a `backend:` block —
   copy it exactly.
5. Open `admin/config.yml` in your repository and replace the `backend:`
   section at the top with the one DecapBridge just gave you (it already
   has a placeholder there showing the shape to expect). Commit and push
   that change to GitHub — Netlify will redeploy automatically.

## 4. Invite yourself (and anyone else) as an editor

1. Back in the DecapBridge dashboard, open your site → **Manage
   collaborators**.
2. Enter your own email and send the invite.
3. Check your email, click the link, and set a password (or choose
   Google/Microsoft if you set up PKCE).

## 5. Log in and publish something

1. Visit `https://your-site-name.netlify.app/admin/`
2. Log in with the account you just set up.
3. You'll see **Site Content** → **Articles, Quotes & About** — open it.
4. Try editing an article's excerpt, or adding a new tag, and click
   **Publish** (top right).
5. Give it 30–60 seconds — Netlify rebuilds the file in the background —
   then refresh your live site. Your change is there.

That's the whole loop: **edit in the browser → Publish → live in under a
minute**, with every change automatically saved to GitHub as a permanent
history you can look back through.

---

## Adding a new article, in practice

1. Go to `/admin/`, open **Articles**, click **Add** (bottom of the
   Articles list).
2. Fill in: Title, Slug (short web-address version of the title, e.g.
   `finding-rest-in-ordinary-days`), Header Image (upload a photo), Date,
   Excerpt, Tags, and toggle **Show in Homepage Feed** on or off.
3. Write the body using the toolbar (bold, italic, headings, links,
   lists, block quotes). For a Scripture callout, use the **+** button in
   the editor and choose **Scripture Quote** — fill in the reference and
   verse text, no markdown syntax needed.
4. Click **Publish**.

## A few things worth knowing

- **Deleting content**: open any article or quote in the list and use the
  trash-can icon on that entry to remove it entirely.
- **The "Clicks" field**: this powers the sidebar's Trending list. Real
  click tracking isn't wired up yet (see the phase 5 notes I gave you
  earlier) — for now this is a manual number, safe to leave at 0.
- **RSS feed (`feed.xml`)**: this one can't update itself the way the
  rest of the site does — RSS readers need real static XML, not
  JavaScript-rendered content. After publishing new articles, someone
  with Node installed can run `node scripts/generate-feed.js` locally
  and push the updated `feed.xml`. I'm also happy to regenerate this for
  you anytime in a future chat if you paste in your current
  `content/site-content.json`.
- **Underline, text color, and highlight**: not included in this pass —
  the CMS's editor doesn't support these out of the box, and building
  them safely means custom plugin code I can't verify without being able
  to run it. Flagging this as a good candidate for a focused follow-up
  if you'd like it.
