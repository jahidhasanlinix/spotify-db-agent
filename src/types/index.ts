export interface Track {
  id: string
  title: string
  artist: string
  album: string
  image: string // Using 'image' as the standard field name (matches database)
  duration: number
}

export interface PlaylistItem {
  id: string
  title: string
  subtitle: string
  image?: string
  duration?: number
} 