'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeDatabase, saveDBBinary } from '@/lib/db-browser';
import { SQLJsDatabase } from 'drizzle-orm/sql-js';
import { Database } from 'sql.js';
import * as schema from '@/db/schema';

interface DatabaseContextType {
  db: SQLJsDatabase<typeof schema> | null;
  sqlite: Database | null;
  isReady: boolean;
  version: number;
  refresh: () => void;
  save: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLJsDatabase<typeof schema> | null>(null);
  const [sqlite, setSqlite] = useState<Database | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [version, setVersion] = useState(0);

  const init = async () => {
    try {
      const result = await initializeDatabase();
      setDb(result.db);
      setSqlite(result.sqlite);
      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const refresh = () => setVersion((v) => v + 1);

  const save = async () => {
    if (sqlite) {
      const data = sqlite.export();
      await saveDBBinary(data);
    }
  };

  return (
    <DatabaseContext.Provider value={{ db, sqlite, isReady, version, refresh, save }}>
      <div className="h-full w-full">
        {children}
      </div>
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
