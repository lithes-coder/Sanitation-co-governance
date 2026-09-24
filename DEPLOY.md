# Deploying SCGIP to Railway

Two services, one volume, ~10 minutes. Region: **Singapore** (closest to Chennai → fastest loads for you and your audience).

---

## 0. Before you start

- ✅ Security fixes pushed to GitHub (README credentials + seed backdoor removed)
- The repo now contains `railway.json` (web), `agenticAI/railway.json` (AI service), and the `start:prod` script

## 1. Create the web service (Next.js)

1. Go to [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo** → pick `Sanitation-co-governance`
2. Railway auto-detects the root `railway.json` → builds with nixpacks
3. Open the service → **Settings → Networking → Generate Domain** → note the URL
4. **Settings → Region → Singapore**

### Variables (service → Variables)

| Name | Value | Why |
|---|---|---|
| `DATABASE_URL` | `file:/data/prod.db` | SQLite on the persistent volume (step 2) |
| `AUTH_SECRET` | long random string (generate fresh!) | session signing — **never reuse your local one** |
| `ADMIN_EMAIL` | `litheshs2007@gmail.com` | your sole admin |
| `ADMIN_PASSWORD` | a strong NEW password (only here, never in code/chat) | used once by `prod-init` at boot |
| `FASTAPI_URL` | `http://agenticai.railway.internal:8000` | internal link to the AI service (adjust to the actual service name) |
| `AUTHORITY_WEBHOOK_URL` / `AUTHORITY_WEBHOOK_SECRET` | *(optional — leave unset for mock gateway)* | real GCC integration later |

> Generate `AUTH_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 2. Attach the volume

Service → **Volumes → New Volume** → mount path **`/data`** → Singapore region.
SQLite writes to `/data/prod.db`, which survives every redeploy.

## 3. Create the AI service (FastAPI)

1. Same project → **New → GitHub Repo** → same repo, but set **Root Directory = `agenticAI`**
2. Railway picks up `agenticAI/railway.json` → runs `uvicorn server:app --host 0.0.0.0 --port $PORT`
3. Optional variables: `LLM_PROVIDER`, `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` (works without them — falls back to rule-based mode)
4. No volume, no public domain needed (web app talks to it over the private network)

## 4. First deploy checklist

- [ ] Web service logs show `[prod-init] admin ready: litheshs2007@gmail.com`
- [ ] `https://YOUR-APP.up.railway.app/login` loads (railway healthcheck passes on `/login`)
- [ ] Headers: `curl -sI https://YOUR-APP.up.railway.app | grep -iE "x-frame|content-security|x-content"` → all present
- [ ] Log in as admin → map loads with tiles (CSP already allows OSM)
- [ ] Submit a test complaint in one tab → pin appears **live** in another tab (SSE works)
- [ ] Delete the two `REALTIME-TEST` complaints if you don't want them in the demo

## 5. After go-live

- Put the URL at the top of the README + GitHub "About" field
- Run Strix against the **production** URL (Groq key first) → add the production pentest line to LinkedIn
- Don't commit `.env` — Railway Variables is the single source of truth

## Cost note

$5 trial credit ≈ 2 weeks of both services running. After that the Hobby plan (~$5/mo) covers it; expect ~$8/mo with the AI service + volume included.
