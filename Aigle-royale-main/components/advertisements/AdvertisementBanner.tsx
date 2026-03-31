'use client'

import { useState, useEffect } from 'react'

interface Advertisement {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  type: string
}

interface AdvertisementBannerProps {
  type: 'BANNER_HOMEPAGE' | 'BANNER_RESULTS' | 'BANNER_CONFIRMATION'
  reserveHeight?: boolean
  heightClassName?: string
  showPlaceholder?: boolean
}

export function AdvertisementBanner({
  type,
  reserveHeight = false,
  heightClassName = 'h-48',
  showPlaceholder = false,
}: AdvertisementBannerProps) {
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/advertisements/serve?type=${encodeURIComponent(type)}`)
      .then((res) => res.json())
      .then((data) => setAdvertisement(data))
      .catch((err) => console.error('Error fetching advertisement:', err))
      .finally(() => setLoaded(true))
  }, [type])

  if (!advertisement) {
    if (!showPlaceholder) return reserveHeight ? <div className={heightClassName} /> : null
    if (!loaded) return <div className={heightClassName} />
    return (
      <div className={`my-4 ${reserveHeight ? heightClassName : ''}`}>
        <a href="/advertise" className="block h-full">
          <div className={`relative w-full ${reserveHeight ? 'h-full' : heightClassName} bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg overflow-hidden hover:opacity-95 transition-opacity flex items-center justify-between px-6`}>
            <div className="text-white">
              <div className="text-lg font-extrabold">Votre publicité ici</div>
              <div className="text-white/90 text-sm mt-1">Annoncez sur Aigle Royale</div>
            </div>
            <div className="bg-white/15 text-white border border-white/25 px-4 py-2 rounded-xl font-bold">
              Devenir annonceur
            </div>
          </div>
        </a>
      </div>
    )
  }

  const content = (
    <div className={`relative w-full ${heightClassName} bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}>
      <img
        src={advertisement.imageUrl}
        alt={advertisement.title}
        className="w-full h-full object-cover"
      />
      {advertisement.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
          {advertisement.title}
        </div>
      )}
    </div>
  )

  return (
    <div className="my-4">
      <a
        href={`/api/advertisements/${advertisement.id}/click`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    </div>
  )
}
