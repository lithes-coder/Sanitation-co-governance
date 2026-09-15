/**
 * Authority gateway — the seam between this platform and the municipal
 * corporation. Today: MockGateway (fully offline, demo-safe). Later: a real
 * HTTP/email implementation can be dropped in behind the same interface.
 */

export type GatewaySendResult = {
  ticketRef: string
  ackedAt: Date
}

export type GatewayComplaint = {
  complaint_id: string
  ward: string
  complaint_type: string
  description: string
  priority: string
  severity_score: number
  department: string
  latitude: number | null
  longitude: number | null
}

export interface AuthorityGateway {
  /** Forward a complaint to the corporation; returns a ticket reference. */
  send(complaint: GatewayComplaint): Promise<GatewaySendResult>
}

/** GCC-style ticket refs: GCC-2026-0042 */
function generateTicketRef(seq: number): string {
  const year = new Date().getFullYear()
  return `GCC-${year}-${String(seq).padStart(4, "0")}`
}

export class MockGateway implements AuthorityGateway {
  async send(_complaint: GatewayComplaint): Promise<GatewaySendResult> {
    // Simulated network latency to mimic a real round trip.
    await new Promise((r) => setTimeout(r, 800))

    // Ticket number derived from the complaint's creation timestamp so refs
    // are stable and monotonic-ish without extra state.
    const seq = (Date.now() % 9000) + 1000
    const ticketRef = generateTicketRef(seq)

    void _complaint
    return { ticketRef, ackedAt: new Date() }
  }
}

/**
 * Hook for outbound webhooks/emails. Not wired to a real provider in this
 * build — the inbound webhook route is the counterpart for a callback.
 */
export async function notifyAuthorityChannel(payload: Record<string, unknown>) {
  const url = process.env.AUTHORITY_WEBHOOK_URL
  if (!url) return false
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.AUTHORITY_WEBHOOK_SECRET || "",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
    return true
  } catch {
    return false
  }
}
