import { createHash } from "crypto"
import { db } from "./db"

/**
 * Tamper-evident audit trail: each row's hash covers its content plus the
 * previous row's hash, so any retroactive edit breaks the chain.
 */
export async function appendAudit(entry: {
  actor: string
  action: string
  entity: string
  entityId?: string | null
  details?: Record<string, unknown>
}) {
  const last = await db.auditLog.findFirst({ orderBy: { createdAt: "desc" } })
  const prevHash = last?.hash ?? null

  const detailsJson = JSON.stringify(entry.details ?? {})
  const hash = createHash("sha256")
    .update(`${prevHash ?? ""}|${entry.actor}|${entry.action}|${entry.entity}|${entry.entityId ?? ""}|${detailsJson}`)
    .digest("hex")

  await db.auditLog.create({
    data: {
      actor: entry.actor,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      details: detailsJson,
      prevHash,
      hash,
    },
  })
}
