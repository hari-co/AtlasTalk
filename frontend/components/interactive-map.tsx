"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { getCountryData } from '@/lib/country-data'
import { useSelection } from '@/context/selection-context'

interface CountryFeature {
  type: 'Feature'
  id: string
  properties: { name: string }
  geometry: any
}

interface WorldAtlasTopology {
  type: "Topology"
  objects: {
    countries: {
      type: "GeometryCollection"
      geometries: Array<{
        type: "Polygon" | "MultiPolygon"
        id: string
        properties: { name: string }
        arcs: number[][] | number[][][]
      }>
    }
  }
  arcs: Array<[number, number][]>
}

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Optional country info shape from getCountryData
interface CountryInfo {
  name?: string
  description?: string
  imageUrl?: string
  language?: string
  heroImage?: string
}

// Map country IDs from world-atlas to our slugs
const countryIdToSlug: Record<string, string> = {
  '840': 'united-states', // USA
  '156': 'china',
  '724': 'spain',
  '250': 'france',
  '276': 'germany',
  '392': 'japan',
  '356': 'india',
  '076': 'brazil',
}

export default function InteractiveMap() {
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [activeCountry, setActiveCountry] = useState<CountryFeature | null>(null)
  const [showIntro, setShowIntro] = useState<boolean>(true)
  
  const router = useRouter()
  const { setSelectedCountry, setSelectedLanguage } = useSelection()

  useEffect(() => {
    const fetchData = async () => {
      try {
  const worldAtlas = await d3.json(WORLD_ATLAS_URL) as unknown as WorldAtlasTopology
        if (worldAtlas) {
          const countriesGeoJSON = topojson.feature(
            worldAtlas,
            worldAtlas.objects.countries
          ) as unknown as { features: CountryFeature[] }
          // Remove Antarctica from the map by filtering its feature
          const filtered = countriesGeoJSON.features.filter(
            (f) => f.properties?.name !== 'Antarctica' && f.id !== '010'
          )
          setCountries(filtered)
        }
      } catch (error) {
        console.error('Error fetching world atlas data:', error)
      }
    }
    fetchData()
  }, [])

  // Intro overlay: start fully visible, then fade out quickly
  useEffect(() => {
    setShowIntro(true)
    const timer = setTimeout(() => setShowIntro(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const width = 1200
  const height = 420

  const projection = useMemo(() => {
    return d3.geoMercator()
      .scale(165)
      .translate([width / 2, height / 1.5])
  }, [])

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection])

  const handleCountryMouseEnter = (country: CountryFeature) => {
    setActiveCountry(country)
  }

  const handleMouseLeave = () => {
    setActiveCountry(null)
  }

  const handleCountryClick = (country: CountryFeature) => {
    const slug = countryIdToSlug[country.id]
    if (slug) {
      // Persist the selected country in context (slug-based)
      setSelectedCountry(slug)
      // Also persist the default language for the country if available
      try {
        const data = getCountryData(slug as string) as { language?: string } | null
        if (data && typeof data.language === 'string' && data.language.length > 0) {
          setSelectedLanguage(data.language)
        }
      } catch {
        // ignore lookup errors
      }
      router.push(`/country/${slug}`)
    }
  }

  const isCountryAvailable = (countryId: string) => {
    return countryIdToSlug[countryId] !== undefined
  }

  // Active slug for the info panel (based on hovered country)
  const activeSlug = useMemo(() => {
    if (!activeCountry) return null
    if (!isCountryAvailable(activeCountry.id)) return null
    return countryIdToSlug[activeCountry.id] || null
  }, [activeCountry])

  // Fetch extra info (if available) for the active slug
  const info: CountryInfo | null = useMemo(() => {
    if (!activeSlug) return null
    try {
      return (getCountryData(activeSlug) as unknown) as CountryInfo
    } catch {
      return null
    }
  }, [activeSlug])

  const displayName = info?.name ?? activeCountry?.properties?.name ?? null
  const description = displayName
    ? (info?.description ?? `Discover ${displayName}.`)
    : 'Hover a highlighted country to see details.'
  const imageUrl = displayName
    ? (info?.imageUrl ?? info?.heroImage ?? `https://source.unsplash.com/800x600/?${encodeURIComponent(displayName)}`)
    : null

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Intro overlay with global blur */}
      <AnimatePresence>
        {showIntro && (
          <>
            {/* Full-screen blur/tint layer */}
            <motion.div
              key="intro-blur"
              className="pointer-events-none absolute inset-0 z-40 bg-black/20 backdrop-blur-lg"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />

            {/* Centered title */}
            <motion.div
              key="intro-text"
              className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <motion.div
                className="rounded-full bg-white/10 px-8 py-4 text-6xl md:text-7xl text-white shadow-xl backdrop-blur-md"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 700 }}
                initial={{ y: 0 }}
                animate={{ y: 0 }}
                exit={{ y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                AtlasTalk
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
  <div className="h-[92vh] w-screen mt-10 md:mt-16 flex">
        {/* Left: Map */}
  <div className="relative h-full w-full flex-[3] min-w-0 rounded-none bg-transparent">
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="block h-full w-full overflow-hidden">
            <g>
              <path
                d={pathGenerator({ type: 'Sphere' }) || ''}
                className="fill-transparent"
              />
              {countries.map((country) => {
                const isCountryActive = activeCountry !== null && activeCountry.id === country.id
                const isAvailable = isCountryAvailable(country.id)
                
                return (
                  <React.Fragment key={`${country.id ?? "no-id"}-${country.properties?.name ?? "no-name"}`}>
                    <path
                      d={pathGenerator(country) || ''}
                      className={`transition-all duration-200 ease-in-out stroke-slate-900 stroke-[0.5px] ${
                        isAvailable
                          ? `cursor-pointer ${
                              isCountryActive
                                ? 'fill-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                : 'fill-cyan-600 hover:fill-cyan-500'
                            }`
                          : 'fill-slate-600 cursor-default'
                      }`}
                      onMouseEnter={() => isAvailable && handleCountryMouseEnter(country)}
                      onMouseLeave={() => isAvailable && handleMouseLeave()}
                      onClick={() => isAvailable && handleCountryClick(country)}
                    />
                  </React.Fragment>
                )
              })}
            </g>
          </svg>
        </div>
        {/* Right: Info panel */}
  <aside className="relative h-full w-full flex-[1] max-w-[440px] border-l border-white/10 bg-black/20 backdrop-blur-sm p-4 md:p-6 overflow-y-auto">
          <div className="mx-auto w-full">
            {displayName ? (
              <>
                {imageUrl && (
                  <div className="mb-4 overflow-hidden rounded-lg border border-white/10 aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const fallback = `https://source.unsplash.com/800x600/?${encodeURIComponent(displayName || 'China')}`
                        // Prevent infinite loop if fallback also fails
                        if ((e.currentTarget as HTMLImageElement).src !== fallback) {
                          (e.currentTarget as HTMLImageElement).onerror = null
                          ;(e.currentTarget as HTMLImageElement).src = fallback
                        }
                      }}
                    />
                  </div>
                )}
                <h2 className="text-2xl md:text-3xl font-semibold text-white">{displayName}</h2>
                <p className="mt-2 text-sm md:text-base text-slate-200/80">{description}</p>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-200/80">
                Hover a highlighted country to see details.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
