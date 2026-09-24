// One-off: attach existing Neon store to project via Vercel API (avoids dashboard)
import fs from "fs"
import os from "os"
import path from "path"

const authPath = path.join(os.homedir(), "AppData", "Roaming", "com.vercel.cli", "Data", "auth.json")
const token = JSON.parse(fs.readFileSync(authPath, "utf8")).token
const teamSlug = "litheshs2007-4521s-projects"
const projectName = "sanitation-co-governance-platform"
const STORE_ID = "store_rsR06zZXZeJ8THYC"

const api = async (url, init = {}) => {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, ok: res.ok, json, text }
}

// 1. resolve project id
const proj = await api(`https://api.vercel.com/v9/projects/${projectName}?slug=${teamSlug}`)
if (!proj.ok) { console.error("project lookup failed:", proj.status, proj.text.slice(0, 300)); process.exit(1) }
const projectId = proj.json.id
console.log("project:", proj.json.name, projectId)

// 2. attach store -> project
const attach = await api(`https://api.vercel.com/v1/storage/stores/${STORE_ID}/connections?slug=${teamSlug}`, {
  method: "POST",
  body: JSON.stringify({
    projectId,
    environments: ["production"],
    // no prefix -> variables keep their canonical names (DATABASE_URL etc.)
  }),
})
console.log("attach:", attach.status)
if (!attach.ok) console.log(attach.text.slice(0, 600))

// 3. verify env vars arrived
const envs = await api(`https://api.vercel.com/v9/projects/${projectId}/env?slug=${teamSlug}`)
if (envs.ok) {
  for (const e of envs.json.envs ?? []) console.log("env:", e.key, e.target?.join(","))
} else {
  console.log(envs.text.slice(0, 300))
}
