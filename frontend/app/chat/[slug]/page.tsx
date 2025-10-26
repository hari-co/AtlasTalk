"use client"

import type React from "react"

import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useSelection } from "@/context/selection-context"
import { getCountryData } from "@/lib/country-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, MapPin, Users, BookOpen, CheckCircle2, Circle, Target } from "lucide-react"

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
  const [goals, setGoals] = useState<Array<{ id: number; text: string; completed: boolean }>>([])
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const aiSpeakingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
        if (data.gemini_conversation_id) {
          setGeminiConversationID(data.gemini_conversation_id)
          // Immediately ask Gemini to generate goals
          try {
            const goalsRes = await fetch(`http://localhost:8000/conversations/${data.gemini_conversation_id}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'user', content: 'gen goals' }),
            })
            if (!goalsRes.ok) {
              console.warn('Gemini goals prime failed', goalsRes.status, await goalsRes.text())
            }
            else {
              // Backend returns { conversation_id, assistant: string }
              const payload = await goalsRes.json()
              const assistant = payload?.assistant
              if (assistant && typeof assistant === 'string') {
                // Parse JSON from assistant text (expected to be pure JSON by system prompt)
                const tryParse = (text: string) => {
                  try { return JSON.parse(text) } catch { return null }
                }
                let parsed = tryParse(assistant)
                if (!parsed) {
                  // Strip code fences or extra formatting, then retry
                  const cleaned = assistant.replace(/```json\n?|```/g, '').trim()
                  parsed = tryParse(cleaned)
                }
                if (parsed && Array.isArray(parsed.goals)) {
                  setGoals(parsed.goals.map((g: any, idx: number) => ({
                    id: idx + 1,
                    text: typeof g?.goal === 'string' ? g.goal : `Goal ${idx + 1}`,
                    completed: !!g?.completed,
                  })))
                } else {
                  console.warn('Unexpected goals format from Gemini:', assistant)
                }
              }
            }
          } catch (e) {
            console.warn('Gemini goals prime error', e)
          }
        }
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
    // setTimeout(() => {
    //   const responses = [
    //     `That's a great question! In ${countryData.name}, we have a unique perspective on that. Let me share my experience...`,
    //     `I'm glad you asked! Here in ${countryData.name}, things work a bit differently. From my daily life, I can tell you...`,
    //     `Interesting! In our culture, we approach this in a special way. Let me explain how we do things here...`,
    //     `That reminds me of something we often do in ${countryData.name}. It's quite fascinating actually...`,
    //     `Great topic! As someone who grew up here, I can share some insights about how we handle this in ${countryData.name}...`,
    //   ]

    //   const assistantMessage: Message = {
    //     id: (Date.now() + 1).toString(),
    //     role: "assistant",
    //     content: responses[Math.floor(Math.random() * responses.length)],
    //     timestamp: new Date(),
    //   }

    //   setMessages((prev) => [...prev, assistantMessage])
    //   setIsTyping(false)
    // }, 1500)
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
    
    // Calculate average volume with same boost as AI (for consistency)
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const normalizedLevel = Math.min((average / 128) * 2, 1) // 2x boost (same sensitivity as AI)
    const boostedLevel = Math.max(normalizedLevel, 0.15) // Minimum baseline visibility
    
    setAudioLevel(boostedLevel)
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }

  // Analyze audio using amplitude-based pulsing
  const startAISpeakingWithAudio = (audioBlob: Blob) => {
    setIsAISpeaking(true)
    setIsListening(true)
    
    try {
      // Create audio context for analyzing the audio
      const audioCtx = new AudioContext()
      
      // Decode the audio blob
      audioBlob.arrayBuffer().then(arrayBuffer => {
        return audioCtx.decodeAudioData(arrayBuffer)
      }).then(audioBuffer => {
        // Get raw audio data for analysis
        const rawData = audioBuffer.getChannelData(0)
        const samples = 70 // Number of samples to analyze
        const blockSize = Math.floor(rawData.length / samples)
        const filteredData = []
        
        // Extract amplitude peaks
        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j])
          }
          filteredData.push(sum / blockSize)
        }
        
        // Normalize the data
        const maxAmplitude = Math.max(...filteredData)
        const normalizedData = filteredData.map(n => n / maxAmplitude)
        
        // Animate based on actual audio waveform
        let currentIndex = 0
        const duration = audioBuffer.duration
        const intervalMs = (duration / samples) * 1000
        
        aiSpeakingIntervalRef.current = setInterval(() => {
          if (currentIndex >= normalizedData.length) {
            return
          }
          
          // Boost the amplitude for visibility
          const boostedLevel = Math.min(normalizedData[currentIndex] * 2.5, 1)
          setAudioLevel(Math.max(boostedLevel, 0.15)) // Minimum baseline
          currentIndex++
        }, intervalMs)
        
      }).catch(err => {
        console.error('Audio decoding error:', err)
        // Fallback to sine wave
        useFallbackPulse()
      })
      
      audioContextRef.current = audioCtx
      
    } catch (err) {
      console.error('Audio analysis error:', err)
      useFallbackPulse()
    }
  }
  
  // Fallback pulse animation
  const useFallbackPulse = () => {
    let time = 0
    aiSpeakingIntervalRef.current = setInterval(() => {
      time += 0.15
      const sineWave = Math.sin(time * 2.5) * 0.35 + 0.5
      const randomNoise = (Math.random() - 0.5) * 0.25
      const level = Math.max(0.15, Math.min(0.85, sineWave + randomNoise))
      setAudioLevel(level)
    }, 60)
  }

  const stopAISpeaking = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Stop fallback interval
    if (aiSpeakingIntervalRef.current) {
      clearInterval(aiSpeakingIntervalRef.current)
      aiSpeakingIntervalRef.current = null
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    analyserRef.current = null
    setIsAISpeaking(false)
    setIsListening(false)
    setAudioLevel(0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAISpeaking()
    }
  }, [])

  const handleRecordingToggle = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        
        // Set up real-time audio analysis for live feedback
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        
        // Start analyzing audio in real-time
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
          
          // Clean up user recording audio analysis (not AI playback)
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          if (audioContextRef.current && !isAISpeaking) {
            audioContextRef.current.close()
            audioContextRef.current = null
          }
          analyserRef.current = null
          setAudioLevel(0)
          setIsListening(false)
          
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
              const errorText = await response.text()
              throw new Error(`STT failed (${response.status}): ${errorText}`)
            }
            
            const data = await response.json()
            const transcription = data.transcription
            
            if (!transcription || transcription.trim() === '') {
              throw new Error('No transcription received from STT service')
            }
            
            // Add user message with transcription
            const userMessage: Message = {
              id: Date.now().toString(),
              role: "user",
              content: transcription,
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, userMessage])
            
            // Send the user's message to Gemini to update goals status FIRST
            let updatedGoals = goals // Keep current goals as fallback
            let allDone = false
            
            try {
              if (geminiConversationID) {
                const gemRes = await fetch(`http://localhost:8000/conversations/${geminiConversationID}/messages`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: 'user', content: transcription }),
                })
                if (gemRes.ok) {
                  const gemPayload = await gemRes.json()
                  const assistant = gemPayload?.assistant
                  if (assistant && typeof assistant === 'string') {
                    const tryParse = (text: string) => { try { return JSON.parse(text) } catch { return null } }
                    let parsed = tryParse(assistant)
                    if (!parsed) {
                      const cleaned = assistant.replace(/```json\n?|```/g, '').trim()
                      parsed = tryParse(cleaned)
                    }
                    if (parsed && Array.isArray(parsed.goals)) {
                      updatedGoals = parsed.goals.map((g: any, idx: number) => ({
                        id: idx + 1,
                        text: typeof g?.goal === 'string' ? g.goal : `Goal ${idx + 1}`,
                        completed: !!g?.completed,
                      }))
                      setGoals(updatedGoals)
                    }
                  }
                } else {
                  console.warn('Gemini message failed', gemRes.status, await gemRes.text())
                }
              }
            } catch (e) {
              console.warn('Gemini message error', e)
            }
            
            // NOW check goals completion with updated state
            allDone = updatedGoals.length > 0 && updatedGoals.every(g => g.completed)

            if (!doConversationID) {
              console.warn('Missing DO conversation id; skipping agent reply')
              setIsTyping(false)
              return
            }

            // Decide whether to end conversation or continue based on UPDATED goals
            let assistantText: string | null = null
            try {
              if (allDone) {
                // End conversation in-character
                const endRes = await fetch(`http://localhost:8000/conversations/${doConversationID}/end`, {
                  method: 'POST',
                })
                if (endRes.ok) {
                  const endPayload = await endRes.json()
                  assistantText = typeof endPayload?.assistant === 'string' ? endPayload.assistant : null
                } else {
                  console.warn('End conversation failed', endRes.status, await endRes.text())
                }
              } else {
                // Continue conversation with user message
                const msgRes = await fetch(`http://localhost:8000/conversations/${doConversationID}/messages`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: 'user', content: transcription }),
                })
                if (msgRes.ok) {
                  const msgPayload = await msgRes.json()
                  assistantText = typeof msgPayload?.assistant === 'string' ? msgPayload.assistant : null
                } else {
                  console.warn('DO agent message failed', msgRes.status, await msgRes.text())
                }
              }
            } catch (e) {
              console.warn('Agent conversation error', e)
            }

            if (assistantText) {
                // Append assistant message
                const assistantMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: assistantText,
                  timestamp: new Date(),
                }
                setMessages((prev) => [...prev, assistantMessage])

                // Request TTS and play audio
                try {
                  const ttsForm = new FormData()
                  ttsForm.append('text', assistantText)
                  const ttsRes = await fetch('http://localhost:8000/audio/tts', { method: 'POST', body: ttsForm })
                  if (ttsRes.ok) {
                    const audioBlobResp = await ttsRes.blob()
                    const audioUrl = URL.createObjectURL(audioBlobResp)
                    const audio = new Audio(audioUrl)
                    
                    // Start analyzing the audio blob for visualization
                    startAISpeakingWithAudio(audioBlobResp)
                    
                    audio.onended = () => {
                      URL.revokeObjectURL(audioUrl)
                      stopAISpeaking()
                    }
                    
                    audio.onerror = () => {
                      console.error('Audio playback error')
                      stopAISpeaking()
                    }
                    
                    // Play the audio
                    audio.play().catch(err => {
                      console.error('Audio play failed:', err)
                      stopAISpeaking()
                    })
                  } else {
                    const errorText = await ttsRes.text()
                    console.warn('TTS request failed', ttsRes.status, errorText)
                  }
                } catch (e) {
                  console.error('TTS error', e)
                  // Continue without audio if TTS fails
                }
              }
            } catch (e) {
              console.error('STT or conversation error:', e)
              // Show user-friendly error message
              const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: "assistant",
                content: "Sorry, I had trouble processing your message. Please try speaking again.",
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, errorMessage])
            } finally {
              // Always clean up UI state
              setIsTyping(false)
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
    {/* Outer glow ring */}
<div
  className={`absolute inset-0 w-80 h-80 -translate-x-8 -translate-y-8 rounded-full bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 blur-3xl transition-all duration-100 ${
    isListening ? "scale-150 opacity-100" : "scale-100 opacity-30"
  }`}
  style={{
    opacity: isRecording || isAISpeaking ? 0.3 + audioLevel * 0.4 : undefined,
  }}
/>

{/* Central glow */}
<div
  className={`w-64 h-64 rounded-full bg-primary/25 blur-2xl transition-all duration-100 ${
    isListening || isAISpeaking ? "scale-150 opacity-100" : "scale-100 opacity-40"
  }`}
  style={{
    opacity: isRecording || isAISpeaking ? 0.4 + audioLevel * 0.5 : undefined,
  }}
/>

{/* Inner core */}
<div
  className={`absolute inset-0 w-64 h-64 rounded-full bg-primary/15 blur-xl transition-all duration-100 ${
    isListening || isAISpeaking ? "scale-125 opacity-100" : "scale-100 opacity-50"
  }`}
  style={{
    opacity: isRecording || isAISpeaking ? 0.5 + audioLevel * 0.5 : undefined,
  }}
/>

   </div>

  {/* Instruction text above orb */}
  <div className="absolute top-20 text-center w-full">
    <p className="text-sm text-muted-foreground">
      {isRecording ? "🔴 Recording... Click to stop" : "Click to start recording"}
    </p>
  </div>

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
