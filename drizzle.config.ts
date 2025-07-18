import { defineConfig } from 'drizzle-kit'

/*
  Here configured the Drizzle ORM to use SQLite as the database.
  The schema is defined in the src/lib/db/schema.ts file.
  The out is the directory where the generated files will be saved.
  The dbCredentials is the connection string to the database.
*/

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: './sqlite.db'
  }
}) 