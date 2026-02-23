# Holy Trivia 🔥 — Deploy to Railway

## What's in this folder
```
holy-trivia/
├── server.js          ← Node.js + Socket.io backend
├── package.json       ← Dependencies
├── .gitignore
└── public/
    └── index.html     ← The full game (served by the backend)
```

---

## Step-by-Step Deployment

### STEP 1 — Install Git (if you don't have it)
Download from https://git-scm.com and install it.
Verify: open Terminal / Command Prompt and type `git --version`

### STEP 2 — Install Node.js (if you don't have it)
Download from https://nodejs.org (click the LTS version)
Verify: `node --version`

### STEP 3 — Create a GitHub account (if you don't have one)
Go to https://github.com and sign up for free.

### STEP 4 — Create a new GitHub repository
1. Go to https://github.com/new
2. Name it: `holy-trivia`
3. Keep it Public
4. Do NOT add README or .gitignore (we have our own)
5. Click "Create repository"
6. Copy the URL shown — it looks like: `https://github.com/YOURNAME/holy-trivia.git`

### STEP 5 — Push this folder to GitHub
Open Terminal (Mac/Linux) or Command Prompt (Windows) in this folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOURNAME/holy-trivia.git
git push -u origin main
```
(Replace YOURNAME with your actual GitHub username)

### STEP 6 — Deploy on Railway
1. Go to https://railway.app/new
2. Click **"GitHub Repository"**
3. Connect your GitHub account if asked
4. Select your `holy-trivia` repository
5. Railway auto-detects Node.js — click **"Deploy"**
6. Wait ~1 minute for the build to finish
7. Click **"Settings"** → **"Networking"** → **"Generate Domain"**
8. You get a URL like: `https://holy-trivia-production.up.railway.app`

### STEP 7 — Share and play!
Share that URL with anyone. They just open it in any browser — no install needed.

---

## How it works
- The server runs on Railway 24/7
- Players connect via WebSockets (Socket.io) — instant real-time sync
- Room codes work across any device, anywhere in the world
- Free Railway tier gives you 500 hours/month (more than enough for a game)
