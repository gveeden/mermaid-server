import ProjectClient from './ProjectClient';

// This page is now a simple static page that uses client-side search params 
// to load the correct project from the local SQLite database.
export default function ProjectPage() {
  return <ProjectClient />;
}
