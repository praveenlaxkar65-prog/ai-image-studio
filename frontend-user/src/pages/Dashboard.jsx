import React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, MessageSquareText, ArrowRight, ImageOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TOOL_CATEGORIES } from '../data/toolsConfig';

const QUICK_SLUGS = ['bg-remove', 'upscale', 'text-to-image', 'crop', 'inpaint', 'style-transfer'];

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/user/gallery', { params: { limit: 6 } })
      .then((res) => setProjects(res.data?.projects ?? res.data ?? []))
      .catch(() => setProjects([])) // backend not wired yet, or genuinely empty
      .finally(() => setProjectsLoading(false));
  }, []);

  const allTools = TOOL_CATEGORIES.flatMap((c) => c.tools);
  const quickTools = QUICK_SLUGS.map((slug) => allTools.find((t) => t.slug === slug)).filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Credit balance + Prompt Studio CTA */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#26262E] bg-[#15151C] p-5">
          <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.15em] text-[#6B6B76]">
            Credit balance
          </p>
          <p className="mt-2 font-['Space_Grotesk'] text-3xl font-medium">
            {user?.credits ?? 0}
          </p>
          <Link
            to="/wallet"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#7C5CFC] hover:text-[#9580FD]"
          >
            Buy more credits <ArrowRight size={13} />
          </Link>
        </div>

        <Link
          to="/prompt-studio"
          className="group relative overflow-hidden rounded-xl border border-[#26262E] bg-gradient-to-br from-[#1A1530] to-[#15151C] p-5 transition hover:border-[#7C5CFC]/50"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#7C5CFC]/20 blur-2xl transition group-hover:bg-[#7C5CFC]/30" />
          <MessageSquareText size={20} className="text-[#2DD4BF]" strokeWidth={1.75} />
          <p className="mt-3 font-['Space_Grotesk'] text-base font-medium">
            Open Prompt Studio
          </p>
          <p className="mt-1 text-xs text-[#9494A0]">
            Describe the edit you want in plain words — no tool-picking needed.
          </p>
        </Link>
      </div>

      {/* Quick tools */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">
            Quick tools
          </h2>
          <Link to="/tools" className="flex items-center gap-1 text-xs text-[#9494A0] hover:text-[#F5F5F7]">
            All tools <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickTools.map((tool) => (
            <Link
              key={tool.slug}
              to={`/tools/${tool.slug}`}
              className="group flex flex-col gap-1 rounded-lg border border-[#26262E] bg-[#15151C] p-4 transition hover:border-[#7C5CFC]/50"
            >
              <Wrench size={15} className="text-[#7C5CFC]" strokeWidth={1.75} />
              <span className="font-['Space_Grotesk'] text-sm font-medium">{tool.name}</span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">
                {tool.credits} credit{tool.credits > 1 ? 's' : ''}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <h2 className="mb-3 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">
          Recent projects
        </h2>

        {projectsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-[#15151C]" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#26262E] py-12 text-center">
            <ImageOff size={22} className="text-[#3a3a44]" strokeWidth={1.5} />
            <p className="text-sm text-[#9494A0]">No projects yet.</p>
            <Link to="/tools" className="text-xs font-medium text-[#7C5CFC] hover:text-[#9580FD]">
              Try a tool to get started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {projects.map((p) => (
              <div key={p.id} className="aspect-square overflow-hidden rounded-lg border border-[#26262E] bg-[#15151C]">
                <img src={p.thumbnailUrl || p.url} alt={p.name || 'Project'} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
