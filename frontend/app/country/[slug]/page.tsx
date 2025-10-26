"use client"

import type React from "react"

import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useSelection } from "@/context/selection-context"
import { getCountryData, type ScenarioDetail } from "@/lib/country-data"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Check, Users, Languages, GraduationCap, Briefcase, Coffee, ArrowLeft } from "lucide-react"

type ScenarioType = "culture" | "language" | "education" | "economy" | "daily-life"

// Icon mapping for scenario types
const scenarioIcons = {
  culture: Users,
  language: Languages,
  education: GraduationCap,
  economy: Briefcase,
  "daily-life": Coffee,
}

export default function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <CountryPageClient slug={slug} />
}

function FloatingParticles() {
  // Use deterministic positions to avoid hydration mismatch
  const positions = Array.from({ length: 30 }, (_, i) => ({
    left: ((i * 37 + 13) % 100),
    top: ((i * 47 + 23) % 100),
    x: ((i * 11 % 20) - 10),
    duration: (i % 5) + 5,
    delay: (i % 5)
  }))

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/10"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, pos.x, 0],
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: pos.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: pos.delay,
          }}
        />
      ))}
    </div>
  )
}

function AmbientBlurZones() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/20 blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -right-1/4 bottom-1/4 h-[600px] w-[600px] rounded-full bg-purple-500/20 blur-[120px]"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[100px]"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 4,
        }}
      />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-14 w-14 rounded-2xl bg-white/10" />
          <div className="h-6 w-20 rounded-full bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-1/2 rounded bg-white/10" />
          <div className="h-3 w-1/3 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-5/6 rounded bg-white/10" />
        </div>
      </div>
    </div>
  )
}

function ScrollFadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}

function CountryPageClient({ slug }: { slug: string }) {
  const router = useRouter()
  const { setSelectedScenario: setCtxScenario, setSelectedAgent: setCtxAgent } = useSelection()
  const countryData = getCountryData(slug)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalScenario, setModalScenario] = useState<{ type: ScenarioType; data: ScenarioDetail } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const playClickSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const handleScenarioClick = (type: ScenarioType, data: ScenarioDetail) => {
    playClickSound()
    // Set global context immediately on click
    try {
      // Store situation text as selected scenario
      setCtxScenario(data.situation)
      if (data?.AGENT) setCtxAgent(data.AGENT)
    } catch {}
    // Local UI state
    setSelectedScenario(type)
    setModalScenario({ type, data })
    setModalOpen(true)
  }

  const handleContinue = () => {
    if (!selectedScenario) return
    playClickSound()
    // Save scenario and agent into global context before navigating
    try {
      const scenarioData = countryData?.scenarios[selectedScenario]
      const agent = scenarioData?.AGENT as string | undefined
      // Ensure the situation text is set
      if (scenarioData?.situation) setCtxScenario(scenarioData.situation)
      if (agent) setCtxAgent(agent)
    } catch {}
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(`/chat/${slug}?scenario=${selectedScenario}`)
    }, 800)
  }

  if (!countryData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Country not found</p>
      </div>
    )
  }

  const scenarios = [
    { type: "culture" as ScenarioType, data: countryData.scenarios.culture },
    { type: "language" as ScenarioType, data: countryData.scenarios.language },
    { type: "education" as ScenarioType, data: countryData.scenarios.education },
    { type: "economy" as ScenarioType, data: countryData.scenarios.economy },
    { type: "daily-life" as ScenarioType, data: countryData.scenarios["daily-life"] },
  ]

  return (
    <div className="relative min-h-screen bg-black text-white">
      <FloatingParticles />
      <AmbientBlurZones />

      {/* Go Back button top-left */}
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="pointer-events-none fixed inset-0 z-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{
            backgroundSize: "200% 200%",
          }}
        />
      </div>

      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-50 bg-gradient-radial from-transparent via-blue-500/50 to-black"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 3, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      )}

      {/* Hero Section with Parallax */}
      <motion.div className="relative h-[70vh] overflow-hidden" style={{ y: heroY }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${countryData.heroImage})`,
            filter: "blur(8px) brightness(0.4)",
          }}
        />
        <motion.div
          className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-6 text-7xl"
          >
            {countryData.flag}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="font-serif text-6xl font-bold tracking-tight md:text-8xl"
            style={{
              textShadow: "0 0 40px rgba(255,255,255,0.3)",
            }}
          >
            {countryData.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-4 text-xl text-white/80 md:text-2xl"
          >
            {countryData.language}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
          >
            {countryData.funFact}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-16 pb-32">
        <div className="mx-auto max-w-7xl">
          <ScrollFadeIn>
            <h2 className="mb-4 text-center font-serif text-4xl font-bold md:text-5xl">Choose Your Journey</h2>
            <p className="mb-12 text-center text-lg text-white/70">
              Select a scenario to begin your immersive experience
            </p>
          </ScrollFadeIn>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scenarios.map((scenario, index) => {
                const isSelected = selectedScenario === scenario.type
                const IconComponent = scenarioIcons[scenario.type]

                return (
                  <ScrollFadeIn key={scenario.type} delay={index * 0.1}>
                    <motion.div
                      className={`group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 backdrop-blur-xl transition-all ${
                        isSelected ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-black" : "hover:border-white/20"
                      }`}
                      onClick={() => handleScenarioClick(scenario.type, scenario.data)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 bg-blue-500/10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.6 }}
                        />
                      )}

                      <div className="relative z-10 bg-gradient-to-br from-white/5 to-white/0 p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                            <IconComponent className="h-7 w-7 text-white/90 stroke-[1.5]" />
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500"
                              >
                                <Check className="h-4 w-4" />
                              </motion.div>
                            )}
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                scenario.data.difficulty === "Beginner"
                                  ? "bg-green-500/20 text-green-300"
                                  : scenario.data.difficulty === "Intermediate"
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {scenario.data.difficulty}
                            </span>
                          </div>
                        </div>

                        <h3 className="mb-2 font-serif text-xl font-bold leading-tight">
                          {scenario.data.title}
                        </h3>
                        <p className="mb-3 text-sm font-medium text-white/60">{scenario.data.tagline}</p>
                        <p className="mb-2 text-xs italic text-blue-300/80">{scenario.data.localPhrase}</p>
                        <p className="text-sm leading-relaxed text-white/60">
                          {scenario.data.description}
                        </p>
                      </div>

                      <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                    </motion.div>
                  </ScrollFadeIn>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{countryData.flag}</div>
            <div>
              <p className="text-sm font-medium">{countryData.name}</p>
              <p className="text-xs text-white/60">
                {selectedScenario
                  ? `${scenarios.find((s) => s.type === selectedScenario)?.data.title} selected`
                  : "Select a scenario to continue"}
              </p>
            </div>
          </div>
          {/* <motion.button
            onClick={handleContinue}
            disabled={!selectedScenario}
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3 font-medium transition-all hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={selectedScenario ? { scale: 1.05 } : {}}
            whileTap={selectedScenario ? { scale: 0.95 } : {}}
          >
            Continue to Chat
          </motion.button> */}
        </div>
      </div>

      {modalOpen && modalScenario && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                  {(() => {
                    const ModalIcon = scenarioIcons[modalScenario.type]
                    return <ModalIcon className="h-8 w-8 text-white/90 stroke-[1.5]" />
                  })()}
                </div>
                <div>
                  <h3 className="font-serif text-3xl font-bold">{modalScenario.data.title}</h3>
                  <p className="text-sm italic text-white/60">{modalScenario.data.localPhrase}</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="mb-6 text-lg leading-relaxed text-white/80">{modalScenario.data.tagline}</p>
            
            <div className="mb-6 rounded-2xl bg-white/5 p-4">
              <h4 className="mb-2 font-semibold">The Situation:</h4>
              <p className="text-white/70">{modalScenario.data.situation}</p>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
              <div>
                <p className="text-sm text-white/60">Difficulty Level</p>
                <p className="font-semibold">{modalScenario.data.difficulty}</p>
              </div>
              <motion.button
                onClick={() => {
                  setModalOpen(false)
                  handleContinue()
                }}
                className="rounded-full bg-blue-500 px-6 py-3 font-medium transition-all hover:shadow-lg hover:shadow-blue-500/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Experience
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
