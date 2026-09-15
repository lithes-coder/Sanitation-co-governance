/**
 * Reverse geocoding via OpenStreetMap Nominatim (free, no API key).
 * - Global cache so repeated popups never re-fetch.
 * - Serialized queue with ~1.1s spacing to respect the 1 req/s usage policy.
 * - Falls back to null (UI shows coordinates) on any failure.
 */

const cache = new Map<string, string | null>()
let chain: Promise<unknown> = Promise.resolve()

function extractPlace(json: {
  address?: Record<string, string>
  display_name?: string
}): string | null {
  const a = json.address
  if (a) {
    const parts = [
      a.road,
      a.suburb || a.neighbourhood || a.village,
      a.city || a.town || a.county,
    ].filter(Boolean)
    if (parts.length > 0) return parts.slice(0, 3).join(", ")
  }
  if (json.display_name) {
    return json.display_name.split(",").slice(0, 3).join(",").trim()
  }
  return null
}

export function getCachedPlace(lat: number, lng: number): string | null {
  return cache.get(`${lat.toFixed(5)},${lng.toFixed(5)}`) ?? null
}

export function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null)

  const job = chain
    .then(
      () =>
        new Promise<string | null>((resolve) => {
          setTimeout(async () => {
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
                { headers: { "User-Agent": "SCGIP/1.0 (sanitation co-governance platform)" }, signal: AbortSignal.timeout(6000) }
              )
              if (!res.ok) return resolve(null)
              const json = await res.json()
              const place = extractPlace(json)
              cache.set(key, place)
              resolve(place)
            } catch {
              cache.set(key, null)
              resolve(null)
            }
          }, 1100)
        })
    )
    .catch(() => null)

  chain = job.catch(() => {})
  return job as Promise<string | null>
}
