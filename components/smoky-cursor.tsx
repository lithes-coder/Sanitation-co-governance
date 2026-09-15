"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

export function SmokyCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const mouse = useRef({ x: 0, y: 0 })
  const animRef = useRef<number>(0)
  const lastEmit = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY

      // Emit particles on mouse move (throttled, sparse)
      const now = Date.now()
      if (now - lastEmit.current > 50) {
        lastEmit.current = now
        for (let i = 0; i < 2; i++) {
          particles.current.push({
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            size: Math.random() * 8 + 4,
            opacity: Math.random() * 0.25 + 0.15,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 1.2 - 0.3,
            life: 0,
            maxLife: Math.random() * 25 + 15,
          })
        }
      }
    }

    window.addEventListener("mousemove", onMouseMove)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.current = particles.current.filter((p) => {
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.015 // gentle upward drift
        p.vx *= 0.97

        const progress = p.life / p.maxLife
        // Ignite bright, then fade elegantly
        const ignition = progress < 0.15 ? progress / 0.15 : 1
        const fadeout = 1 - Math.pow(progress, 0.7)
        const alpha = p.opacity * ignition * fadeout
        const grow = 1 + progress * 2.5

        if (alpha < 0.002) return false

        // Draw premium smoke wisp
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * grow
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`)
        gradient.addColorStop(0.3, `rgba(220, 225, 255, ${alpha * 0.4})`)
        gradient.addColorStop(0.6, `rgba(200, 210, 240, ${alpha * 0.1})`)
        gradient.addColorStop(1, `rgba(200, 210, 240, 0)`)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * grow, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        return true
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: "screen" }}
    />
  )
}
