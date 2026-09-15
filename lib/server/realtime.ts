/**
 * Realtime bus: tiny pub/sub shared by API routes within one server process.
 * SSE subscribers listen on "complaints" and "notifications" topics.
 */

export type RealtimeEvent = {
  complaintId?: string
  notificationId?: string
  at: string
}

type Listener = (event: RealtimeEvent) => void

type Bus = {
  listeners: Map<string, Set<Listener>>
}

const globalForBus = globalThis as unknown as { __scgipBus?: Bus }

function getBus(): Bus {
  if (!globalForBus.__scgipBus) {
    globalForBus.__scgipBus = { listeners: new Map() }
  }
  return globalForBus.__scgipBus
}

export function publish(topic: "complaints" | "notifications", event: Omit<RealtimeEvent, "at"> = {}) {
  const bus = getBus()
  const set = bus.listeners.get(topic)
  if (!set || set.size === 0) return
  const payload: RealtimeEvent = { ...event, at: new Date().toISOString() }
  for (const fn of set) {
    try {
      fn(payload)
    } catch {
      // a broken subscriber must not take down the publisher
    }
  }
}

export function subscribe(topic: "complaints" | "notifications", fn: Listener): () => void {
  const bus = getBus()
  let set = bus.listeners.get(topic)
  if (!set) {
    set = new Set()
    bus.listeners.set(topic, set)
  }
  set.add(fn)
  return () => {
    set!.delete(fn)
  }
}
