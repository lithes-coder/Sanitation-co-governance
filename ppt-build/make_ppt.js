/** Build SCGIP presentation PPTX (16:9) — 1M1B × IBM SkillsBuild structure, v2 with real screenshots. */
const pptxgen = require("pptxgenjs")
const path = require("path")

const D = "C:/Users/lithe/OneDrive/\u753B\u50CF"
const IMGS = {
  analytics: { p: `${D}/WhatsApp Image 2026-09-13 at 9.28.40 PM.jpeg`, ar: 2.059 }, // Analytics page
  map:       { p: `${D}/WhatsApp Image 2026-09-13 at 9.30.19 PM.jpeg`, ar: 2.092 }, // Live ward map
  reports:   { p: `${D}/WhatsApp Image 2026-09-13 at 9.31.07 PM.jpeg`, ar: 2.031 }, // Reports & Export + SERI rankings
  users:     { p: `${D}/WhatsApp Image 2026-09-13 at 9.31.46 PM.jpeg`, ar: 2.059 }, // User Management
  wxgov:     { p: `${D}/WhatsApp Image 2026-09-13 at 9.32.34 PM.jpeg`, ar: 2.063 }, // watsonx AI Governance
  wxnlp:     { p: `${D}/WhatsApp Image 2026-09-13 at 9.33.12 PM.jpeg`, ar: 2.088 }, // watsonx Sentiment
  chat:      { p: `${D}/WhatsApp Image 2026-09-13 at 9.36.06 PM.jpeg`, ar: 2.078 }, // Dashboard + AI chat (SERI answer)
  citizen:   { p: `${D}/WhatsApp Image 2026-09-13 at 9.37.28 PM.jpeg`, ar: 2.046 }, // Citizen dashboard / submit form
  top1:      { p: `${D}/scgip.jpeg`, ar: 2.046 },
  top2:      { p: `${D}/sg-2.jpeg`, ar: 2.078 },
  top3:      { p: `${D}/sg-3.jpeg`, ar: 2.030 },
  top4:      { p: `${D}/WhatsApp Image 2026-09-13 at 9.27.47 PM.jpeg`, ar: 2.057 },
}

// palette
const GREEN_D = "0B3D2E", GREEN = "14532D", EMER = "10B981", AMBER = "F59E0B"
const LIGHT = "F4F7F5", INK = "1F2937", MUT = "5B6B63", WHITE = "FFFFFF"
const TEAL = "0E7490", RUST = "B45036", MINT = "B9D6C9", SAGE = "8FB8A4", PALE = "D9E8DF"
const F = "Calibri"

const pres = new pptxgen()
pres.defineLayout({ name: "W169", width: 13.333, height: 7.5 })
pres.layout = "W169"

const sh = (s, x, y, w, h, color, opts = {}) =>
  s.addShape(opts.round ? pres.ShapeType.roundRect : pres.ShapeType.rect,
    { x, y, w, h, fill: { color }, line: { type: "none" }, rectRadius: opts.round ? 0.08 : undefined })

const T = (s, txt, o) => s.addText(txt, { fontFace: F, ...o })

function header(s, title, kicker) {
  sh(s, 0.55, 0.62, 0.09, 0.62, EMER)
  const runs = kicker
    ? [{ text: kicker.toUpperCase(), options: { fontSize: 11, bold: true, color: EMER, breakLine: true, paraSpaceAfter: 2 } },
       { text: title, options: { fontSize: 26, bold: true, color: GREEN_D } }]
    : [{ text: title, options: { fontSize: 29, bold: true, color: GREEN_D } }]
  T(s, runs, { x: 0.82, y: 0.5, w: 11.9, h: 1.0, valign: "top" })
}

function footer(s, n) {
  T(s, `SCGIP  ·  1M1B × IBM SkillsBuild  ·  ${String(n).padStart(2, "0")}`,
    { x: 9.3, y: 7.05, w: 3.5, h: 0.35, fontSize: 9, color: MUT, align: "right" })
}

function pic(s, img, x, y, w) {
  const h = w / img.ar
  sh(s, x - 0.04, y - 0.04, w + 0.08, h + 0.08, WHITE)
  s.addImage({ path: img.p, x, y, w, h })
  return h
}

function caption(s, x, y, w, text) {
  T(s, text, { x, y, w, h: 0.3, fontSize: 10.5, italic: true, color: MUT, align: "center" })
}

function chip(s, x, y, w, h, text, fill, color, size = 13) {
  s.addText(text, { shape: pres.ShapeType.roundRect, x, y, w, h, fill: { color: fill },
    line: { type: "none" }, rectRadius: 0.08, fontFace: F, fontSize: size, bold: true,
    color, align: "center", valign: "middle" })
}

function bullets(s, x, y, w, h, items, size = 14.5, gap = 10, color = INK, headColor = GREEN) {
  const runs = []
  items.forEach((it) => {
    if (it.includes(":") && it.indexOf(":") < 60) {
      const [head, rest] = [it.slice(0, it.indexOf(":") + 1), it.slice(it.indexOf(":") + 1)]
      runs.push({ text: "▸ " + head, options: { bold: true, color: headColor } })
      runs.push({ text: rest, options: { color, breakLine: true, paraSpaceAfter: gap } })
    } else {
      runs.push({ text: "▸  " + it, options: { color, breakLine: true, paraSpaceAfter: gap } })
    }
  })
  T(s, runs, { x, y, w, h, fontSize: size, valign: "top" })
}

/* ============ SLIDE 1 — TITLE ============ */
let s = pres.addSlide()
s.background = { color: GREEN_D }
sh(s, 0, 0, 13.333, 0.18, EMER)
sh(s, 0, 7.32, 13.333, 0.18, EMER)
T(s, [{ text: "SCGIP", options: { fontSize: 64, bold: true, color: WHITE, breakLine: true } },
      { text: "Sanitation Co-Governance Intelligence Platform", options: { fontSize: 24, bold: true, color: EMER } }],
  { x: 0.9, y: 1.15, w: 11.5, h: 1.9, valign: "top" })
T(s, "An AI-Driven Real-Time Civic Complaint System for Urban Sanitation",
  { x: 0.9, y: 3.2, w: 11.5, h: 0.6, fontSize: 18, color: WHITE })
chip(s, 0.9, 4.05, 4.6, 0.52, "🌍  UN SDG 6 — Clean Water & Sanitation", EMER, GREEN_D, 14)
chip(s, 5.7, 4.05, 3.4, 0.52, "Real-Time · Co-Governed", GREEN, WHITE, 13)
chip(s, 9.3, 4.05, 2.6, 0.52, "Born at B2G Hackathon", GREEN, WHITE, 13)
T(s, [{ text: "Lithesh S  ·  Sri Sairam Institute of Technology, Chennai", options: { fontSize: 17, bold: true, color: WHITE, breakLine: true, paraSpaceAfter: 4 } },
      { text: "1M1B AI for Sustainability Virtual Internship — in collaboration with IBM SkillsBuild & AICTE", options: { fontSize: 13, color: MINT, breakLine: true, paraSpaceAfter: 2 } },
      { text: "September 2026", options: { fontSize: 12, color: SAGE } }],
  { x: 0.9, y: 5.35, w: 11.5, h: 1.6, valign: "top" })

/* ============ SLIDE 2 — PROBLEM ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Reports Go Into a Void", "Problem Statement"); footer(s, 2)
bullets(s, 0.82, 1.75, 6.8, 3.7, [
  "Citizens spot illegal dumping, blocked drains, overflowing garbage — but have no reliable way to report with evidence.",
  "Complaints by phone or in person vanish: no ticket number, no status, no proof anything happened.",
  "The Greater Chennai Corporation cannot prioritise hundreds of scattered reports or verify which are genuine.",
  "Result: recurring sanitation hazards, polluted drains and public spaces — and eroding citizen trust.",
], 15, 12)
s.addText([
  { text: "How might we use AI to score, route and track citizen sanitation reports transparently —", options: { color: WHITE, breakLine: true, paraSpaceAfter: 2 } },
  { text: "so that citizens and the municipal corporation can verify and resolve issues together?", options: { color: EMER } },
], { shape: pres.ShapeType.roundRect, x: 0.82, y: 5.55, w: 11.7, h: 1.25, fill: { color: GREEN_D },
  line: { type: "none" }, rectRadius: 0.1, fontFace: F, fontSize: 15.5, bold: true, align: "center", valign: "middle" })

/* ============ SLIDE 3 — SDG ALIGNMENT ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "SDG Alignment", "Sustainability Focus"); footer(s, 3)
const sdgs = [
  ["SDG 6", "Clean Water & Sanitation", "PRIMARY", EMER,
   "Direct action on blocked drains, illegal dumping and public-space sanitation — protecting water systems and community health."],
  ["SDG 11", "Sustainable Cities & Communities", "SECONDARY", TEAL,
   "Accountable, citizen-inclusive urban governance with measurable response deadlines."],
  ["SDG 16", "Peace, Justice & Strong Institutions", "SECONDARY", AMBER,
   "Transparency and auditability that build trust in civic institutions."],
]
sdgs.forEach(([tag, name, kind, accent, desc], i) => {
  const x = 0.82 + i * 3.98
  sh(s, x, 1.85, 3.75, 4.6, WHITE)
  sh(s, x, 1.85, 3.75, 0.16, accent)
  T(s, [{ text: tag, options: { fontSize: 30, bold: true, color: accent, breakLine: true, paraSpaceAfter: 2 } },
        { text: name, options: { fontSize: 15.5, bold: true, color: GREEN_D, breakLine: true, paraSpaceAfter: 4 } },
        { text: kind, options: { fontSize: 10.5, bold: true, color: MUT, breakLine: true, paraSpaceAfter: 10 } },
        { text: desc, options: { fontSize: 13, color: INK } }],
    { x: x + 0.25, y: 2.15, w: 3.25, h: 4.1, valign: "top" })
})
T(s, "One primary focus — SDG 6 — with direct secondary contributions to SDG 11 and SDG 16.",
  { x: 0.82, y: 6.7, w: 11.7, h: 0.4, fontSize: 13, italic: true, color: MUT, align: "center" })

/* ============ SLIDE 4 — DESIGN THINKING ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "From B2G Hackathon Prototype to Working Platform", "Design Thinking Journey"); footer(s, 4)
const stages = [
  ["EMPATHIZE", "Citizens never see outcomes; officers receive unstructured, unprioritised reports."],
  ["DEFINE", "The real gap is verified closure — nobody confirms the fix, so nobody reports twice."],
  ["IDEATE", "Co-governance: place the citizen inside the workflow as the final verifier."],
  ["PROTOTYPE", "B2G Hackathon prototype → several weeks of iteration into a full real-time platform."],
  ["TEST & REFINE", "End-to-end live pipeline tested across citizen, officer and admin roles."],
]
stages.forEach(([tag, desc], i) => {
  const y = 1.8 + i * 0.98
  chip(s, 0.82, y, 2.35, 0.62, `${i + 1}.  ${tag}`, i % 2 === 0 ? EMER : TEAL, i % 2 === 0 ? GREEN_D : WHITE, 12.5)
  T(s, desc, { x: 3.45, y, w: 9.1, h: 0.62, fontSize: 14, color: INK, valign: "middle" })
})

/* ============ SLIDE 5 — SOLUTION OVERVIEW + CITIZEN SHOT ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "SCGIP — Co-Governance by Design", "Solution Overview"); footer(s, 5)
const steps = [
  "Citizen submits complaint — photo + real-time GPS location",
  "SERI engine scores severity 0–100 (explainable)",
  "Auto-routes to the right department with an SLA deadline (24h–15 days)",
  "GCC ticket auto-generated and pushed to Corporation officers",
  "Officer verifies → assigns → resolves, with photo evidence",
  "Citizen confirms the fix — loop closed by both sides",
]
steps.forEach((txt, i) => {
  const y = 1.8 + i * 0.83
  chip(s, 0.82, y, 0.5, 0.5, String(i + 1), GREEN_D, WHITE, 15)
  T(s, txt, { x: 1.55, y, w: 5.6, h: 0.5, fontSize: 13, color: INK, valign: "middle" })
})
{ const h = pic(s, IMGS.citizen, 7.45, 1.85, 5.35)
  caption(s, 7.45, 1.85 + h + 0.1, 5.35, "Citizen portal — photo + GPS evidence, severity boosters, live tracking") }
T(s, "Three role-based portals: Citizen · Corporation Officer · Administrator",
  { x: 0.82, y: 6.8, w: 6.6, h: 0.4, fontSize: 13, bold: true, color: GREEN })

/* ============ SLIDE 6 — AI ELEMENTS + WATSONX GOVERNANCE ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "AI Elements Used", "Where AI Powers the Platform"); footer(s, 6)
bullets(s, 0.82, 1.7, 6.9, 5.2, [
  "SERI Explainable Severity Engine: complaint type × ward risk index × evidence quality — every score shows \"why this severity\".",
  "Agentic AI Assistant (Python FastAPI): tool-calling agent answering natural-language queries over live complaint data — grounded, never fabricated.",
  "IBM watsonx NLP: real-time sentiment & emotion classification on citizen complaints (urgency detection).",
  "Geospatial Intelligence: GPS pins with reverse geocoding + ward-risk heat mapping on a live map.",
  "Real-time backbone: Server-Sent Events notifications, SLA auto-escalation, tamper-evident audit log.",
], 13.5, 11)
{ const h = pic(s, IMGS.wxgov, 7.95, 1.75, 4.85)
  caption(s, 7.95, 1.75 + h + 0.08, 4.85, "AI governance dashboard — model status, fairness & transparency metrics") }
sh(s, 7.95, 4.85, 4.85, 1.85, WHITE)
sh(s, 7.95, 4.85, 4.85, 0.12, AMBER)
T(s, [{ text: "IBM BOB", options: { fontSize: 15, bold: true, color: GREEN_D, breakLine: true, paraSpaceAfter: 3 } },
      { text: "Used during ideation to refine the problem framing and co-governance workflow. Prompt engineering guided the assistant's query logic.", options: { fontSize: 11.5, color: INK } }],
  { x: 8.15, y: 5.05, w: 4.45, h: 1.55, valign: "top" })

/* ============ SLIDE 7 — AI IN ACTION ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "AI in Action — Assistant & NLP", "Working Prototype"); footer(s, 7)
{ const h = pic(s, IMGS.chat, 0.82, 1.8, 5.85)
  caption(s, 0.82, 1.8 + h + 0.08, 5.85, "The agentic assistant explaining the SERI formula — grounded in live data") }
{ const h = pic(s, IMGS.wxnlp, 6.95, 1.8, 5.85)
  caption(s, 6.95, 1.8 + h + 0.08, 5.85, "watsonx NLP — sentiment, emotion & urgency classification per complaint") }
bullets(s, 0.82, 5.6, 11.7, 1.6, [
  "Grounded answers: the assistant calls tools over the live complaints database — it never fabricates numbers.",
  "Every citizen complaint is classified for sentiment and urgency, feeding priority signals into the SERI engine.",
], 13, 8)

/* ============ SLIDE 8 — LIVE WARD MAP ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Live Ward Map — Geospatial Intelligence", "Real-Time Tracking"); footer(s, 8)
{ const h = pic(s, IMGS.map, 0.82, 1.85, 7.7)
  caption(s, 0.82, 1.85 + h + 0.08, 7.7, "GPS pins colored by priority — updates live as citizens report") }
bullets(s, 8.85, 1.95, 3.9, 5.0, [
  "Real-time GPS: every complaint drops a pin the moment it is submitted.",
  "Priority colors: critical, high, medium, low at a glance.",
  "Reverse geocoding: pins resolve to street addresses automatically.",
  "Ward approximations: non-GPS complaints placed at ward centroids.",
  "Built on Leaflet + OpenStreetMap.",
], 12.5, 10)

/* ============ SLIDE 9 — DATA-DRIVEN GOVERNANCE ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Data-Driven Governance", "Analytics · SERI Rankings · Exports"); footer(s, 9)
{ const h = pic(s, IMGS.analytics, 0.82, 1.85, 5.85)
  caption(s, 0.82, 1.85 + h + 0.08, 5.85, "Complaint analytics — type distribution & monthly trends") }
{ const h = pic(s, IMGS.reports, 6.95, 1.85, 5.85)
  caption(s, 6.95, 1.85 + h + 0.08, 5.85, "Reports & exports — CSV / Excel / PDF with SERI ward rankings") }
bullets(s, 0.82, 5.6, 11.7, 1.6, [
  "Ward SERI rankings surface recurring hotspots and silent zones — enabling proactive, preventive action.",
  "One-click exports generate ward governance reports for corporation review meetings.",
], 13, 8)

/* ============ SLIDE 10 — ARCHITECTURE ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Technology Architecture", "Built With"); footer(s, 10)
const layers = [
  ["FRONTEND", "Next.js · TypeScript · Tailwind CSS · Leaflet + OpenStreetMap (live ward map)", EMER],
  ["REALTIME", "Server-Sent Events (SSE) — instant notifications across all roles · SLA auto-escalation", TEAL],
  ["BACKEND & DATA", "Next.js API routes · Prisma ORM · SQLite · GCC webhook ticket gateway", GREEN],
  ["AI SERVICES", "SERI engine + NLP sentiment · Agentic AI assistant (Python FastAPI) · IBM watsonx governance views", AMBER],
  ["SECURITY", "bcrypt password hashing · cookie-session auth · role-based access · tamper-evident audit log", RUST],
]
layers.forEach(([tag, txt, accent], i) => {
  const y = 1.85 + i * 1.0
  sh(s, 0.82, y, 11.7, 0.86, WHITE)
  sh(s, 0.82, y, 0.14, 0.86, accent)
  T(s, tag, { x: 1.15, y, w: 3.1, h: 0.86, fontSize: 13, bold: true, color: accent, valign: "middle" })
  T(s, txt, { x: 4.3, y, w: 8.0, h: 0.86, fontSize: 13, color: INK, valign: "middle" })
})

/* ============ SLIDE 11 — TARGET USERS + ROLE SCREEN ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Target Users", "Who It Serves"); footer(s, 11)
const users = [
  ["🏙️", "Citizens of Chennai", "Report with photo + GPS, track live, confirm the fix.", EMER],
  ["👮", "GCC Ward Officers", "AI-prioritised queue with SLA deadlines; verify & resolve with evidence.", TEAL],
  ["📊", "City Administrators", "Live ward map, SLA analytics, ward-level intelligence.", AMBER],
]
users.forEach(([emoji, name, desc, accent], i) => {
  const y = 1.9 + i * 1.68
  sh(s, 0.82, y, 4.35, 1.5, WHITE)
  sh(s, 0.82, y, 0.12, 1.5, accent)
  T(s, [{ text: `${emoji}  ${name}`, options: { fontSize: 13.5, bold: true, color: GREEN_D, breakLine: true, paraSpaceAfter: 4 } },
        { text: desc, options: { fontSize: 11.5, color: INK } }],
    { x: 1.1, y: y + 0.14, w: 3.9, h: 1.25, valign: "top" })
})
{ const h = pic(s, IMGS.users, 5.55, 1.95, 7.25)
  caption(s, 5.55, 1.95 + h + 0.08, 7.25, "Role-based portals — admin provisions corporation staff; citizens self-register") }
T(s, "Designed as a replicable blueprint — adoptable by any municipal body.",
  { x: 0.82, y: 7.0, w: 11.7, h: 0.35, fontSize: 12.5, italic: true, color: MUT, align: "center" })

/* ============ SLIDE 12 — IMPACT ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Expected Impact", "What Changes"); footer(s, 12)
bullets(s, 0.82, 1.75, 11.6, 4.5, [
  "Closed complaint loop: every report tracked from submission to citizen-confirmed resolution — no more complaints into a void.",
  "Faster, fairer response: severity-based prioritisation with SLA deadlines and auto-escalation replaces first-come-first-served handling.",
  "Accountability by design: a tamper-evident audit trail makes every action verifiable by citizens and administrators.",
  "Data-driven prevention: ward-level risk analytics reveal recurring hotspots — proactive action instead of reactive cleanup.",
  "Citizen trust: live visibility of the process itself builds trust in civic institutions.",
  "Scalable blueprint: the co-governance model extends to any ward, any city, any municipal body.",
], 15, 13)
s.addText("From \"reported\" to \"resolved and verified\" — accountability as a system feature, not a promise.",
  { shape: pres.ShapeType.roundRect, x: 0.82, y: 6.35, w: 11.7, h: 0.75, fill: { color: GREEN_D },
    line: { type: "none" }, rectRadius: 0.1, fontFace: F, fontSize: 14, bold: true, color: EMER, align: "center", valign: "middle" })

/* ============ SLIDE 13 — RESPONSIBLE AI ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Responsible AI Considerations", "Mandatory — Built Into the Design"); footer(s, 13)
const pillars = [
  ["FAIRNESS", "Severity is normalised against a ward risk index, so wards with historically poorer sanitation are not deprioritised. Every score's factors are visible.", EMER],
  ["TRANSPARENCY", "The SERI engine is explainable — \"why this severity\" on every complaint. The AI assistant is grounded strictly in live database records; it never fabricates data.", TEAL],
  ["ETHICS", "AI only prioritises and informs. Humans verify, resolve and confirm at every decision point — no algorithmic penalties for citizens or officers.", AMBER],
  ["PRIVACY", "No personal data exposed publicly; complaint evidence is role-restricted; the audit log records actions, not personal profiles.", RUST],
]
pillars.forEach(([tag, desc, accent], i) => {
  const x = i % 2 === 0 ? 0.82 : 6.9, y = i < 2 ? 1.85 : 4.35
  sh(s, x, y, 5.6, 2.3, WHITE)
  sh(s, x, y, 5.6, 0.13, accent)
  T(s, [{ text: tag, options: { fontSize: 15, bold: true, color: accent, breakLine: true, paraSpaceAfter: 6 } },
        { text: desc, options: { fontSize: 12.5, color: INK } }],
    { x: x + 0.25, y: y + 0.28, w: 5.1, h: 1.9, valign: "top" })
})

/* ============ SLIDE 14 — SKILLSBUILD JOURNEY ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Internship → Project: What I Applied", "IBM SkillsBuild Journey"); footer(s, 14)
const rows = [
  ["IBM BOB", "Ideation & problem framing — refined the co-governance workflow before writing code.", EMER],
  ["Agentic AI Lab (Aug 2026)", "Tool usage, function calling, autonomous workflows — applied directly: our Python agent calls tools over the live complaints database.", TEAL],
  ["Guided Learning Path (GLE)", "AI fundamentals + responsible AI principles on IBM SkillsBuild — shaping the explainability and audit features.", GREEN],
  ["Mindset shift", "From \"calling models with prompts\" to building grounded, tool-using agents over real data.", AMBER],
]
rows.forEach(([tag, desc, accent], i) => {
  const y = 1.9 + i * 1.22
  sh(s, 0.82, y, 11.7, 1.05, WHITE)
  sh(s, 0.82, y, 0.14, 1.05, accent)
  T(s, tag, { x: 1.15, y, w: 3.4, h: 1.05, fontSize: 14, bold: true, color: accent, valign: "middle" })
  T(s, desc, { x: 4.75, y, w: 7.5, h: 1.05, fontSize: 12.5, color: INK, valign: "middle" })
})

/* ============ SLIDE 15 — PLATFORM GALLERY ============ */
s = pres.addSlide(); s.background = { color: LIGHT }
header(s, "Platform Gallery", "More Views From the Working System"); footer(s, 15)
const gallery = [IMGS.top1, IMGS.top2, IMGS.top3, IMGS.top4]
gallery.forEach((img, i) => {
  const x = i % 2 === 0 ? 0.82 : 6.75, y = i < 2 ? 1.75 : 4.7
  const h = pic(s, img, x, y, 5.75)
})
T(s, "Additional portal views — citizen, officer and administration sides of the platform.",
  { x: 0.82, y: 7.28, w: 11.7, h: 0.3, fontSize: 11.5, italic: true, color: MUT, align: "center" })

/* ============ SLIDE 16 — CONCLUSION ============ */
s = pres.addSlide()
s.background = { color: GREEN_D }
sh(s, 0, 0, 13.333, 0.18, EMER)
T(s, [{ text: "Every complaint has a story, a status,", options: { color: WHITE, breakLine: true, paraSpaceAfter: 2 } },
      { text: "and a closing signature from the citizen.", options: { color: EMER } }],
  { x: 0.9, y: 1.0, w: 11.5, h: 1.7, fontSize: 30, bold: true, valign: "top" })
bullets(s, 0.9, 3.0, 11.5, 2.2, [
  "Roadmap: citizen-officer comment threads · before/after photo galleries · multi-city rollout · GCC field pilot.",
  "Full source code published openly on GitHub.",
], 15.5, 12, PALE, EMER)
chip(s, 0.9, 5.35, 5.4, 0.6, "GitHub: github.com/lithes-coder/Sanitation-co-governance", EMER, GREEN_D, 12.5)
T(s, "Thank you — Questions?  ·  Lithesh S · Sri Sairam Institute of Technology",
  { x: 0.9, y: 6.35, w: 11.5, h: 0.5, fontSize: 16, bold: true, color: WHITE })

const OUT = path.join(__dirname, "..", "SCGIP-Presentation.pptx")
pres.writeFile({ fileName: OUT }).then(() => console.log("Saved:", OUT))
