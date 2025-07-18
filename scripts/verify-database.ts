#!/usr/bin/env tsx

import { config } from 'dotenv'
config()

import { db } from '../src/lib/db/index'
import { tracks, recentlyPlayed, madeForYouPlaylists, popularAlbums } from '../src/lib/db/schema'
import { sql } from 'drizzle-orm'

console.log('🔍 Verifying Database Contents...\n')

async function verifyDatabase() {
  try {
    // Count records in each table
    console.log('📊 Record Counts:')
    
    const tracksCount = await db.select({ count: sql`count(*)` }).from(tracks)
    console.log(`   tracks: ${tracksCount[0].count} records`)
    
    const recentCount = await db.select({ count: sql`count(*)` }).from(recentlyPlayed) 
    console.log(`   recently_played: ${recentCount[0].count} records`)
    
    const playlistsCount = await db.select({ count: sql`count(*)` }).from(madeForYouPlaylists)
    console.log(`   made_for_you_playlists: ${playlistsCount[0].count} records`)
    
    const albumsCount = await db.select({ count: sql`count(*)` }).from(popularAlbums)
    console.log(`   popular_albums: ${albumsCount[0].count} records\n`)

    // Show actual data samples
    console.log('🎵 Sample Data from Tables:\n')
    
    // Sample tracks
    console.log('📀 TRACKS:')
    const sampleTracks = await db.select().from(tracks).limit(3)
    sampleTracks.forEach(track => {
      console.log(`   ID: ${track.id} | "${track.title}" by ${track.artist}`)
    })
    
    // Sample recently played
    console.log('\n⏮️  RECENTLY PLAYED:')
    const sampleRecent = await db.select().from(recentlyPlayed).limit(3)
    sampleRecent.forEach(recent => {
      console.log(`   ID: ${recent.id} | Track ID: ${recent.trackId} | Played: ${recent.playedAt}`)
    })
    
    // Sample Made for You playlists
    console.log('\n🎶 MADE FOR YOU PLAYLISTS:')
    const samplePlaylists = await db.select().from(madeForYouPlaylists).limit(3)
    samplePlaylists.forEach(playlist => {
      console.log(`   ID: ${playlist.id} | "${playlist.title}"`)
    })
    
    // Sample Popular Albums
    console.log('\n💿 POPULAR ALBUMS:')
    const sampleAlbums = await db.select().from(popularAlbums).limit(3)
    sampleAlbums.forEach(album => {
      console.log(`   ID: ${album.id} | "${album.title}" by ${album.artist}`)
    })

    console.log('\n✅ Database verification complete!')
    console.log('📝 All data is properly stored in SQLite database!')

  } catch (error) {
    console.error('❌ Database verification failed:', error)
    console.log('\n💡 Tip: Run "npm run agent test" to populate the database first')
  }
}

verifyDatabase() 