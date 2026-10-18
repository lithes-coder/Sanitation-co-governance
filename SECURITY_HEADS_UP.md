# Heads-up — secret hygiene

## Gemini API key exposure (past session)

During an earlier session, a Gemini API key appeared in terminal output. There is no evidence it was written to any project file or committed, but out of caution:

- **Assume it may be noisy in shell history on the machine where it ran.** If that machine is yours and you still have the key, rotate it now in Google AI Studio / the provider console.
- If you set it anywhere for SCGIP (e.g. an env file, Vercel secret, or a sidecar `.env`), remove it from any non-secret-backed location and re-add it only through the proper secret mechanism (Vercel Secrets / environment-variable UI), never in chat or in a committed file.

## Current session hygiene

- No API keys were written to any project file during the security work in this session.
- The only secrets touched were existing environment-backed values read at runtime (e.g. `AUTH_SECRET`, `AUTHORITY_WEBHOOK_SECRET`, `DATABASE_URL`, `FASTAPI_URL`) — none of which were echoed in full into any new file.

## Admin credential handling

- The production admin account is `litheshs2007@gmail.com`.
- Do **not** paste the admin password into chat, files, commits, or screenshots. If you need it for a local debug session, read it from the gitignored deploy-secrets file at runtime only, and clear the terminal history entry afterward if your shell exposes it.
- The demo citizen `citizen@example.com` exists with a password that is public in the repo. That is fine for demos; delete or reset it on any serious deployment.

## If you add a real LLM / AI sidecar later

- Keep API keys out of `.env.local`, commits, and chat.
- Prefer Vercel Secrets (or your host's secret store) for any provider key.
- If a key ever appears in a log or terminal again, treat it as compromised and rotate it.
