'use server';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getProjects() {
  return await db.query.projects.findMany({
    orderBy: [desc(projects.updatedAt)],
  });
}

export async function getProject(id: number) {
  return await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}

export async function createProject() {
  const [newProject] = await db.insert(projects).values({
    title: 'Untitled Diagram',
  }).returning();
  
  revalidatePath('/');
  redirect(`/project/${newProject.id}`);
}

export async function updateProject(id: number, data: { title?: string, code?: string }) {
  await db.update(projects)
    .set({ 
      ...data,
      updatedAt: new Date() // Force update timestamp
    })
    .where(eq(projects.id, id));
  
  revalidatePath('/');
  revalidatePath(`/project/${id}`);
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath('/');
  redirect('/');
}
