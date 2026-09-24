# SCGIP → Vercel Deployment: HANDOFF CONTEXT

**Repo:** https://github.com/lithes-coder/Sanitation-co-governance (branch `main`, latest pushed commit: `6527cd7`)
**Local repo:** `C:\Users\lithe\Downloads\sanitation-co-governance-platform`
**Stack:** Next.js 16.1.6 + Prisma 6 (SQLite locally / Neon Postgres on Vercel) + SSE real-time + FastAPI side service (NOT deployed — chat has rule-based fallback)
**Status: ~95% deployed. ONE blocker left (see §1). Everything else verified working.**

---

## 1. THE ONE REMAINING BLOCKER — SSO Deployment Protection

The current production deployment is **live and healthy but redirects all visitors to a Vercel sign-in wall** (new Vercel projects enable "Standard Protection" by default).

**Proof:** `curl -sI https://sanitation-co-governance-platform-ntt71eypz.vercel.app/login` → `302 → https://vercel.com/sso-api?...`

### Fix — pick ONE:

**Option A (dashboard, easiest):**
1. Open: `https://vercel.com/litheshs2007-4521s-projects/sanitation-co-governance-platform/settings/deployment-protection`
2. Turn **Vercel Authentication → Disabled** → **Save**

**Option B (API, no browser):** the previous attempt failed ONLY because of a Windows path bug (`$env:APPDATA` already contains `\Roaming`, appending `/Roaming` again → `Roaming\Roaming`). Correct path is `C:\Users\lithe\AppData\Roaming\com.vercel.cli\Data\auth.json`:

```bash
node -e "
const fs=require('fs');
const token=JSON.parse(fs.readFileSync(process.env.APPDATA+'\\\\com.vercel.cli\\\\Data\\\\auth.json','utf8')).token;
fetch('https://api.vercel.com/v9/projects/sanitation-co-governance-platform?teamId=team_iRFyjWDl3kCudBvaru6efNAn',{
  method:'PATCH',
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({ssoProtection:null})
}).then(r=>r.json()).then(j=>console.log('OK — ssoProtection:',j.ssoProtection??'disabled'))"
```

Protection changes apply instantly — no redeploy needed.

**Verify fixed:** `curl -s https://sanitation-co-governance-platform-ntt71eypz.vercel.app/login | grep -oE "<title>[^<]*</title>"` → must print the SCGIP login page title (NOT redirect to vercel.com/sso-api).

---

## 2. INFRASTRUCTURE FACTS

| Item | Value |
|---|---|
| Vercel team slug | `litheshs2007-4521s-projects` (teamId `team_iRFyjWDl3kCudBvaru6efNAn`, Hobby plan) |
| Vercel project | `sanitation-co-governance-platform` (id `prj_vZElTpqHXh3CbyjlfGwL1yEevxCn`) |
| Production deployment | `https://sanitation-co-governance-platform-ntt71eypz.vercel.app` (Ready) |
| CLI auth token file | `C:\Users\lithe\AppData\Roaming\com.vercel.cli\Data\auth.json` |
| Neon store | `neon-aqua-desert` (`store_rsR06zZXZeJ8THYC`) — attached to project via API ✓ |
| Neon DB | `neondb` @ ap-southeast-1 (Singapore) — schema synced, table created |
| Env vars on project | `DATABASE_URL` + full Neon set (production+preview) ✓, `AUTH_SECRET`, `ADMIN_EMAIL=litheshs2007@gmail.com`, `ADMIN_PASSWORD` (hidden), `ADMIN_NAME` ✓ |
| Secrets file (local, gitignored) | `.env.deploy-secrets` — contains the ADMIN_PASSWORD (user opens this file personally to read their prod admin password) |
| Admin account on prod | Created at build time by `scripts/prod-init.ts`: `litheshs2007@gmail.com` — sole admin |

### Why an old URL 404s
`https://scgip-n406y6x7a-litheshs2007-4521s-projects.vercel.app` belonged to the FIRST project (`scgip`), which was **deleted** because its framework preset got stuck on `Services` and every route 404'd. The current project is `sanitation-co-governance-platform`. A working fix history is in the chat transcript; the deploy that worked is `vercel deploy --prod --yes` run from the repo root (log: `~/.scgip-vercel-deploy5.log`).

---

## 3. HOW THE DEPLOY WORKS (critical knowledge)

`vercel.json` uses the **new Vercel Services schema** (CLI v59 forces it). The two things that MUST stay:

1. **`services.web.buildCommand`** — swaps Prisma to Postgres at build, syncs schema, bootstraps admin:
   ```
   sed -i -e 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma && npx prisma generate && npx prisma db push --skip-generate && npx tsx scripts/prod-init.ts && npm run build
   ```
   (Local dev keeps SQLite — the swap only exists in the Vercel build container.)
2. **Top-level `rewrites`** — REQUIRED, routes `/` to the service. Without it every path 404s at the platform level:
   ```json
   "rewrites": [{ "source": "/(.*)", "destination": { "service": "web" } }]
   ```

Known failure modes already hit & fixed (do NOT reintroduce):
- ❌ Top-level `functions`/`buildCommand` together with `services` → "owning service is ambiguous" → functions go INSIDE the service block
- ❌ Service name with uppercase (e.g. folder `agenticAI`) → must match `^[a-z]([a-z_-]*[a-z])?$`
- ❌ Uploading local `.env` → Prisma reads `file:./dev.db` and overrides Neon → `.vercelignore` excludes `.env`, `.env*.local`, `.env.deploy-secrets`
- ❌ `pnpm-lock.yaml` (stale, deleted in commit) → Vercel picked pnpm and failed frozen install. npm + `package-lock.json` is the package manager.
- ⚠️ CLI v59 auto-detects any FastAPI-looking folder and forces services mode — `agenticAI/` is excluded via `.vercelignore` AND currently moved out of the repo (see §4).

Deploy command: `npx -y vercel@latest deploy --prod --yes` (from repo root; auth via the token file).

---

## 4. CLEANUP AFTER VERIFICATION (important!)

1. **Restore the FastAPI folder** — it was parked outside the repo during deploys:
   ```bash
   mv "$HOME/scgip-parked-agenticai/agenticAI" .
   rmdir "$HOME/scgip-parked-agenticai"
   ```
   (It's git-tracked; the working tree is currently missing it.)
2. **Commit + push** the deploy-kit changes sitting in the working tree: `vercel.json` (services+rewrites final), `.vercelignore`, `.gitignore` (+`.env.deploy-secrets` line), `scripts/vercel-attach-neon.mjs` (one-off — can delete instead).
3. **Real-time caveat on Vercel:** serverless instances can't share the in-memory SSE bus, so `lib/store.tsx` polls every 8s (visible tab only) as a safety net — complaints appear within ~8s on prod (instant on localhost). Already implemented.
4. **AI chat on prod** answers via built-in rule-based fallback (FastAPI not deployed). To restore full agent AI later: deploy `agenticAI/` to Hugging Face Spaces free tier, then set `FASTAPI_URL` env var in Vercel.
5. **Clean URL (user request):** try `npx vercel alias set <deployment-url> scgip` → if `scgip.vercel.app` is free it becomes the short URL (it 404'd earlier = possibly unclaimed). If taken, pick e.g. `scgip-app`.
6. Optional: connect Git in Vercel dashboard for auto-deploys on push (currently deploys are CLI-driven).

---

## 5. POST-FIX VERIFICATION CHECKLIST

```bash
URL=https://sanitation-co-governance-platform-ntt71eypz.vercel.app
# 1. No SSO wall (must be 200, not 302):
curl -s -o /dev/null -w "%{http_code}\n" $URL/login
# 2. Security headers present:
curl -sI $URL/login | grep -iE "x-frame-options|content-security-policy|x-content-type-options"
# 3. Admin login roundtrip (password from .env.deploy-secrets):
#    POST $URL/api/auth/login {"email":"litheshs2007@gmail.com","password":"<ADMIN_PASSWORD>"}
# 4. Complaint flow: POST $URL/api/complaints (with session cookie) → GET → verify it appears
# 5. Page load < 3s: curl -s -o /dev/null -w "%{time_total}s\n" $URL/login
```

---

## 6. OTHER STUFF (don't lose this)

- **Local dev** (unchanged): `nohup npm run dev -- --port 3000 > "$HOME/.scgip-dev.log" 2>&1 &` — SQLite, instant SSE. Local admin: `litheshs2007@gmail.com` (user's own password). Demo citizen: `citizen@example.com / Citizen@123` (public, documented in README).
- **Localhost security posture:** sole admin locally ✓, seed backdoor accounts deleted ✓, README credentials removed ✓ (pushed), CSP fix for Leaflet tiles pushed ✓.
- **Compact security report** for LinkedIn/PPT: `~/Downloads/SCGIP-Security-Compact.pdf` + `.html` (full ZAP report in `security-reports/`, gitignored).
- **Strix pentest** next step: needs a Groq API key (free) as the LLM provider, then run against the production URL.
- User preference: **never ask for or echo passwords**; secrets live in `.env.deploy-secrets` / Vercel env vars only.
- Vercel Hobby = free forever (non-commercial). Neon free = 0.5GB. No expiry anxiety like Railway's trial.
