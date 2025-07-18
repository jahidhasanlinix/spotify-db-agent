"use client"

import { Play, User } from "lucide-react"
import { useState, useEffect } from "react"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  image: string
  duration: number
}

interface MusicCardProps {
  title: string
  artist: string
  image?: string
  size?: "small" | "medium" | "large"
  className?: string
  onPlay?: () => void
}

function MusicCard({ title, artist, image, size = "medium", className = "", onPlay }: MusicCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    small: "w-[180px] h-[180px]",
    medium: "w-full aspect-square",
    large: "w-full aspect-square"
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPlay?.()
  }

  return (
    <div 
      className={`group cursor-pointer p-4 rounded-lg transition-all duration-300 hover:bg-[var(--color-interactive-hover)] border border-transparent hover:border-gray-600/50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative ${sizeClasses[size]} mb-4`}>
        <div className="w-full h-full bg-[var(--color-muted)] rounded-lg flex items-center justify-center overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-chart-1)] opacity-20 rounded-lg"></div>
          )}
        </div>
        
        {/* Play button overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div 
            onClick={handlePlayClick}
            className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110 cursor-pointer"
          >
            <Play className="w-5 h-5 text-black fill-black ml-1" />
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-medium text-[var(--color-text-primary)] text-sm truncate">{title}</h3>
        <p className="text-[var(--color-text-secondary)] text-xs truncate">{artist}</p>
      </div>
    </div>
  )
}

interface SpotifyMainContentProps {
  onPlayTrack?: (track: Track) => void
}

export default function SpotifyMainContentDB({ onPlayTrack }: SpotifyMainContentProps) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([])
  const [madeForYou, setMadeForYou] = useState<Track[]>([])
  const [popularAlbums, setPopularAlbums] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [recentResponse, madeForYouResponse, popularResponse] = await Promise.all([
        fetch('/api/recently-played'),
        fetch('/api/made-for-you'), 
        fetch('/api/popular-albums')
      ])

      if (!recentResponse.ok || !madeForYouResponse.ok || !popularResponse.ok) {
        throw new Error('Failed to fetch data from database')
      }

      const [recentData, madeForYouData, popularData] = await Promise.all([
        recentResponse.json(),
        madeForYouResponse.json(),
        popularResponse.json()
      ])

      setRecentlyPlayed(recentData)
      setMadeForYou(madeForYouData)
      setPopularAlbums(popularData)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data from database')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayTrack = (item: Track) => {
    const track: Track = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      image: item.image || '/api/placeholder/56/56',
      duration: item.duration
    }
    onPlayTrack?.(track)
  }

  if (loading) {
    return (
      <div className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-secondary)]">Loading data from database...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">❌ {error}</p>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-[var(--color-primary)] text-black rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Good afternoon</h1>
          <span className="px-3 py-1 bg-green-500 text-black text-xs font-medium rounded-full">
            🗄️ DATABASE POWERED
          </span>
        </div>
        <div className="w-8 h-8 bg-[var(--color-muted)] rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </div>
      </div>

      {/* Recently Played */}
      <section className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Recently played</h2>
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
              {recentlyPlayed.length} from DB
            </span>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {recentlyPlayed.map((item, index) => (
            <div key={index} className="flex-shrink-0">
              <MusicCard 
                title={item.title} 
                artist={item.artist} 
                image={item.image}
                size="small"
                onPlay={() => handlePlayTrack(item)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Made For You */}
      <section className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Made For You</h2>
            <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded">
              {madeForYou.length} from DB
            </span>
          </div>
          <button className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text-primary)] transition-colors">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {madeForYou.map((item, index) => (
            <MusicCard 
              key={index}
              title={item.title} 
              artist={item.artist}
              image={item.image}
              size="medium"
              onPlay={() => handlePlayTrack(item)}
            />
          ))}
        </div>
      </section>

      {/* Popular Albums */}
      <section className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Popular albums</h2>
            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
              {popularAlbums.length} from DB
            </span>
          </div>
          <button className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text-primary)] transition-colors">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {popularAlbums.map((item, index) => (
            <MusicCard 
              key={index}
              title={item.title} 
              artist={item.artist}
              image={item.image}
              size="medium"
              onPlay={() => handlePlayTrack(item)}
            />
          ))}
        </div>
      </section>

      <style jsx>{`
        .scrollbar-hide {
          /* Hide scrollbar for Chrome, Safari and Opera */
          -webkit-scrollbar: hidden;
        }
        
        .scrollbar-hide {
          /* Hide scrollbar for IE, Edge and Firefox */
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
} 