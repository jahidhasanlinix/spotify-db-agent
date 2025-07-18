import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Main tracks table - stores all individual tracks
export const tracks = sqliteTable('tracks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  album: text('album').notNull(),
  albumArt: text('album_art').notNull(),
  duration: integer('duration').notNull(), // in seconds
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
})

// Recently played tracks
export const recentlyPlayed = sqliteTable('recently_played', {
  id: text('id').primaryKey(),
  trackId: text('track_id').notNull().references(() => tracks.id),
  playedAt: integer('played_at', { mode: 'timestamp' }).notNull().default(new Date()),
})

// Made for you playlists
export const madeForYouPlaylists = sqliteTable('made_for_you_playlists', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(), // artist field repurposed as description
  image: text('image').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
})

// Popular albums
export const popularAlbums = sqliteTable('popular_albums', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  image: text('image').notNull(),
  duration: integer('duration').notNull(), // total album duration
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
})

// Playlist tracks relationship (for made for you playlists)
export const playlistTracks = sqliteTable('playlist_tracks', {
  id: text('id').primaryKey(),
  playlistId: text('playlist_id').notNull().references(() => madeForYouPlaylists.id),
  trackId: text('track_id').notNull().references(() => tracks.id),
  position: integer('position').notNull(),
})

// Album tracks relationship (for popular albums)
export const albumTracks = sqliteTable('album_tracks', {
  id: text('id').primaryKey(),
  albumId: text('album_id').notNull().references(() => popularAlbums.id),
  trackId: text('track_id').notNull().references(() => tracks.id),
  trackNumber: integer('track_number').notNull(),
})

// Export types: All 5 main tables are defined here:
export type Track = typeof tracks.$inferSelect
export type NewTrack = typeof tracks.$inferInsert
export type RecentlyPlayed = typeof recentlyPlayed.$inferSelect
export type MadeForYouPlaylist = typeof madeForYouPlaylists.$inferSelect
export type PopularAlbum = typeof popularAlbums.$inferSelect 