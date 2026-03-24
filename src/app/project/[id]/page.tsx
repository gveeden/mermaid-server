'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useDatabase } from '@/components/DatabaseProvider';
import { getProject } from '@/lib/client-actions';
import ProjectClient from './ProjectClient';
import { Project } from '@/db/schema';
import { Loader2 } from 'lucide-react';

export default function ProjectPage() {
  const { id } = useParams();
  const { db, isReady } = useDatabase();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && db && id) {
      const fetchProject = async () => {
        setLoading(true);
        const projectId = parseInt(id as string);
        if (isNaN(projectId)) {
          setLoading(false);
          return;
        }
        const p = await getProject(db, projectId);
        setProject(p || null);
        setLoading(false);
      };
      fetchProject();
    }
  }, [isReady, db, id]);

  if (!isReady || (loading && id)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-500 text-sm">Loading project...</p>
      </div>
    );
  }

  if (!project && !loading) {
    notFound();
  }

  return project ? <ProjectClient initialProject={project} /> : null;
}
