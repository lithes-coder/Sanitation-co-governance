# 1M1B AI for Sustainability — Project Submission Pack (SCGIP)

Deadline: 21 September 2026 · Form: https://forms.gle/2tBrkVWDETHzVg1G7
Fill top-to-bottom in form order. Items marked ⚠️ only you can provide.

---

## 1. Full Name
Lithesh S

## 2. Email ID
sit24it053@sairamtap.edu.in

## 3. College Name (exactly as per records)
Sri Sairam Institute of Technology

## 4. City
Chennai

## 5. State
Tamil Nadu

## 6. GLE Completion Certificate ⚠️
Download from IBM SkillsBuild (guide link was in the internship doc). Upload PDF/image ≤10MB.

## 7. Title of the Project
SCGIP – Sanitation Co-Governance Intelligence Platform: An AI-Driven Real-Time Civic Complaint System for Urban Sanitation (SDG 6)

## 8. SDGs Aligned (check all)
- ✅ SDG 6: Clean Water and Sanitation (PRIMARY)
- ✅ SDG 11: Sustainable Cities and Communities
- ✅ SDG 16: Peace, Justice and Strong Institutions

## 9. Technologies Used
Agentic AI (tool-calling agent over live data), Prompt Engineering, IBM BOB (used during ideation to refine the problem framing and co-governance workflow), NLP-based sentiment analysis, Explainable AI scoring engine (rule-based, transparent weights), Geospatial intelligence (GPS + reverse geocoding + ward risk mapping), Next.js, TypeScript, Prisma, Server-Sent Events (real-time), Leaflet + OpenStreetMap, Python FastAPI, SQLite

## 10. Problem Statement (75–150 words) — 128 words ✅

In Chennai, citizens who spot illegal dumping, blocked drains or overflowing garbage have no reliable way to report issues or track what happens next. Complaints made by phone or in person disappear into a void — no tracking number, no status updates, no proof of resolution. The Greater Chennai Corporation, in turn, struggles to prioritise hundreds of scattered reports, verify which are genuine, and hold departments to response deadlines. The result is recurring sanitation hazards, polluted drains and public spaces, and eroding citizen trust in civic systems — directly undermining SDG 6 (Clean Water and Sanitation) and SDG 11 (Sustainable Cities). How might we use AI to score, route and track citizen sanitation reports transparently so that citizens and the municipal corporation can verify and resolve issues together, making urban sanitation governance more accountable and sustainable?

## 11. Describe your solution including AI elements used

SCGIP is a real-time web platform with three role-based portals (Citizen, Corporation Officer, Administrator) that closes the loop on sanitation complaints through co-governance — citizens and the Greater Chennai Corporation resolving issues together.

**The pipeline:** A citizen submits a complaint with a photo and real-time GPS location. The AI **SERI engine** (Sanitation Environmental Risk Index) computes an explainable severity score (0–100) from complaint type × ward risk index × evidence quality, and auto-routes the complaint to the correct department with a strict SLA deadline (24h–15 days based on severity). A corporation ticket is auto-generated and pushed to GCC officers through a webhook gateway. Officers verify → assign → resolve, uploading photo evidence at each step, and finally the **citizen confirms the fix** — closing the loop with both parties accountable.

**AI elements:**
- **Agentic AI assistant** (Python FastAPI): a tool-calling agent that answers natural-language queries over live complaint data ("How many high-severity complaints are open in Ward 8?"), grounded in the real database — no hallucinated numbers.
- **SERI severity engine:** explainable, rule-weighted scoring — every score shows "why this severity", ensuring AI transparency.
- **NLP sentiment analysis** on complaint descriptions to detect urgency signals.
- **Geospatial AI:** GPS pins with reverse geocoding and a ward-risk-index heat view on a live map.
- **IBM BOB** was used during ideation to refine the problem framing and co-governance workflow design.

**Real-time infrastructure:** Server-Sent Events push instant notifications to every role; SLA breaches auto-escalate; a tamper-evident audit log records every state transition for accountability.

## 12. Target Users
1. **Citizens of Chennai** — report issues with photo + GPS evidence and confirm resolutions.
2. **GCC ward officers / sanitation inspectors** — receive AI-prioritised queues, verify and resolve with evidence.
3. **City administrators** — live ward map, SLA-compliance analytics, and ward-level sanitation intelligence for data-driven decisions.

## 13. Anticipated / Actual Impact
- **Closes the complaint loop:** every report is tracked from submission to citizen-confirmed resolution — no more complaints into a void.
- **Faster, fairer response:** severity-based prioritisation with SLA deadlines and auto-escalation replaces first-come-first-served handling.
- **Accountability by design:** tamper-evident audit trail makes every action verifiable for citizens and administrators.
- **Data-driven governance:** ward-level risk analytics reveal recurring hotspots, enabling preventive action rather than reactive cleanup.
- **Citizen trust:** live visibility of the process itself builds trust in civic institutions.
- **Scalable blueprint:** the co-governance model can be adopted by any municipal body.

## 14. Links
- **GitHub (full source code):** https://github.com/lithes-coder/Sanitation-co-governance
- **Demo video:** ⚠️ record a short clip — citizen submits in one window → pin drops live on the admin ward map → SERI score + GCC ticket generated → officer resolves → citizen confirms (2–3 min screen recording; upload to Drive, paste link here)
- **Presentation PPT:** ⚠️ add your Drive share link after Sept 21

## 15. Screenshots upload (1 file ≤10MB) ⚠️
Take these 6 screenshots and I'll merge them into one PDF for you:
1. Live ward map with an open pin popup (photo + address + GCC ticket visible)
2. Citizen complaint submission form (photo attached + GPS captured)
3. Complaint detail page (SERI score, "why this severity", timeline)
4. Officer inbox with SLA badges
5. Citizen track dialog with Confirm-fix button
6. Admin dashboard (KPI cards + SERI ward monitoring)

## 16. Additional Information (idea origin, ground research, Responsible AI)

**How the idea was born:** The concept was first prototyped at a **B2G (Business-to-Government) Hackathon**, where our team observed that Chennai's civic complaint systems fail not from lack of reports, but from lack of *verified closure* — nobody confirms the fix. SCGIP is the full iteration of that idea, rebuilt over several weeks into a working real-time platform.

**Ground research:** We studied how complaints actually flow today — calls to the corporation helpline, ward offices receiving unstructured reports, and no feedback channel to the citizen. The "co-governance" insight came directly from this: citizens stop reporting when they never see outcomes, so the citizen is placed *inside* the workflow as the final verifier.

**Responsible AI Considerations (mandatory per guidelines):**
- **Fairness:** The SERI engine normalises severity against a ward risk index, so wards with historically poorer sanitation are not systematically deprioritised; every score's factors are visible.
- **Transparency:** The severity engine is explainable — each score displays "why this severity" with its contributing factors. The AI assistant is grounded strictly in live database records, never fabricating data.
- **Ethics:** The platform never penalises citizens or officers algorithmically; AI only prioritises and informs — humans verify, resolve and confirm at every decision point.
- **Privacy:** No personal data is exposed publicly; complaint evidence is accessible only to authorised roles; the audit log records actions, not personal profiles.

## 17. Session / mentor interaction with biggest impact — and why

The **Agentic AI hands-on lab (August 2026)** had the biggest impact on my learning journey. Before that session, AI to me meant calling models with prompts. The lab — building autonomous agents with tool usage and function calling — completely changed that: I learned that an agent's real power is *grounded action* — reasoning over live data and calling tools, instead of guessing. I applied this directly in my project: the SCGIP AI assistant is a FastAPI agentic service with a tool-calling layer over the live complaints database, so it answers questions from real platform data rather than generating plausible-sounding but ungrounded responses. The session's emphasis on responsible agent design also shaped the audit-trail and explainability features of my platform.

## 18. How has IBM SkillsBuild impacted you?

IBM SkillsBuild gave me structure and direction. The Guided Learning Path built my fundamentals across AI concepts, and the agentic AI lab translated theory into a skill I used in production code within weeks. Using IBM BOB during ideation taught me to treat AI as a thinking partner for problem framing, not just code generation. Exposure to enterprise-grade topics (responsible AI, quantum computing fundamentals) widened my view of where technology is heading. Most importantly, the program shifted my mindset from "building apps" to "solving verified real problems responsibly" — which is exactly how I approached my SDG 6 project, and how I want to build my career in AI engineering.

## 19. Life reflection — biggest challenge ⚠️ (personal — polish these bullets into your own words)
Draft angle (edit to your truth):
- Balancing academics (CGPA 8.57) with self-learning beyond the syllabus.
- Overcame it by time-blocking and building real projects instead of only consuming tutorials — each project (hackathon → platform) compounded confidence.
- Biggest lesson: consistency in small daily efforts beats bursts of motivation.

## 20. Moments / achievements you're most proud of
- Turning a B2G Hackathon prototype into a **fully working real-time platform** over several weeks of self-driven iteration.
- The moment a citizen complaint submitted in one browser appeared **live on the administrator's ward map** in another — the whole pipeline working end-to-end.
- Presenting SCGIP at my college on **21 September** and publishing the complete source openly on GitHub.
- Maintaining a strong CGPA while building real projects, internships and hackathon work in parallel.

## 21. Patent Support
Leave unchecked (decided: skip).

## 22. Consent to feature project
Yes — and ⚠️ upload a good photo of yourself (image ≤10MB).

---

### Before you hit Submit — checklist
- [ ] GLE certificate downloaded and uploaded (mandatory for certificate!)
- [ ] Demo video recorded + Drive link pasted in field 14
- [ ] Screenshots merged into one PDF (send them to me, I'll merge)
- [ ] Field 19 rewritten in your own words
- [ ] Photo uploaded for the consent section
- [ ] Submitted well before Sept 21 (also your presentation day — don't cut it close)
