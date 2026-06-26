import React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, ImageOff, MessageSquareText } from 'lucide-react';
import api from '../services/api';

const FILTERS = ['All', 'Basic', 'Enhance', 'AI Edit', 'Generate', 'Convert'];

export default function Gallery() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  function fetchProjects() {
    setLoading(true);
    api
      .get('/user/gallery')
      .then((res) => setProjects(res.data?.projects ?? res.data ?? []))
      .catch(() => setProjects([])) // backend not wired yet, or genuinely empty
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return projects;
    return projects.filter((p) => (p.category || '').toLowerCase() === activeFilter.toLowerCase());
  }, [projects, activeFilter]);

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/user/gallery/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // backend not wired yet — remove optimistically anyway so the UI is testable
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-['Space_Grotesk'] text-xl font-medium">Gallery</h1>
      </div>
      <p className="mb-6 text-sm text-[#9494A0]">
        Everything you've created or edited. Files auto-delete after a set period unless saved — check{' '}
        <Link to="/settings" className="text-[#7C5CFC] hover:text-[#9580FD]">
          Settings
        </Link>
        .
      </p>

      {/* Filter chips */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              activeFilter === f
                ? 'border-[#7C5CFC] bg-[#7C5CFC]/15 text-[#F5F5F7]'
                : 'border-[#26262E] text-[#9494A0] hover:border-[#3a3a44] hover:text-[#F5F5F7]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#26262E] py-16 text-center">
          <ImageOff size={24} className="text-[#3a3a44]" strokeWidth={1.5} />
          <p className="text-sm text-[#9494A0]">
            {activeFilter === 'All' ? 'No projects yet.' : `No ${activeFilter} projects yet.`}
          </p>
          <div className="flex gap-3">
            <Link to="/tools" className="text-xs font-medium text-[#7C5CFC] hover:text-[#9580FD]">
              Browse tools
            </Link>
            <span className="text-xs text-[#3a3a44]">·</span>
            <Link to="/prompt-studio" className="text-xs font-medium text-[#7C5CFC] hover:text-[#9580FD]">
              Open Prompt Studio
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              deleting={deletingId === p.id}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, deleting, onDelete }) {
  const thumb = project.thumbnailUrl || project.url;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#26262E] bg-[#15151C]">
      <div className="aspect-square overflow-hidden">
        <img src={thumb} alt={project.name || 'Project'} className="h-full w-full object-cover" />
      </div>

      {/* hover actions overlay */}
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/0 via-black/0 to-black/70 opacity-0 transition group-hover:opacity-100">
        <div className="flex justify-end gap-1.5 p-2">
          <a
            href={project.url}
            download
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0B0B0F]/80 text-[#F5F5F7] hover:text-[#2DD4BF]"
            aria-label="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={13} />
          </a>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0B0B0F]/80 text-[#F5F5F7] hover:text-[#f08a96] disabled:opacity-50"
            aria-label="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div className="flex items-end justify-between p-2.5">
          <div className="min-w-0">
            <p className="truncate font-['JetBrains_Mono'] text-[10px] text-[#9494A0]">
              {project.toolName || project.category || 'Edit'}
            </p>
          </div>
          <Link
            to="/prompt-studio"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0B0B0F]/80 text-[#F5F5F7] hover:text-[#7C5CFC]"
            aria-label="Continue editing in Prompt Studio"
          >
            <MessageSquareText size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
