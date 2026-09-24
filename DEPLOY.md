# Deploying SCGIP to Vercel (+ Neon Postgres)

Free forever, no credit card, ~10 minutes. Local dev stays on SQLite — only Vercel's build swaps to Postgres.

---

## 0. What's already done (in the repo)

- `vercel.json` — build-time Postgres swap + schema sync + 60s function limits for SSE/chat
- `lib/store.tsx` — 8s visible-tab poll as real-time safety net (serverless instances can't push SSE cross-instance)
- AI chat falls back to rule-based answers when FastAPI is unreachable — no second service needed on Vercel
- `scripts/prod-init.ts` — creates your sole admin at boot from env vars

## 1. Create the Postgres database (Neon — free tier)

1. Go to [neon.tech](https://neon.tech) → sign up with GitHub
2. Create project: name `scgip`, region **Singapore**
3. Copy the **connection string** — looks like:
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. **Add `&pgbouncer=true&connect_timeout=15` to the end** (needed for serverless connection limits)

## 2. Deploy the web app (Vercel)

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. **Add New → Project** → Import `lithes-coder/Sanitation-co-governance`
3. Vercel auto-detects Next.js — don't touch build settings (`vercel.json` handles the Postgres swap)
4. Before clicking Deploy, open **Environment Variables** and add:

| Name | Value | Why |
|---|---|---|
| `DATABASE_URL` | your Neon string (with `&pgbouncer=true&connect_timeout=15`) | Postgres on Neon |
| `AUTH_SECRET` | long random string — generate fresh: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | session signing |
| `ADMIN_EMAIL` | `litheshs2007@gmail.com` | your sole admin |
| `ADMIN_PASSWORD` | a strong NEW password (set only here — never in code/chat) | used once at boot by prod-init |

   > ⚠️ `ADMIN_PASSWORD` must be **8+ characters** or prod-init skips creating the admin.
5. Click **Deploy** — first build takes ~3-4 minutes (Prisma schema syncs to Neon automatically)

## 3. First-deploy checklist

- [ ] Build logs show `prisma db push` finishing without errors
- [ ] Visit `https://your-app.vercel.app/login` — loads in < 3s
- [ ] Headers: `curl -sI https://your-app.vercel.app | grep -iE "x-frame|content-security|x-content"` → all present
- [ ] Log in as admin → Ward Map loads with OSM tiles
- [ ] Submit a test complaint → pin appears within ~8s on a second tab (SSE + poll safety net)
- [ ] AI chat answers (rule-based fallback — fully functional without the Python service)

## 4. The AI assistant (optional, later)

The FastAPI service can't run on Vercel. When you want the full agentic AI back:

- Deploy `agenticAI/` on **Hugging Face Spaces** (free) or Railway, then set `FASTAPI_URL` in Vercel env vars to its public URL. Until then the built-in fallback handles chat.

## 5. After go-live

- Put the URL at the top of the README + GitHub "About" field
- Strix pentest the production URL (Groq key first) → LinkedIn line: "OWASP ZAP DAST + AI-agent pentest on production build"
- Vercel free tier (Hobby): non-commercial use — perfect for a student project demo

## Notes & limits (free tier)

- Vercel Hobby: 100 GB bandwidth/mo, serverless function 60s max (set for SSE/chat) — plenty for demos
- Neon free: 0.5 GB storage (~50k+ complaints), scales to zero after 5 min idle; first request after idle adds ~500ms warm-up, then fast again
- Your local dev remains SQLite + instant SSE — untouched
