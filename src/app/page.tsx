import { redirect } from 'next/navigation';
import { getProjects, createProject } from '@/lib/actions';
import { Plus, FileCode } from 'lucide-react';

export default async function Home() {
  const projects = await getProjects();

  if (projects.length > 0) {
    redirect(`/project/${projects[0].id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-8">
      <div className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileCode className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
        <p className="text-gray-500 mb-8">
          Create your first Mermaid diagram and start visualizing your ideas.
        </p>
        
        <form action={async () => {
          'use server';
          await createProject();
        }}>
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Create First Project
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm font-mono uppercase tracking-widest">
        SQLite Powered Persistence
      </p>
    </div>
  );
}
