# 🎵 Spotify Clone with Database Agent

A Next.js Spotify clone featuring an AI-powered database agent that can process natural language queries to manage database operations and integrate them with the frontend.

## 🚀 Features

- **Complete Spotify UI Clone** - Sidebar, main content, player controls, search
- **AI Database Agent** - Natural language processing for database operations
- **Real Database Integration** - SQLite with Drizzle ORM
- **Dynamic Frontend** - Toggle between hardcoded and database-powered data
- **API Routes** - RESTful endpoints for data fetching
- **CLI Tool** - Interactive command-line interface for the database agent

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: SQLite with Drizzle ORM
- **LLM**:  gemini-2.5-flash-lite-preview-06-17
- **CLI**: Commander.js, Inquirer.js

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Environment Variables

Create a `.env` file in the root directory with your API key:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: The Gemini API key is required for the AI-powered database agent to function.

### 3. Set up Database

```bash
# Generate database schema
npm run db:generate

# Create database tables
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.


## 🤖 CLI Tools

```bash
npm run agent
```

### Direct Test Queries

```bash
npm run agent test
```

```bash
npm run agent query
```


## 📊 Database Schema

The agent manages these tables:

- **tracks** - Individual songs/tracks
- **recently_played** - User's recently played tracks
- **made_for_you_playlists** - Personalized playlists
- **popular_albums** - Trending albums

## 🧪 Test Queries Demonstration

The agent successfully handles both required test queries:

### Query 1: Recently Played Songs
```
"Can you store the recently played songs in a table"
```
- Analyzes query → Identifies need for recently_played table
- Checks/creates table → Verifies schema exists
- Populates data → Uses exported recentlyPlayedData from frontend
- Creates API → Generates /api/recently-played/route.ts
- Frontend integration → Component automatically uses new API

### Query 2: Made For You & Popular Albums
```
"Can you store the 'Made for you' and 'Popular albums' in a table"
```
- Analyzes query → Identifies need for both tables
- Handles Made for You → made_for_you_playlists table + API
- Handles Popular Albums → popular_albums table + API
- Creates routes → /api/made-for-you and /api/popular-albums
- Frontend fetches from real database



Built for the **Orchids Full Stack SWE Takehome** challenge 🌺


