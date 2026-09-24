# SCGIP — Security Scan Summary

**Date:** Sept 22, 2026 (23:45–23:50 IST) · **Target:** http://localhost:3000 (live dev instance) · **Tool:** OWASP ZAP 2.16.0 (spider + full active scan)

## Results

| Severity | Count | Notes |
|---|---|---|
| High | **0** | No SQLi, XSS, broken auth, or injection findings |
| Medium | **0** | All 8 original Mediums fixed (security headers added) |
| Low | ~1 | `X-Powered-By` now hidden (`poweredByHeader: false`); "ZAP is out of date" is about the tool itself, not the app |
| Informational | 36 | Base-line notices (dev-mode scripts, no cookies on public pages, etc.) |

### Remaining accepted trade-offs (dev mode only)
- `CSP: unsafe-inline / unsafe-eval` — required by Next.js dev runtime (hydration + Turbopack HMR). A production build (`npm run build && npm start`) can use nonces/hashes to remove these.

## Fixes applied (`next.config.mjs`)
1. `X-Frame-Options: DENY` — anti-clickjacking
2. `Content-Security-Policy` — default-src 'self', OSM tiles whitelisted for the ward map, `frame-ancestors 'none'`
3. `X-Content-Type-Options: nosniff` — anti-MIME-sniffing
4. `Referrer-Policy: strict-origin-when-cross-origin`
5. `Permissions-Policy: geolocation=(self), camera=(), microphone=()` — matches the app's GPS evidence feature
6. `poweredByHeader: false` — hides the Next.js server fingerprint

## Artifacts
- `security-reports/SCGIP-ZAP-Report.html` — full HTML report (also copied to `C:\Users\lithe\Downloads\`)
- `security-reports/zap-alerts.json` — first scan's raw alerts (pre-fix baseline)
- `security-reports/zap-rescan.json` — post-fix re-scan alerts

## How to re-run the scan later
ZAP daemon (if still running): scan via its API on port 8090 (key: `scgip-scan-2026`).
Fresh start:
```
cd C:\Users\lithe\zap\ZAP\ZAP_2.16.0
java -Xmx1g -jar zap-2.16.0.jar -daemon -host 127.0.0.1 -port 8090 -dir "C:/Users/lithe/zap/zapwork" -config api.disablekey=false -config api.key=scgip-scan-2026
```
Then: start SCGIP (`npm run dev`), spider `http://localhost:3000`, then active-scan. Full HTML report: `GET /OTHER/core/other/htmlreport/?apikey=...`

## Honest scope note
This was an unauthenticated, non-destructive external scan (no login session, no IDOR/access-control probing between roles, no business-logic abuse). The AI-agent pentest (Strix) that would cover authenticated role-abuse paths is set up and ready — it just needs an LLM with usable quota (Gemini free tier was exhausted server-side; Groq's free tier would complete it in ~20–30 min).
