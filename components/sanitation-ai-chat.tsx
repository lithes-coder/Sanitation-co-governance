"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Bot,
  Send,
  X,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"

type Message = {
  role: "user" | "assistant" | "error"
  content: string
  timestamp?: string
}

type ConnectionStatus = "checking" | "connected" | "disconnected"

const QUICK_REPLIES = [
  "What is this platform?",
  "What are complaint statuses?",
  "How to report a complaint?",
  "What is escalation?",
  "What is SERI?",
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function SanitationAIChat() {
  const { complaints } = useStore()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the Sanitation Co-Governance Assistant. Ask me about complaints, statuses, escalation, verification, or the platform.",
      timestamp: formatTime(new Date()),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connected")
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch("/api/chat", { signal: AbortSignal.timeout(5000) })
        setConnectionStatus(res.ok ? "connected" : "disconnected")
      } catch {
        setConnectionStatus("disconnected")
      }
    }
    setConnectionStatus("connected")
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const sendMessage = useCallback(
    async (text?: string) => {
      const userMessage = text || input.trim()
      if (!userMessage || isLoading) return

      setShowQuickReplies(false)
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage, timestamp: formatTime(new Date()) },
      ])
      setInput("")
      setIsLoading(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            complaints: complaints.slice(0, 50),
          }),
        })
        if (!response.ok) throw new Error("API error")

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No stream")

        const decoder = new TextDecoder()
        let assistantContent = ""
        let buffer = ""
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "", timestamp: formatTime(new Date()) },
        ])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n")
          buffer = parts.pop() || ""
          for (const part of parts) {
            if (!part.startsWith("data: ")) continue
            try {
              const data = JSON.parse(part.slice(6))
              if (data.type === "token" && data.content) {
                assistantContent = data.content
                setMessages((prev) => {
                  const u = [...prev]
                  const m = u[u.length - 1]
                  if (m && m.role === "assistant") m.content = assistantContent
                  return u
                })
              } else if (data.type === "error") {
                setMessages((prev) => {
                  const u = [...prev]
                  const m = u[u.length - 1]
                  if (m && m.role === "assistant") {
                    m.role = "error"
                    m.content = data.content
                  }
                  return u
                })
              } else if (data.type === "done" && !assistantContent) {
                setMessages((prev) => {
                  const u = [...prev]
                  const m = u[u.length - 1]
                  if (m && m.role === "assistant" && !m.content)
                    m.content = "No response generated. Please try again."
                  return u
                })
              }
            } catch {}
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "error",
            content: "Something went wrong. Please try again.",
            timestamp: formatTime(new Date()),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, complaints]
  )

  const connLabel =
    connectionStatus === "connected"
      ? "Online"
      : connectionStatus === "disconnected"
        ? "Offline"
        : "Checking..."

  return (
    <>
      {/* ── Floating Button ──────────────────────────────── */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          size="icon"
          aria-label="Open AI assistant"
        >
          <Bot className="w-6 h-6" />
        </Button>
      )}

      {/* ── Chat Window ──────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-6 left-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col"
          style={{ height: "560px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                    connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sanitation Assistant</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">{connLabel}</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] ${message.role === "user" ? "" : "flex flex-col"}`}>
                  <div
                    className={
                      message.role === "user"
                        ? "rounded-2xl rounded-br-md px-4 py-2.5 text-sm bg-primary text-primary-foreground shadow-sm"
                        : message.role === "error"
                          ? "rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-destructive/10 text-destructive border border-destructive/20"
                          : "rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-secondary text-secondary-foreground shadow-sm"
                    }
                  >
                    {message.role === "error" && (
                      <AlertCircle className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                    )}
                    <span className="whitespace-pre-wrap leading-relaxed">{message.content}</span>
                  </div>
                  {message.timestamp && (
                    <div className={`flex items-center gap-1 mt-1 ${message.role === "user" ? "justify-end" : ""}`}>
                      <Clock className="w-3 h-3 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground/50">{message.timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-secondary text-secondary-foreground flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            {showQuickReplies && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={
                  connectionStatus === "disconnected"
                    ? "Backend offline..."
                    : "Ask about sanitation..."
                }
                disabled={isLoading}
                className="rounded-xl"
              />
              <Button
                onClick={() => sendMessage()}
                size="icon"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="rounded-xl shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {/* AI Badge */}
            <div className="flex items-center justify-center gap-1 mt-2">
              <Sparkles className="w-3 h-3 text-primary/50" />
              <span className="text-[10px] text-muted-foreground/50">
                Powered by AI • Sanitation Co-Governance
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
