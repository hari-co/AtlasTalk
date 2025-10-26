"use client"

import type React from "react"

import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useSelection } from "@/context/selection-context"
import { getCountryData } from "@/lib/country-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, MapPin, Users, BookOpen, Lightbulb, CheckCircle2, Circle, Target } from "lucide-react"

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
  const { selectedAgent, selectedScenario, selectedCountry, selectedLanguage } = useSelection()
  const countryData = getCountryData(slug)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isListening, setIsListening] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [goals, setGoals] = useState([
    { id: 1, text: "Practice basic greetings", completed: false },
    { id: 2, text: "Learn about local customs", completed: false },
    { id: 3, text: "Ask about transportation", completed: false },
  ])
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Conversation IDs from backend agent setup
  const [geminiConversationID, setGeminiConversationID] = useState<string | null>(null)
  const [doConversationID, setDoConversationID] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Initialize backend conversations for this country/language
  useEffect(() => {
    let cancelled = false
    const setupAgent = async () => {
      if (!countryData) return
      try {
        const agentToUse = selectedAgent || 'TAXI'
        // Resolve country and language from context with safe fallbacks
        const ctxCountryName = selectedCountry ? (getCountryData(selectedCountry)?.name || selectedCountry) : null
        const countryToUse = ctxCountryName || countryData.name
        const languageToUse = selectedLanguage || countryData.language
        let res = await fetch(`http://localhost:8000/agents/${agentToUse}/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            country: countryToUse,
            language: languageToUse,
            // Pass situation text as scenario prompt if available
            scenario_prompt: selectedScenario || undefined,
            // user_id: optional – add if you have auth context
          }),
        })
        // Fallback: if selected agent isn’t available yet, retry with TAXI
        if (!res.ok && agentToUse !== 'TAXI' && (res.status === 400 || res.status === 404)) {
          console.warn(`Agent ${agentToUse} not available, falling back to TAXI`)
          res = await fetch(`http://localhost:8000/agents/TAXI/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              country: countryToUse,
              language: languageToUse,
              scenario_prompt: selectedScenario || undefined,
              requested_agent: agentToUse,
            }),
          })
        }
        if (!res.ok) {
          console.error('Agent setup failed', res.status, await res.text())
          return
        }
        const data: { conversation_id: string; agent: string; gemini_conversation_id?: string | null } = await res.json()
        if (cancelled) return
        setDoConversationID(data.conversation_id)
        if (data.gemini_conversation_id) setGeminiConversationID(data.gemini_conversation_id)
        // Debug log
        console.info('Agent setup complete:', { ...data, agentRequested: agentToUse, scenarioProvided: !!selectedScenario, countryUsed: countryToUse, languageUsed: languageToUse })
      } catch (err) {
        if (!cancelled) {
          console.error('Error calling agent setup:', err)
        }
      }
    }
    setupAgent()
    return () => { cancelled = true }
  }, [countryData, selectedAgent, selectedScenario, selectedCountry, selectedLanguage])
  
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

  const analyzeAudio = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Calculate average volume with moderate boost
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const boostedLevel = Math.min((average / 128) * 1.5, 1) // Moderate amplification
    
    setAudioLevel(boostedLevel)
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }

  const handleRecordingToggle = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        
        // Set up audio analysis
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        
        // Start analyzing audio
        analyzeAudio()
        
        audioChunksRef.current = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop())
          
          // Clean up audio analysis
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }
          if (audioContextRef.current) {
            audioContextRef.current.close()
          }
          setAudioLevel(0)
          
          // Send audio to backend for speech-to-text
          try {
            setIsTyping(true)
            
            const formData = new FormData()
            formData.append('audio_file', audioBlob, 'recording.webm')
            
            const response = await fetch('http://localhost:8000/audio/stt', {
              method: 'POST',
              body: formData
            })
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            const transcription = data.transcription
            
            // Add user message with transcription
            const userMessage: Message = {
              id: Date.now().toString(),
              role: "user",
              content: transcription,
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, userMessage])
            
            // Simulate AI response
            setTimeout(() => {
              const responses = [
                `That's a great question! In ${countryData.name}, we have a unique perspective on that. Let me share my experience...`,
                `I'm glad you asked! Here in ${countryData.name}, things work a bit differently. From my daily life, I can tell you...`,
                `Interesting! In our culture, we approach this in a special way. Let me explain how we do things here...`,
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
            
          } catch (error) {
            console.error('Error transcribing audio:', error)
            setIsTyping(false)
            
            // Show error message
            const errorMessage: Message = {
              id: Date.now().toString(),
              role: "assistant",
              content: "Sorry, I couldn't transcribe your audio. Please try again.",
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
          }
        }
        
        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
        setIsRecording(true)
        setIsListening(true)
        
      } catch (error) {
        console.error('Error accessing microphone:', error)
        alert('Could not access microphone. Please check permissions.')
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        setIsListening(false)
      }
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Side - Country Information */}
      <div className="w-1/2 border-r bg-card flex flex-col">
        {/* Header */}
        <header className="border-b bg-card flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push(`/country/${slug}`)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{countryData.flag}</span>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{countryData.name}</h1>
                  <p className="text-sm text-muted-foreground">Practicing {countryData.language}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

      {/* Siri-style Audio Visualizer */}
 <main className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
   {/* Centered audio orb - subtle colors with vibration */}
   <div
     className="cursor-pointer relative"
     onClick={handleRecordingToggle}
   >
     {/* Outer glow ring - subtle vibration with audio */}
     <div
       className={`absolute inset-0 w-80 h-80 -translate-x-8 -translate-y-8 rounded-full bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 blur-3xl transition-all duration-100 ${
         isListening ? "scale-150 opacity-100" : "scale-100 opacity-30"
       }`}
       style={{
         opacity: isRecording ? 0.3 + audioLevel * 0.4 : undefined,
       }}
     />
     
     {/* Central glow - subtle vibration with audio */}
     <div
       className={`w-64 h-64 rounded-full bg-primary/25 blur-2xl transition-all duration-100 ${
         isListening ? "scale-150 opacity-100" : "scale-100 opacity-40"
       }`}
       style={{
         opacity: isRecording ? 0.4 + audioLevel * 0.5 : undefined,
       }}
     />
     
     {/* Inner core - subtle vibration with audio */}
     <div
       className={`absolute inset-0 w-64 h-64 rounded-full bg-primary/15 blur-xl transition-all duration-100 ${
         isListening ? "scale-125 opacity-100" : "scale-100 opacity-50"
       }`}
       style={{
         opacity: isRecording ? 0.5 + audioLevel * 0.5 : undefined,
       }}
     />
   </div>

  {/* Instruction text above orb */}
  <div className="absolute top-20 text-center w-full">
    <p className="text-sm text-muted-foreground">
      {isRecording ? "🔴 Recording... Click to stop" : "Click to start recording"}
    </p>
  </div>

  {/* Lightbulb button — fixed bottom-left */}
  <div className="absolute bottom-6 left-6">
    <Button
      variant="ghost"
      size="icon"
      className="h-14 w-14 rounded-full hover:bg-primary/10"
      onClick={(e) => {
        e.stopPropagation()
        setShowHints(!showHints)
      }}
    >
      <Lightbulb
        className={`h-7 w-7 transition-colors ${
          showHints
            ? "text-yellow-500 fill-yellow-500"
            : "text-muted-foreground"
        }`}
      />
    </Button>
  </div>

  {/* Hint card */}
  {showHints && (
    <div className="absolute bottom-6 left-24 animate-in fade-in slide-in-from-left-8 duration-300">
      <div
        className="bg-card border-2 border-primary/20 rounded-xl px-6 py-4 shadow-2xl cursor-pointer hover:bg-accent hover:border-primary/40 transition-all min-w-[280px]"
        onClick={() => {
          setInput("What's the weather like?")
          setShowHints(false)
        }}
      >
        <p className="text-base font-medium">💡 Quick Suggestion</p>
        <p className="text-sm text-muted-foreground mt-1">
          What's the weather like?
        </p>
      </div>
    </div>
  )}
</main>





      </div>

      {/* Right Side - Chat & Goals */}
      <div className="w-1/2 flex flex-col">
        {/* Chat Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Chat with Local</h2>
              <p className="text-sm text-muted-foreground">Ask anything about {countryData.name}</p>
            </div>
          </div>
        </header>

        {/* Goals Panel - Read Only */}
        <div className="border-b bg-card/50 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Learning Goals</h3>
          </div>
          <div className="space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 p-2 rounded-lg"
              >
                {goal.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {goal.text}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground text-center">
            {goals.filter(g => g.completed).length} of {goals.length} completed
          </div>
        </div>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-6">
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
        </main>

      </div>
    </div>
  )
}
