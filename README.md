# LegisLetter 📜

**Make your voice heard before the vote — not after.**

A civic engagement web app that looks up your real elected representatives, then uses Claude AI to draft a personalized constituent letter on your behalf.

---

## How to get this live at legisletter.us

Work through these four steps in order. Each one takes about 5–10 minutes.

---

### Step 1 — Create a GitHub account and upload the code

GitHub is a free website that stores your code. Vercel (your hosting service) connects to it.

1. Go to **github.com** and sign up for a free account
2. Click the **+** in the top-right corner → "New repository"
3. Name it `legisletter`, leave everything else as-is, click "Create repository"
4. On your computer, open Terminal (search "Terminal" in Spotlight)
5. Type these commands one at a time, pressing Enter after each:

```
cd ~/Desktop
cd legisletter
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/legisletter.git
git branch -M main
git push -u origin main
```

(Replace YOUR_USERNAME with your actual GitHub username)

---

### Step 2 — Deploy on Vercel

Vercel is the service that puts your site on the internet and runs your backend.

1. Go to **vercel.com** and click "Sign Up" → "Continue with GitHub"
2. Click **"Add New Project"**
3. Find your `legisletter` repository and click **"Import"**
4. Leave all settings as they are and click **"Deploy"**
5. Wait about 60 seconds — you'll see a live URL like `legisletter.vercel.app`

---

### Step 3 — Get your API keys

You need two keys. Both are free to obtain.

#### Google Civic Information API key (free)

This looks up real legislators by address.

1. Go to **console.cloud.google.com** and sign in with your Google account
2. Click "Select a project" at the top → "New Project" → name it "LegisLetter" → "Create"
3. In the search bar, search for **"Civic Information API"** and click it
4. Click **"Enable"**
5. Click **"Create Credentials"** → "API Key"
6. Copy the key — it looks like `AIzaSyB...`

#### Anthropic API key (small cost — ~$5 covers thousands of letters)

This powers the AI letter drafting.

1. Go to **console.anthropic.com** and sign in (same account you use for Claude)
2. Click **"API Keys"** in the left sidebar → "Create Key"
3. Name it "LegisLetter", click "Create"
4. Copy the key — it looks like `sk-ant-...`
5. Click **"Billing"** in the sidebar and add $5–10 to your account

---

### Step 4 — Add your keys to Vercel

This is how your keys stay hidden from users.

1. Go back to **vercel.com** → your legisletter project
2. Click **"Settings"** → **"Environment Variables"**
3. Add two variables:

| Name | Value |
|---|---|
| `GOOGLE_CIVIC_API_KEY` | Your Google key (AIzaSy...) |
| `ANTHROPIC_API_KEY` | Your Anthropic key (sk-ant-...) |

4. Click "Save" for each one
5. Go to **"Deployments"** → click the three dots next to your latest deployment → **"Redeploy"**

---

### Step 5 — Connect your legisletter.us domain

1. In Vercel, go to your project → **"Settings"** → **"Domains"**
2. Type `legisletter.us` and click "Add"
3. Vercel will show you a DNS record to add — it'll look like a CNAME pointing to `cname.vercel-dns.com`
4. Log into wherever you bought the domain (GoDaddy, Namecheap, etc.)
5. Find the DNS settings and add that CNAME record
6. Wait 10–30 minutes for it to propagate

**That's it — you're live.**

---

## What works now vs. what's coming

| Feature | Status |
|---|---|
| Address lookup → real legislators | ✅ Live (Google Civic API) |
| AI-drafted letters | ✅ Live (Claude API) |
| Email confirmation to user | 🔜 Ready to add (see api/send.js) |
| Direct email to legislators | 🔜 Ready to add (see api/send.js) |

To add real email sending, see the commented code in `api/send.js` — it uses Resend, which is free for up to 3,000 emails/month.

---

## Project structure

```
legisletter/
├── index.html              Entry HTML
├── package.json            Dependencies
├── vite.config.js          Build config
├── src/
│   ├── main.jsx            React entry point
│   ├── App.jsx             Main app (all UI and flow)
│   └── index.css           Global styles
└── api/
    ├── legislators.js      Backend: looks up real legislators (Google)
    ├── draft.js            Backend: drafts letter with Claude AI
    └── send.js             Backend: handles sending (ready for email)
```
