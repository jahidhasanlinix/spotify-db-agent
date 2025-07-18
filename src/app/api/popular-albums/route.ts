import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { popularAlbums } from '@/lib/db/schema'

export async function GET() {
  try {
    const albums = await db.select({
      id: popularAlbums.id,
      title: popularAlbums.title,
      artist: popularAlbums.artist,
      album: popularAlbums.title, // Using title as album field for consistency
      image: popularAlbums.image,
      duration: popularAlbums.duration
    }).from(popularAlbums)
    
    return NextResponse.json(albums)
  } catch (error) {
    console.error('Error fetching popular albums:', error)
    return NextResponse.json({ error: 'Failed to fetch popular albums' }, { status: 500 })
  }
}