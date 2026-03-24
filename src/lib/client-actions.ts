'use client';

import { projects, Project } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { SQLJsDatabase } from 'drizzle-orm/sql-js';
import * as schema from '@/db/schema';

export async function getProjects(db: SQLJsDatabase<typeof schema>) {
  return await db.query.projects.findMany({
    orderBy: [desc(projects.updatedAt)],
  });
}

export async function getProject(db: SQLJsDatabase<typeof schema>, id: number) {
  return await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}

export async function createProject(db: SQLJsDatabase<typeof schema>) {
  const result = await db.insert(projects).values({
    title: 'Untitled Diagram',
    updatedAt: new Date()
  }).returning();
  
  return result[0];
}

export async function updateProject(db: SQLJsDatabase<typeof schema>, id: number, data: { title?: string, code?: string }) {
  await db.update(projects)
    .set({ 
      ...data,
      updatedAt: new Date()
    })
    .where(eq(projects.id, id));
}

export async function deleteProject(db: SQLJsDatabase<typeof schema>, id: number) {
  await db.delete(projects).where(eq(projects.id, id));
}
