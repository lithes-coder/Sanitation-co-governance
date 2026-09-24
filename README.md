# SCGIP — Sanitation Co-Governance Intelligence Platform 🌍

A real-time civic-tech platform where **citizens and the Greater Chennai Corporation resolve sanitation issues together** — aligned with **SDG 6: Clean Water & Sanitation**.

Born at the **B2G Hackathon**, iterated over several weeks into a fully working system.

## The problem

You spot illegal dumping or a blocked drain, you report it… and then? Silence. No updates, no tracking, no proof anything happened. Complaints fall into a black hole — and trust in the process falls with them.

## The solution — co-governance

Every complaint flows through a transparent pipeline where both sides act:

1. 📍 **Citizen submits** — description, photo, real-time GPS location
2. 🧠 **SERI engine** — severity score (0–100) from complaint type × ward risk × evidence, auto-routing to the right department with an SLA (24h – 15 days)
3. 🏛️ **GCC ticket** — auto-generated and pushed to Corporation officers
4. 👮 **Officers act** — verify → assign → resolve, with photo evidence at each step
5. ✅ **Citizen confirms** — the fix is accepted, trust points awarded, complaint closed

All in real time: live ward map with GPS pins, instant SSE notifications, SLA breach auto-escalation, and a tamper-evident hash-chained audit trail. An agentic AI assistant reasons over live complaint data.

## Feature highlights

- **Three roles** — citizen, corporation officer, admin (officers provisioned by admin; citizens self-register)
- **Live ward map** — GPS pins with reverse-geocoded street addresses, ward-center approximations for non-GPS complaints, rich popups
- **SERI monitoring** — per-ward Sanitation Equity & Risk Index with analytics and report exports (CSV / Excel / PDF)
- **User management** — admins create/reset staff accounts
- **Agentic AI** — Python (FastAPI) sanitation assistant with tool access to complaint data

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | Next.js API routes · Prisma ORM · SQLite |
| Realtime | Server-Sent Events (SSE) |
| Maps | Leaflet · OpenStreetMap · Nominatim reverse geocoding |
| AI agent | Python · FastAPI · agentic tool-calling |
| Auth | Cookie sessions · bcrypt password hashing |

## Getting started

```bash
# 1. install dependencies
npm install

# 2. configure environment
cp .env.example .env

# 3. set up the database (migration + seed)
npm run db:migrate
npm run db:seed

# 4. run
npm run dev
```

Open http://localhost:3000

### Demo account (after seeding)

| Role | Email | Password |
|---|---|---|
| Citizen (demo) | `citizen@example.com` | `Citizen@123` |

> Only a demo citizen is seeded. The admin account is **not** in the repo — it is created privately via `scripts/admin-cleanup.ts` with `OWNER_PW`. There is exactly one admin, and its password is not public.

> Demo credentials only — change them for any real deployment.

### AI assistant (optional)

```bash
cd agenticAI
pip install -r requirements.txt
python server.py   # FastAPI on :8000
```

## The flow, end to end

```
Citizen submits ──▶ SERI severity + SLA ──▶ GCC ticket issued
      ▲                                            │
      │                                            ▼
Citizen confirms ◀── resolve w/ evidence ◀── officer verify + assign
      │
      └──▶ closed · trust points · audit-logged
```

## Roadmap

- [ ] Citizen withdraw/edit before verification
- [ ] Officer ↔ citizen comment threads
- [ ] SERI trend history per ward
- [ ] Multi-photo before/after gallery

---

Aligned with **UN SDG 6 — Clean Water & Sanitation** 💧
