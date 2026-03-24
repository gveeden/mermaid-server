'use client';

import { images } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { SQLJsDatabase } from 'drizzle-orm/sql-js';
import * as schema from '@/db/schema';

export async function getImages(db: SQLJsDatabase<typeof schema>) {
  return await db.select({
    id: images.id,
    name: images.name,
    contentType: images.contentType,
    createdAt: images.createdAt,
  }).from(images).orderBy(desc(images.createdAt));
}

export async function uploadImage(db: SQLJsDatabase<typeof schema>, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const result = await db.insert(images).values({
    name: file.name,
    contentType: file.type,
    data: data as any,
  }).returning();
  
  return result[0];
}

export async function deleteImage(db: SQLJsDatabase<typeof schema>, id: number) {
  await db.delete(images).where(eq(images.id, id));
}
