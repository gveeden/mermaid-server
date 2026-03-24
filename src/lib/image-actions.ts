'use server';

import { db } from '@/db';
import { images } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getImages() {
  // Select everything except the large data blob for listing
  return await db.select({
    id: images.id,
    name: images.name,
    contentType: images.contentType,
    createdAt: images.createdAt,
  }).from(images).orderBy(desc(images.createdAt));
}

export async function uploadImage(formData: FormData) {
  const file = formData.get('image') as File;
  if (!file) throw new Error('No image provided');

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await db.insert(images).values({
    name: file.name,
    contentType: file.type,
    data: buffer,
  });

  revalidatePath('/');
}

export async function deleteImage(id: number) {
  await db.delete(images).where(eq(images.id, id));
  revalidatePath('/');
}
