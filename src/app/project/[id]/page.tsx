import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions';
import ProjectClient from './ProjectClient';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  
  if (isNaN(projectId)) {
    notFound();
  }

  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return <ProjectClient initialProject={project} />;
}
