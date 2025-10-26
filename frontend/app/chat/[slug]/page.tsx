"use client"

import type React from "react"

import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { getCountryData } from "@/lib/country-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  return <ChatPageClient slug={slug} />
}

function ChatPageClient({ slug }: { slug: string }) {
  const router = useRouter()
  const countryData = getCountryData(slug)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (countryData) {
      // Initial greeting message
      const greeting: Message = {
        id: "1",
        role: "assistant",
        content: `Hello! I'm a local from ${countryData.name}. I'm excited to share my culture, language, and daily life with you. Feel free to ask me anything about living here!`,
        timestamp: new Date(),
      }
      setMessages([greeting])
    }
  }, [countryData])

  if (!countryData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Country not found</h1>
          <Button onClick={() => router.push("/")}>Return to Map</Button>
        </div>
      </div>
    )
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `That's a great question! In ${countryData.name}, we have a unique perspective on that. Let me share my experience...`,
        `I'm glad you asked! Here in ${countryData.name}, things work a bit differently. From my daily life, I can tell you...`,
        `Interesting! In our culture, we approach this in a special way. Let me explain how we do things here...`,
        `That reminds me of something we often do in ${countryData.name}. It's quite fascinating actually...`,
        `Great topic! As someone who grew up here, I can share some insights about how we handle this in ${countryData.name}...`,
      ]

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push(`/country/${slug}`)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{countryData.flag}</span>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Chat with a local from {countryData.name}</h1>
                  <p className="text-sm text-muted-foreground">Practicing {countryData.language}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="leading-relaxed">{message.content}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input area */}
      <footer className="border-t bg-card">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask about life in ${countryData.name}...`}
              className="flex-1"
              disabled={isTyping}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            This is a simulated conversation for cultural learning purposes
          </p>
        </div>
      </footer>
    </div>
  )
}
