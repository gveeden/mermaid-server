'use client';

import initSqlJs, { Database } from 'sql.js';
import { drizzle, SQLJsDatabase } from 'drizzle-orm/sql-js';
import { get, set } from 'idb-keyval';
import * as schema from '@/db/schema';

const DB_STORAGE_KEY = 'mermaid_server_sqlite_db';

export async function loadDBBinary(): Promise<Uint8Array | null> {
  return await get(DB_STORAGE_KEY) || null;
}

export async function saveDBBinary(data: Uint8Array) {
  await set(DB_STORAGE_KEY, data);
}

export async function initializeDatabase(): Promise<{ db: SQLJsDatabase<typeof schema>, sqlite: Database }> {
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`,
  });

  const binary = await loadDBBinary();
  const sqlite = new SQL.Database(binary || undefined);
  
  // If new DB, create tables
  if (!binary) {
    // We can't use drizzle-kit push in the browser easily, 
    // so we'll just run the create table statements manually or use drizzle's migrate if we have migrations.
    // For simplicity, let's just run the SQL for our schema if it's a fresh start.
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT 'Untitled Diagram',
        code TEXT NOT NULL DEFAULT 'graph TD\n    A[Start] --> B{Is it working?}\n    B -- Yes --> C[Great!]\n    B -- No --> D[Try again]\n    D --> B',
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        data BLOB NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    
    // Save the initial structure
    await saveDBBinary(sqlite.export());
  }

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
