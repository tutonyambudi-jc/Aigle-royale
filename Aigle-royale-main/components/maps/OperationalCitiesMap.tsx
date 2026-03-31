'use client'

import { useMemo, useState } from 'react'

const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Abidjan': { lat: 5.3600, lon: -4.0083 },
  'Bouaké': { lat: 7.6900, lon: -5.0300 },
  'Yamoussoukro': { lat: 6.8200, lon: -5.2700 },
  'Korhogo': { lat: 9.4500, lon: -5.6300 },
  'San-Pédro': { lat: 4.7500, lon: -6.6400 },
  'Daloa': { lat: 6.8800, lon: -6.4500 },
  'Man': { lat: 7.4100, lon: -7.5500 },
  'Gagnoa': { lat: 6.1300, lon: -5.9500 },
  // Fallback default
  'default': { lat: 7.5400, lon: -5.5500 } // Center of Cote d'Ivoire approx
}

export function OperationalCitiesMap({ cities }: { cities: string[] }) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string | null>(cities[0] || null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return cities
    return cities.filter((c) => c.toLowerCase().includes(s))
  }, [cities, q])

  const selectedCity = selected && cities.includes(selected) ? selected : filtered[0] || null

  const coords = selectedCity ? (CITY_COORDINATES[selectedCity] || CITY_COORDINATES[selectedCity.split(' ')[0]] || CITY_COORDINATES['default']) : CITY_COORDINATES['default']

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-extrabold text-gray-900">Villes opérationnelles</h2>
          <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded">{cities.length}</span>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une ville…"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        />

        <div className="mt-4 max-h-[420px] overflow-auto space-y-2 pr-1">
          {filtered.map((c) => {
            const active = c === selectedCity
            return (
              <button
                key={c}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${active ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <div className="font-bold text-gray-900">{c}</div>
                <div className="text-xs text-gray-600">Cliquez pour voir sur la carte</div>
              </button>
            )
          })}

          {filtered.length === 0 && <div className="text-gray-600 text-sm">Aucune ville trouvée.</div>}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Carte interactive</h2>
        <p className="text-gray-600 mb-6">
          Sélectionnez une ville pour voir son emplacement.
        </p>

        {selectedCity ? (
          <div className="space-y-6">
            {/* Map Iframe */}
            <div className="w-full h-[400px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.1}%2C${coords.lat - 0.1}%2C${coords.lon + 0.1}%2C${coords.lat + 0.1}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`}
                style={{ border: 0 }}
              ></iframe>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-slate-50 to-blue-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-500">Ville sélectionnée</div>
                  <div className="text-3xl font-extrabold text-gray-900">{selectedCity}</div>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=12/${coords.lat}/${coords.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700"
                  >
                    Voir en grand
                  </a>
                  <a
                    href="/#search"
                    className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-800"
                  >
                    Réserver
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">Aucune ville disponible.</div>
        )}
      </div>
    </div>
  )
}

