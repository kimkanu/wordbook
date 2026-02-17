import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pgInstance: PGlite | null = null;

const MIGRATIONS_SQL = `
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

DO $$ BEGIN
  CREATE TYPE word_status AS ENUM ('learning', 'reviewing', 'mastered');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL,
  definition TEXT,
  pronunciation TEXT,
  example_sentence TEXT,
  status word_status DEFAULT 'learning' NOT NULL,
  article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS word_tags (
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE
);
`;

export async function getDb() {
  if (dbInstance) return dbInstance;

  pgInstance = new PGlite("idb://wordbook");
  await pgInstance.exec(MIGRATIONS_SQL);
  dbInstance = drizzle(pgInstance, { schema });
  return dbInstance;
}
