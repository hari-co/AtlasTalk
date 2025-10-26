"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getCountryData } from "@/lib/country-data"

export type SelectionContextType = {
  selectedCountry: string | null
  setSelectedCountry: (value: string | null) => void
  selectedLanguage: string | null
  setSelectedLanguage: (value: string | null) => void
  // Store the situation text of the selected scenario
  selectedScenario: string | null
  setSelectedScenario: (value: string | null) => void
  selectedAgent: string | null
  setSelectedAgent: (value: string | null) => void
  reset: () => void
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined)

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const c = typeof window !== "undefined" ? localStorage.getItem("selectedCountry") : null
      const l = typeof window !== "undefined" ? localStorage.getItem("selectedLanguage") : null
      const s = typeof window !== "undefined" ? localStorage.getItem("selectedScenario") : null
      const a = typeof window !== "undefined" ? localStorage.getItem("selectedAgent") : null
      if (c) setSelectedCountry(c)
      if (l) setSelectedLanguage(l)
      if (s) setSelectedScenario(s)
      if (a) setSelectedAgent(a)
    } catch {
      // ignore storage errors
    }
  }, [])

  // Persist changes
  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      if (selectedCountry) localStorage.setItem("selectedCountry", selectedCountry)
      else localStorage.removeItem("selectedCountry")
    } catch {
      // ignore storage errors
    }
  }, [selectedCountry])

  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      if (selectedLanguage) localStorage.setItem("selectedLanguage", selectedLanguage)
      else localStorage.removeItem("selectedLanguage")
    } catch {
      // ignore storage errors
    }
  }, [selectedLanguage])

  // Persist scenario
  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      if (selectedScenario) localStorage.setItem("selectedScenario", selectedScenario)
      else localStorage.removeItem("selectedScenario")
    } catch {
      // ignore storage errors
    }
  }, [selectedScenario])

  // Persist agent
  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      if (selectedAgent) localStorage.setItem("selectedAgent", selectedAgent)
      else localStorage.removeItem("selectedAgent")
    } catch {
      // ignore storage errors
    }
  }, [selectedAgent])

  // Debug: log whenever context values change
  useEffect(() => {
    // You can gate this in production if needed
    // if (process.env.NODE_ENV !== 'development') return
    let countryLabel: string | null = selectedCountry
    try {
      if (selectedCountry) {
        const data = getCountryData(selectedCountry)
        if (data && typeof data.name === "string" && data.name.length > 0) {
          countryLabel = data.name
        }
      }
    } catch {
      // ignore lookup errors
    }

    const countryOut = countryLabel ?? "(none)"
    const languageOut = selectedLanguage ?? "(none)"
    console.log(`[SelectionContext] Selected country: ${countryOut} | Language: ${languageOut}`)
  }, [selectedCountry, selectedLanguage])

  // Debug: log scenario/agent changes
  useEffect(() => {
    const scenarioOut = selectedScenario ?? "(none)"
    const agentOut = selectedAgent ?? "(none)"
    console.log(`[SelectionContext] Scenario: ${scenarioOut} | Agent: ${agentOut}`)
  }, [selectedScenario, selectedAgent])

  const reset = () => {
    setSelectedCountry(null)
    setSelectedLanguage(null)
    setSelectedScenario(null)
    setSelectedAgent(null)
  }

  const value: SelectionContextType = {
    selectedCountry,
    setSelectedCountry,
    selectedLanguage,
    setSelectedLanguage,
    selectedScenario,
    setSelectedScenario,
    selectedAgent,
    setSelectedAgent,
    reset,
  }

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export function useSelection(): SelectionContextType {
  const ctx = useContext(SelectionContext)
  if (!ctx) {
    throw new Error("useSelection must be used within a SelectionProvider")
  }
  return ctx
}
