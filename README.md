# Doccer 😎

A Gen-Z flavoured README for Doccer - fast docs, file vibes, and chatty collabs. Keep it chill, but nerdy. ⚡️

---

## 🌐 Production URL

Your production site URL (replace this placeholder with your actual domain):

https://doccer.pages.dev/

If you deployed with Pulumi, you can get the real URL from the stack outputs:

```powershell
pulumi stack select <your-org>/<project>/<stack>  # e.g. pulumi stack select vickatGit/Doccer/dev
pulumi stack output siteUrl
```

If your Pulumi program outputs a different key, run `pulumi stack output --json` and look for relevant fields.

---

## 🚀 Quickstart (local)

We use a two-folder structure in this repo: `client/` (frontend) and `server/` (backend). These commands assume PowerShell on Windows.

Prereqs ✅

- Node.js (16+ recommended) 🟢
- npm or pnpm/yarn 📦
- MongoDB (local or a connection string) 🍃
- Pulumi & AWS CLI (for infra) ☁️🧰

### Frontend (client) 💅

1. cd into the client folder and install deps:

```powershell
cd "d:\VS code\Doccer\client"
npm install
# or: pnpm install
```

2. Create a `.env` (or copy `.env.example` if you make one) and add any Vite env vars (prefix with `VITE_`). Example:

```env
# client/.env
VITE_API_URL=http://localhost:5001
# VITE_ABLY_KEY=your_ably_key
```

3. Run local dev server:

```powershell
npm run dev
# open http://localhost:5173 (or whatever Vite prints)
```

### Backend (server) 🛠️

1. cd into server and install:

```powershell
cd "d:\VS code\Doccer\server"
npm install
```

2. Add your environment variables (see the Env section below). You can create a `.env` at the repo `server/` folder.

3. Run dev server:

```powershell
npm run dev
# or: nodemon src/index.ts if configured
# server typically listens on PORT=5001
```

Open http://localhost:5001 to hit backend endpoints.

---

## ☁️ Infrastructure with Pulumi (AWS) ⚙️

This project includes Pulumi infra in `IAC/`. Quick steps to get infra running.

Note about `IAC/.env` 📂

The `IAC/` folder uses a simple `.env` to provide non-secret config values used by the Pulumi program. In this repo the file contains a single key:

```env
# IAC/.env
BUCKET_NAME=Doccer
```

This value is not a secret (it's just the bucket name). For secrets (AWS creds, API keys) prefer Pulumi config with `--secret`, AWS Secrets Manager, or environment variables injected by your CI/CD system. You can also add an `IAC/.env.example` with placeholders to help contributors.

### 1) Install Pulumi & AWS CLI 🧰

Install Pulumi (https://www.pulumi.com/docs/get-started/install/) and AWS CLI. On Windows you can use the installers.

### 2) Authenticate Pulumi 🔐

Pulumi supports many backends; simplest is Pulumi Cloud or local. Example (Pulumi Cloud):

```powershell
pulumi login  # logs into Pulumi Service (interactive)
# or pulumi login --local
```

### 3) Provide AWS credentials 🔑

You can either export creds for the current session (temporary) or store them persistently.

Temporary (current PowerShell session):

```powershell
# ephemeral for this shell
$env:AWS_ACCESS_KEY_ID = "<YOUR_KEY_ID>"
$env:AWS_SECRET_ACCESS_KEY = "<YOUR_SECRET>"
$env:AWS_REGION = "ap-south-1"    # or your region
```

Persistent (Windows user env):

```powershell
setx AWS_ACCESS_KEY_ID "<YOUR_KEY_ID>"
setx AWS_SECRET_ACCESS_KEY "<YOUR_SECRET>"
setx AWS_REGION "ap-south-1"
# Close and re-open shells to pick up setx changes
```

Alternative: `aws configure` (AWS CLI will write to %USERPROFILE%\.aws\credentials)

### 4) Init/select your Pulumi stack 🗂️

```powershell
cd "d:\VS code\Doccer\IAC"
pulumi stack init dev   # or pulumi stack select <org>/<proj>/<stack>
```

### 5) Set Pulumi config (example keys) 🔒

Use Pulumi config to supply secrets (or use env vars):

```powershell
pulumi config set aws:region ap-south-1
pulumi config set server:bucketName doccer-beb10fa
# For secrets
pulumi config set aws:accessKey "<YOUR_KEY>" --secret
pulumi config set aws:secretKey "<YOUR_SECRET>" --secret
```

Replace keys with your real values. Check `IAC/index.ts` to see what config keys are expected.

### 6) Deploy 🚢

```powershell
pulumi up --yes
```

After the run, Pulumi will print stack outputs. Look for outputs that contain the website URL or bucket/CloudFront domain. Example:

```powershell
pulumi stack output siteUrl
# or
pulumi stack output --json
```

---

## ⚙️ Environment variables 🔑

Copy/paste the variables you need. Keep secrets secret. Example server `.env` (based on the repo's `server/.env`):

```env
# server/.env (example)
PORT=5001
dbUrl=mongodb+srv://<user>:<pw>@cluster0.../dbname
AWS_ACCESS_KEY_ID=AKIA...        # optional if using env-based creds
AWS_SECRET_ACCESS_KEY=...        # optional
AWS_REGION=ap-south-1
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_AUTH_SECRET_KEY=...
BUCKET_NAME=doccer-beb10fa
PINECONE_API_KEY=pcsk_...
COHERE_API_KEY=...
ABLY_API_KEY=D8_NQg.gpYt2g:Wp1...  # if using Ably
```

Frontend `.env` (Vite requires `VITE_` prefix):

```env
# client/.env
VITE_API_URL=http://localhost:5001
VITE_ABLY_KEY=D8_NQg.gpYt2g:Wp1...
```

⚠️ Safety tip: never commit `.env` to git. Add `server/.env` and `client/.env` to `.gitignore`.

---

## 🪄 Deploy flow (summary) ▶️

1. Ensure infra is provisioned: `cd IAC && pulumi up`
2. Build backend, push container or deploy directly to the infra targets (see IAC)
3. Build frontend and upload to hosting (S3 + CloudFront or other)

Example (local build + manual S3 upload):

```powershell
# build frontend
cd "d:\VS code\Doccer\client"
npm run build
# then upload dist/ to S3 or let Pulumi handle hosting
```

---

## 🧰 Troubleshooting & tips 🛟

- Can’t find the production URL? Run `pulumi stack output --json` and scan for domains. 🔎
- Pulumi errors about credentials? Check your AWS env vars or run `aws configure`. 🔐
- DB connection issues? Verify `dbUrl` and that network access is allowed from your environment. 🌐
- Want secrets safer? Use `pulumi config set <key> <value> --secret` or an AWS Secrets Manager integration. 🔒

---

## 🤝 Contributing 📝

PRs welcome. Keep changes small and add tests where appropriate. If you're adding infra changes, please:

1. Create a new Pulumi stack (e.g., `pulumi stack init feature/<you>`) 🧪
2. Test infra locally ✅
3. Open a PR that documents the infra changes and any new config keys 📝

---

## ✨ Final vibes 🌈

This README is meant to be friendly and practical — go deploy, iterate, and ping if you want help wiring CI/CD or making the Pulumi outputs nicer (I can draft a GitHub Action for deployment next). Peace, code, and good docs. ✌️

---

_Generated with ✨ by your README sidekick — tweak the URLs & secrets, then flex your prod site!_
