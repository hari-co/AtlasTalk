"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { getCountryData } from '@/lib/country-data'
import { useSelection } from '@/context/selection-context'
import { FadeContent } from '@/components/ui/fadein'
import { Squares } from '@/components/ui/squares-background'
import { GooeyText } from '@/components/ui/gooey-text-morphing'
import { DestinationCard } from '@/components/ui/destination-card'

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
  const [showTitle, setShowTitle] = useState<boolean>(false)
  const [hideTitle, setHideTitle] = useState<boolean>(false)
  const [showMap, setShowMap] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  
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

  // Loading sequence: show title after 300ms, hide it after 2500ms, show map after title fully fades (3500ms)
  useEffect(() => {
    const titleTimer = setTimeout(() => setShowTitle(true), 300)
    const hideTitleTimer = setTimeout(() => setHideTitle(true), 2500)
    const mapTimer = setTimeout(() => setShowMap(true), 3500)
    return () => {
      clearTimeout(titleTimer)
      clearTimeout(hideTitleTimer)
      clearTimeout(mapTimer)
    }
  }, [])

  const width = 1200
  const height = 420

  const projection = useMemo(() => {
    return d3.geoMercator()
      .scale(165)
      .translate([width / 2, height / 1.5])
  }, [])

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection])

  const handleCountryMouseEnter = (country: CountryFeature, event: React.MouseEvent) => {
    setActiveCountry(country)
    setMousePosition({ x: event.clientX, y: event.clientY })
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (activeCountry) {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }
  }

  const handleMouseLeave = () => {
    setActiveCountry(null)
    setMousePosition(null)
  }

  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (err) {
      console.log('Audio play failed:', err)
    }
  }

  const handleCountryClick = (country: CountryFeature) => {
    const slug = countryIdToSlug[country.id]
    if (slug) {
      playClickSound()
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Animated squares background */}
      <div className="absolute inset-0 z-0">
        <Squares
          direction="diagonal"
          speed={0.5}
          squareSize={40}
          borderColor="#1a1a1a"
          hoverFillColor="#0a0a0a"
        />
      </div>

      {/* Title fade-in and fade-out */}
      {showTitle && !hideTitle && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h1
            className="text-7xl md:text-8xl text-white tracking-tight"
            style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 700 }}
          >
            AtlasTalk
          </h1>
        </motion.div>
      )}

      {showTitle && hideTitle && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 1, filter: "blur(0px)" }}
          animate={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeIn" }}
        >
          <h1
            className="text-7xl md:text-8xl text-white tracking-tight"
            style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 700 }}
          >
            AtlasTalk
          </h1>
        </motion.div>
      )}

      {/* Main content container */}
      {showMap && (
        <div className="relative z-10 min-h-screen w-full flex flex-col">
          {/* Header Section with generous spacing */}
          <header className="w-full pt-24 md:pt-32 pb-8 px-8">
            <FadeContent
              duration={1500}
              easing="ease-out"
              initialOpacity={0}
              delay={300}
              className="max-w-7xl mx-auto"
            >
              <div className="text-center space-y-6">
                <h2 className="text-sm md:text-base uppercase tracking-[0.3em] text-white/50 font-light">
                  Language Learning Through Travel
                </h2>
                <div className="h-24 flex items-center justify-center">
                  <GooeyText
                    texts={["Explore", "Learn", "Connect", "Discover"]}
                    morphTime={1.5}
                    cooldownTime={0.5}
                    textClassName="text-white text-5xl md:text-6xl font-bold tracking-tight"
                  />
                </div>
                <p className="text-white/60 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                  Select a country to begin your immersive language journey
                </p>
              </div>
            </FadeContent>
          </header>

          {/* Map Section with perfect centering and spacing */}
          <main className="flex-1 w-full flex items-center justify-center px-8 py-4">
            <FadeContent
              duration={1500}
              easing="ease-out"
              initialOpacity={0}
              className="w-full max-w-7xl"
            >
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox={`0 0 ${width} ${height}`} 
                  className="block w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    {/* Radial gradient for subtle edge fade */}
                    <radialGradient id="mapFade" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="white" stopOpacity="1" />
                      <stop offset="50%" stopColor="white" stopOpacity="1" />
                      <stop offset="65%" stopColor="white" stopOpacity="0.95" />
                      <stop offset="75%" stopColor="white" stopOpacity="0.85" />
                      <stop offset="82%" stopColor="white" stopOpacity="0.7" />
                      <stop offset="88%" stopColor="white" stopOpacity="0.5" />
                      <stop offset="93%" stopColor="white" stopOpacity="0.3" />
                      <stop offset="97%" stopColor="white" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                    <mask id="fadeMask">
                      <rect width="100%" height="100%" fill="url(#mapFade)" />
                    </mask>
                  </defs>
                  <g mask="url(#fadeMask)">
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
                            className={`transition-all duration-300 ease-in-out stroke-slate-900 stroke-[0.5px] ${
                              isAvailable
                                ? `cursor-pointer ${
                                    isCountryActive
                                      ? 'fill-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]'
                                      : 'fill-blue-600 hover:fill-blue-500'
                                  }`
                                : 'fill-slate-700 cursor-default'
                            }`}
                            onMouseEnter={(e) => isAvailable && handleCountryMouseEnter(country, e)}
                            onMouseMove={(e) => isAvailable && handleMouseMove(e)}
                            onMouseLeave={() => isAvailable && handleMouseLeave()}
                            onClick={() => isAvailable && handleCountryClick(country)}
                          />
                        </React.Fragment>
                      )
                    })}
                  </g>
                </svg>
              </div>
            </FadeContent>
          </main>

          {/* Footer section with subtle instruction */}
          <footer className="w-full pb-12 px-8">
            <FadeContent
              duration={1500}
              easing="ease-out"
              initialOpacity={0}
              delay={800}
              className="max-w-7xl mx-auto"
            >
              <div className="text-center space-y-4">
                <p className="text-white/40 text-xs md:text-sm tracking-wide">
                  Click on a highlighted country to explore
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-white/30 text-xs">Available destinations</span>
                </div>
              </div>
            </FadeContent>
          </footer>
        </div>
      )}

      {/* Hover Destination Card */}
      <AnimatePresence>
        {activeCountry && mousePosition && isCountryAvailable(activeCountry.id) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${mousePosition.x + 20}px`,
              top: `${mousePosition.y - 175}px`,
            }}
          >
            <div className="w-[280px] h-[350px]">
              {(() => {
                const slug = countryIdToSlug[activeCountry.id]
                const countryData = getCountryData(slug)
                
                if (!countryData) return null
                
                const scenarioCount = Object.keys(countryData.scenarios).length
                
                // Theme color mapping for each country
                const themeColors: Record<string, string> = {
                  'united-states': '220 70% 45%',
                  'china': '0 70% 45%',
                  'spain': '40 80% 50%',
                  'france': '220 60% 50%',
                  'germany': '0 0% 30%',
                  'japan': '350 70% 50%',
                  'india': '30 70% 50%',
                  'brazil': '140 50% 35%',
                }
                
                return (
                  <DestinationCard
                    imageUrl={countryData.heroImage || `https://source.unsplash.com/800x600/?${encodeURIComponent(countryData.name)}`}
                    location={countryData.name}
                    flag={countryData.flag}
                    stats={`${scenarioCount} Scenarios • ${countryData.language}`}
                    href={`/country/${slug}`}
                    themeColor={themeColors[slug] || '220 70% 45%'}
                  />
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
