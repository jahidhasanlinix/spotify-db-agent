import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tracks, recentlyPlayed } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const recentTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      artist: tracks.artist,
      album: tracks.album,
      image: tracks.albumArt,
      duration: tracks.duration,
      playedAt: recentlyPlayed.playedAt
    })
    .from(recentlyPlayed)
    .innerJoin(tracks, eq(recentlyPlayed.trackId, tracks.id))
    .orderBy(recentlyPlayed.playedAt)
    .limit(10)
    
    return NextResponse.json(recentTracks)
  } catch (error) {
    console.error('Error fetching recently played:', error)
    return NextResponse.json({ error: 'Failed to fetch recently played' }, { status: 500 })
  }
}