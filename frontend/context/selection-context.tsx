"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getCountryData } from "@/lib/country-data"

export type SelectionContextType = {
  selectedCountry: string | null
  setSelectedCountry: (value: string | null) => void
  selectedLanguage: string | null
  setSelectedLanguage: (value: string | null) => void
  reset: () => void
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined)

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const c = typeof window !== "undefined" ? localStorage.getItem("selectedCountry") : null
      const l = typeof window !== "undefined" ? localStorage.getItem("selectedLanguage") : null
      if (c) setSelectedCountry(c)
      if (l) setSelectedLanguage(l)
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

  const reset = () => {
    setSelectedCountry(null)
    setSelectedLanguage(null)
  }

  const value: SelectionContextType = {
    selectedCountry,
    setSelectedCountry,
    selectedLanguage,
    setSelectedLanguage,
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
