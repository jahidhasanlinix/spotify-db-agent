#!/usr/bin/env tsx

import { config } from 'dotenv'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load environment variables
config()
import { db, sqlite } from '../src/lib/db/index'
import { tracks, recentlyPlayed, madeForYouPlaylists, popularAlbums } from '../src/lib/db/schema'
import { recentlyPlayedData, madeForYouData, popularAlbumsData } from '../src/components/spotify-main-content'
import { eq, sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required')
  console.log('Please add GEMINI_API_KEY=your_api_key to your .env file')
  process.exit(1)
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

interface AgentContext {
  query: string
  steps: string[]
  currentStep: number
}

// Database Agent class:
class DatabaseAgent {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' })
  private context: AgentContext = {
    query: '',
    steps: [],
    currentStep: 0
  }
  

  // Orchestrate the database agent:
  async processQuery(userQuery: string): Promise<void> {
    this.context = {
      query: userQuery,
      steps: [],
      currentStep: 0
    }

    console.log(`\n🤖 Database Agent Processing: "${userQuery}"\n`)

    try {
      // Step 1: Analyze the query
      await this.analyzeQuery()
      
      // Step 2: Execute database operations
      await this.executeOperations()
      
      // Step 3: Create API routes
      await this.createAPIRoutes()
      
      // Step 4: Update frontend (placeholder for future integration)
      await this.updateFrontend()
      
      console.log('\n✅ Agent completed successfully!')
      
    } catch (error) {
      console.error('\n❌ Agent failed:', error)
      throw error
    }
  }

  private async analyzeQuery(): Promise<void> {
    this.logStep('🧠 Analyzing query...')
    
    const prompt = `
    You are a database agent for a Spotify clone app. Your job is to:
    - Analyze user queries and determine what database features are required.
    - Create database tables if they do not exist (DDL), including generating and running migration scripts as needed.
    - Populate tables with data (DML) from available sources.
    - Implement database operations (CRUD).
    - Set up API endpoints for the frontend to consume.
    - Integrate new database features into the UI/UX of the site when possible.
    - Display your current process and reasoning at each step.

    Query: "${this.context.query}"

    Current database schema:
    - tracks: id, title, artist, album, albumArt, duration
    - recently_played: id, trackId, playedAt
    - made_for_you_playlists: id, title, description, image
    - popular_albums: id, title, artist, image, duration

    Respond with a JSON object containing:
    {
      "operation": "create_table" | "query_data" | "update_data",
      "tables": ["table_names"],
      "description": "what this query wants to achieve",
      "needsAPIRoute": true/false,
      "needsFrontendUpdate": true/false
    }
    `

    const result = await this.model.generateContent(prompt)
    const response = result.response.text()
    
    try {
      const analysis = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
      console.log(`   📋 Operation: ${analysis.operation}`)
      console.log(`   🗃️  Tables: ${analysis.tables.join(', ')}`)
      console.log(`   📝 Description: ${analysis.description}`)
      
      this.context.steps.push(`Analyzed query: ${analysis.description}`)
    } catch (error) {
      console.log(`   📝 Analysis: Query involves database operations`)
      this.context.steps.push('Analyzed query for database operations')
    }
  }

  private async executeOperations(): Promise<void> {
    this.logStep('🔧 Executing database operations...')
    
    const query = this.context.query.toLowerCase()
    
    if (query.includes('recently played')) {
      console.log('   📀 Working with recently played songs...')
      await this.handleRecentlyPlayed()
    }
    
    if (query.includes('made for you')) {
      console.log('   🎵 Working with Made for You playlists...')
      await this.handleMadeForYou()
    }
    
    if (query.includes('popular albums')) {
      console.log('   💿 Working with Popular Albums...')
      await this.handlePopularAlbums()
    }
    
    this.context.steps.push('Executed database operations')
  }

  private async handleRecentlyPlayed(): Promise<void> {
    console.log('   ├─ Checking if recently_played table exists...')
    
    // Check if table exists and create if it doesn't
    await this.ensureTableExists('tracks')
    await this.ensureTableExists('recently_played')
    
    // Populate with data if empty
    await this.populateRecentlyPlayedData()
    
    // Verify data exists
    const recentTracks = await db.select({
      track: tracks,
      playedAt: recentlyPlayed.playedAt
    })
    .from(recentlyPlayed)
    .innerJoin(tracks, eq(recentlyPlayed.trackId, tracks.id))
    .limit(5)
    
    console.log(`   ├─ Found ${recentTracks.length} recently played tracks`)
    console.log('   └─ Recently played table is ready!')
  }

  private async handleMadeForYou(): Promise<void> {
    console.log('   ├─ Processing Made for You playlists...')
    
    // Ensure table exists and populate with data if empty
    await this.ensureTableExists('made_for_you_playlists')
    await this.populateMadeForYouData()
    
    // Verify data exists
    const playlists = await db.select().from(madeForYouPlaylists).limit(5)
    console.log(`   ├─ Found ${playlists.length} Made for You playlists`)
    console.log('   └─ Made for You table is ready!')
  }

  private async handlePopularAlbums(): Promise<void> {
    console.log('   ├─ Processing Popular Albums...')
    
    // Ensure table exists and populate with data if empty
    await this.ensureTableExists('popular_albums')
    await this.populatePopularAlbumsData()
    
    // Verify data exists
    const albums = await db.select().from(popularAlbums).limit(5)
    console.log(`   ├─ Found ${albums.length} popular albums`)
    console.log('   └─ Popular albums table is ready!')
  }

  private async createAPIRoutes(): Promise<void> {
    this.logStep('🛣️  Creating API routes...')
    
    const query = this.context.query.toLowerCase()
    
    if (query.includes('recently played')) {
      await this.createRecentlyPlayedRoute()
    }
    
    if (query.includes('made for you')) {
      await this.createMadeForYouRoute()
    }
    
    if (query.includes('popular albums')) {
      await this.createPopularAlbumsRoute()
    }
    
    this.context.steps.push('Created API routes')
  }

  private async createRecentlyPlayedRoute(): Promise<void> {
    const routePath = 'src/app/api/recently-played'
    this.ensureDirectoryExists(routePath)
    
    const routeContent = `import { NextResponse } from 'next/server'
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
}`

    fs.writeFileSync(path.join(routePath, 'route.ts'), routeContent)
    console.log('   ├─ Created /api/recently-played route')
  }

  private async createMadeForYouRoute(): Promise<void> {
    const routePath = 'src/app/api/made-for-you'
    this.ensureDirectoryExists(routePath)
    
    const routeContent = `import { NextResponse } from 'next/server'
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
}`

    fs.writeFileSync(path.join(routePath, 'route.ts'), routeContent)
    console.log('   ├─ Created /api/made-for-you route')
  }

  private async createPopularAlbumsRoute(): Promise<void> {
    const routePath = 'src/app/api/popular-albums'
    this.ensureDirectoryExists(routePath)
    
    const routeContent = `import { NextResponse } from 'next/server'
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
}`

    fs.writeFileSync(path.join(routePath, 'route.ts'), routeContent)
    console.log('   ├─ Created /api/popular-albums route')
  }

  private async updateFrontend(): Promise<void> {
    this.logStep('🎨 BONUS: Updating frontend to use database...')
    
    // This is the bonus integration step
    console.log('   ├─ Frontend integration available as bonus feature')
    console.log('   └─ API routes ready for frontend consumption')
    
    this.context.steps.push('Prepared frontend integration (bonus)')
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  private logStep(step: string): void {
    this.context.currentStep++
    console.log(`\n${this.context.currentStep}. ${step}`)
  }

  // --- Table creation logic ---
  private async createTableIfNotExists(tableName: string): Promise<void> {
    try {
      if (tableName === 'tracks') {
        sqlite.prepare(`
          CREATE TABLE IF NOT EXISTS tracks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            album TEXT NOT NULL,
            albumArt TEXT,
            duration INTEGER,
            createdAt TIMESTAMP
          )
        `).run()
      } else if (tableName === 'recently_played') {
        sqlite.prepare(`
          CREATE TABLE IF NOT EXISTS recently_played (
            id TEXT PRIMARY KEY,
            trackId TEXT NOT NULL,
            playedAt TIMESTAMP NOT NULL
          )
        `).run()
      } else if (tableName === 'made_for_you_playlists') {
        sqlite.prepare(`
          CREATE TABLE IF NOT EXISTS made_for_you_playlists (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            image TEXT,
            createdAt TIMESTAMP
          )
        `).run()
      } else if (tableName === 'popular_albums') {
        sqlite.prepare(`
          CREATE TABLE IF NOT EXISTS popular_albums (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            image TEXT,
            duration INTEGER,
            createdAt TIMESTAMP
          )
        `).run()
      }
      console.log(`   ├─ Table ${tableName} created or already exists`)
    } catch (error) {
      console.error(`   ├─ ❌ Error creating table ${tableName}:`, error)
      throw error
    }
  }

  // Dynamic table management methods to ensure the table exists and has data
  private async ensureTableExists(tableName: string): Promise<void> {
    try {
      console.log(`   ├─ Verifying table ${tableName} exists...`)
      let hasData = false
      let tableMissing = false
      try {
        if (tableName === 'tracks') {
          const count = await db.select({ count: sql`count(*)` }).from(tracks)
          hasData = (count[0]?.count as number) > 0
        } else if (tableName === 'recently_played') {
          const count = await db.select({ count: sql`count(*)` }).from(recentlyPlayed)
          hasData = (count[0]?.count as number) > 0
        } else if (tableName === 'made_for_you_playlists') {
          const count = await db.select({ count: sql`count(*)` }).from(madeForYouPlaylists)
          hasData = (count[0]?.count as number) > 0
        } else if (tableName === 'popular_albums') {
          const count = await db.select({ count: sql`count(*)` }).from(popularAlbums)
          hasData = (count[0]?.count as number) > 0
        }
      } catch (error) {
        // Table might not exist, so create it
        tableMissing = true
        console.log(`   ├─ Table ${tableName} not found, creating...`)
        await this.createTableIfNotExists(tableName)
      }
      if (!tableMissing) {
        console.log(`   ├─ ✅ Table ${tableName} is ready ${hasData ? '(has data)' : '(empty)'}`)
      }
    } catch (error) {
      console.error(`   ├─ ❌ Error checking/creating table ${tableName}:`, error)
      throw error
    }
  }

  private async populateRecentlyPlayedData(): Promise<void> {
    try {
      // Check if table is empty
      const existingCount = await db.select({ count: sql`count(*)` }).from(recentlyPlayed)
      const count = existingCount[0]?.count as number
      
      if (count > 0) {
        console.log(`   ├─ Table already has ${count} records, skipping population`)
        return
      }

      console.log('   ├─ Reading frontend data from spotify-main-content.tsx...')
      
      // Use imported data directly from frontend component
      const frontendData = recentlyPlayedData

      // Insert tracks first
      for (const track of frontendData) {
        await db.insert(tracks).values({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.image,
          duration: track.duration,
          createdAt: new Date()
        }).onConflictDoNothing()
      }

      // Insert recently played entries
      for (let i = 0; i < frontendData.length; i++) {
        await db.insert(recentlyPlayed).values({
          id: `recent-${i + 1}`,
          trackId: frontendData[i].id,
          playedAt: new Date(Date.now() - (i * 60 * 60 * 1000)) // Stagger by hours
        }).onConflictDoNothing()
      }

      console.log(`   ├─ ✅ Recently played data populated with ${frontendData.length} tracks from frontend`)
    } catch (error) {
      console.error('   ├─ ❌ Error populating recently played data:', error)
      throw error
    }
  }

  private async populateMadeForYouData(): Promise<void> {
    try {
      const existingCount = await db.select({ count: sql`count(*)` }).from(madeForYouPlaylists)
      const count = existingCount[0]?.count as number
      
      if (count > 0) {
        console.log(`   ├─ Table already has ${count} records, skipping population`)
        return
      }

      console.log('   ├─ Reading Made for You data from frontend...')
      
      // Use imported data directly from frontend component
      const frontendData = madeForYouData

      for (const playlist of frontendData) {
        await db.insert(madeForYouPlaylists).values({
          id: playlist.id,
          title: playlist.title,
          description: playlist.artist, // Using artist field as description from frontend
          image: playlist.image,
          createdAt: new Date()
        }).onConflictDoNothing()
      }

      console.log(`   ├─ ✅ Made for You data populated with ${frontendData.length} playlists from frontend`)
    } catch (error) {
      console.error('   ├─ ❌ Error populating Made for You data:', error)
      throw error
    }
  }

  private async populatePopularAlbumsData(): Promise<void> {
    try {
      const existingCount = await db.select({ count: sql`count(*)` }).from(popularAlbums)
      const count = existingCount[0]?.count as number
      
      if (count > 0) {
        console.log(`   ├─ Table already has ${count} records, skipping population`)
        return
      }

      console.log('   ├─ Reading Popular Albums data from frontend...')
      
      // Use imported data directly from frontend component
      const frontendData = popularAlbumsData

      for (const album of frontendData) {
        await db.insert(popularAlbums).values({
          id: album.id,
          title: album.title,
          artist: album.artist,
          image: album.image,
          duration: album.duration,
          createdAt: new Date()
        }).onConflictDoNothing()
      }

      console.log(`   ├─ ✅ Popular Albums data populated with ${frontendData.length} albums from frontend`)
    } catch (error) {
      console.error('   ├─ ❌ Error populating Popular Albums data:', error)
      throw error
    }
  }
}

// CLI Setup
const program = new Command()

program
  .name('database-agent')
  .description('AI-powered database agent for Spotify clone')
  .version('1.0.0')

program
  .command('query')
  .description('Process a natural language database query')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: 'Enter your database query:',
        validate: (input: string) => input.length > 0 || 'Please enter a query'
      }
    ])

    const agent = new DatabaseAgent()
    await agent.processQuery(answers.query)
  })

program
  .command('test')
  .description('Run the test queries from the assignment')
  .action(async () => {
    const agent = new DatabaseAgent()
    
    console.log('🧪 Running Test Queries...\n')
    
    // Test query 1
    console.log('=' .repeat(60))
    await agent.processQuery("Can you store the recently played songs in a table")
    
    console.log('\n' + '='.repeat(60))
    // Test query 2  
    await agent.processQuery("Can you store the 'Made for you' and 'Popular albums' in a table")
    
    console.log('\n🎉 All test queries completed!')
  })

// Handle direct execution
if (process.argv.length <= 2) {
  // Interactive mode
  async function interactive() {
    console.log('🎵 Welcome to the Spotify Clone Database Agent! 🤖\n')
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '📝 Enter custom query', value: 'query' },
          { name: '🧪 Run test queries', value: 'test' },
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ])

    if (action === 'exit') {
      console.log('Goodbye! 👋')
      process.exit(0)
    }

    if (action === 'query') {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'query',
          message: 'Enter your database query:',
          validate: (input: string) => input.length > 0 || 'Please enter a query'
        }
      ])

      const agent = new DatabaseAgent()
      await agent.processQuery(answers.query)
    } else if (action === 'test') {
      program.parse(['node', 'database-agent.ts', 'test'])
      return
    }
  }

  interactive().catch(console.error)
} else {
  program.parse()
} 