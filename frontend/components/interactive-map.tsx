"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { getAllCountrySlugs } from '@/lib/country-data'

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
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const router = useRouter()

  const availableSlugs = getAllCountrySlugs()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const worldAtlas = await d3.json<WorldAtlasTopology>(WORLD_ATLAS_URL)
        if (worldAtlas) {
          const countriesGeoJSON = topojson.feature(
            worldAtlas,
            worldAtlas.objects.countries
          ) as unknown as { features: CountryFeature[] }
          setCountries(countriesGeoJSON.features)
        }
      } catch (error) {
        console.error('Error fetching world atlas data:', error)
      }
    }
    fetchData()
  }, [])

  const width = 960
  const height = 500

  const projection = useMemo(() => {
    return d3.geoMercator()
      .scale(120)
      .translate([width / 2, height / 1.45])
  }, [])

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection])
  const graticule = useMemo(() => d3.geoGraticule()(), [])

  const handleCountryMouseEnter = (country: CountryFeature) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    setActiveCountry(country)
    const centroid = pathGenerator.centroid(country)
    const [x, y] = centroid

    if (containerRef.current) {
      const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect()
      const projectedX = (x / width) * containerWidth
      const projectedY = (y / height) * containerHeight
      setTooltipPosition({ x: projectedX, y: projectedY })
    }
  }

  const handleMouseLeave = () => {
    hideTimeoutRef.current = window.setTimeout(() => {
      setActiveCountry(null)
      setTooltipPosition(null)
    }, 300)
  }

  const handleTooltipMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }

  const handleCountryClick = (country: CountryFeature) => {
    const slug = countryIdToSlug[country.id]
    if (slug) {
      router.push(`/country/${slug}`)
    }
  }

  const isCountryAvailable = (countryId: string) => {
    return countryIdToSlug[countryId] !== undefined
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-sans text-4xl font-bold text-white">AtlasTalk</h1>
          <p className="text-lg text-white/70">Click on a highlighted country to explore and connect</p>
        </div>

        <div
          ref={containerRef}
          className="relative rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 p-4 md:p-8 shadow-2xl backdrop-blur-xl border border-white/10"
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <g>
              <path
                d={pathGenerator({ type: 'Sphere' }) || ''}
                className="fill-slate-900"
              />
              <path
                d={pathGenerator(graticule) || ''}
                className="fill-none stroke-slate-700 stroke-[0.5px]"
              />
              {countries.map((country) => {
                const isCountryActive = activeCountry !== null && activeCountry.id === country.id
                const isAvailable = isCountryAvailable(country.id)
                
                return (
                  <React.Fragment key={country.id}>
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

          {activeCountry && tooltipPosition && (
            <div
              onMouseEnter={handleTooltipMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="absolute p-4 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl transition-all duration-200 border border-cyan-400/50 pointer-events-auto"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: 'translate(-50%, -110%)',
              }}
            >
              <h3 className="text-lg font-bold text-cyan-300 mb-2 whitespace-nowrap">
                {activeCountry.properties.name}
              </h3>
              <p className="text-sm text-white/70 mb-3">Click to explore scenarios</p>
              <button
                onClick={() => handleCountryClick(activeCountry)}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all"
              >
                Start Journey →
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 text-center border border-cyan-500/20">
          <p className="text-sm text-white/70">
            <span className="font-semibold text-cyan-300">{availableSlugs.length} countries</span> available to
            explore with interactive scenarios and chat
          </p>
        </div>
      </div>
    </div>
  )
}
