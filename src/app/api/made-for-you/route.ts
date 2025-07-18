import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { madeForYouPlaylists } from '@/lib/db/schema'

export async function GET() {
  try {
    const playlists = await db.select({
      id: madeForYouPlaylists.id,
      title: madeForYouPlaylists.title,
      artist: madeForYouPlaylists.description, // Using description as artist field
      album: madeForYouPlaylists.title, // Using title as album field for consistency
      image: madeForYouPlaylists.image,
      duration: 210 // Default duration for playlists
    }).from(madeForYouPlaylists)
    
    return NextResponse.json(playlists)
  } catch (error) {
    console.error('Error fetching made for you:', error)
    return NextResponse.json({ error: 'Failed to fetch made for you playlists' }, { status: 500 })
  }
}