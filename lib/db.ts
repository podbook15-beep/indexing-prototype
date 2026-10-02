import Database from "better-sqlite3";

const db =
  new Database("indexer.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    target_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    discovery_url TEXT
  )
`);

export default db;