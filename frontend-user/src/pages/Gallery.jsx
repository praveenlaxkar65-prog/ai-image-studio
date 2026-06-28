import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Trash2,
  ImageOff,
  MessageSquareText,
} from 'lucide-react';
import api from '../services/api';

export default function Gallery() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  function fetchProjects() {
    setLoading(true);

    api
      .get('/users/gallery')
      .then((res) => setProjects(res.data?.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }

  async function handleDelete(id) {
    setDeletingId(id);

    try {
      await api.delete(`/users/gallery/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">
        Gallery
      </h1>

      <p className="mb-6 text-sm text-[#9494A0]">
        Everything you've created or edited. Temporary files auto-delete unless
        saved.
      </p>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-[#15151C]"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#26262E] py-16 text-center">
          <ImageOff
            size={24}
            className="text-[#3a3a44]"
            strokeWidth={1.5}
          />

          <p className="text-sm text-[#9494A0]">No projects yet.</p>

          <div className="flex gap-3">
            <Link
              to="/tools"
              className="text-xs font-medium text-[#7C5CFC] hover:text-[#9580FD]"
            >
              Browse tools
            </Link>

            <span className="text-xs text-[#3a3a44]">·</span>

            <Link
              to="/prompt-studio"
              className="text-xs font-medium text-[#7C5CFC] hover:text-[#9580FD]"
            >
              Open Prompt Studio
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              deleting={deletingId === project.id}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, deleting, onDelete }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#26262E] bg-[#15151C]">
      <div className="aspect-square overflow-hidden">
        <img
          src={project.file_url}
          alt="Project"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/0 via-black/0 to-black/70 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex justify-end gap-1.5 p-2">
          <a
            href={project.file_url}
            download
            onClick={(e) => e.stopPropagation()}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0B0B0F]/80 text-[#F5F5F7] hover:text-[#2DD4BF]"
            aria-label="Download"
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
          <p className="truncate font-['JetBrains_Mono'] text-[10px] text-[#9494A0]">
            {project.file_type}
            {project.is_permanent ? ' · saved' : ''}
          </p>

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