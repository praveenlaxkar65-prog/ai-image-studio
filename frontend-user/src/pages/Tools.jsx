import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { TOOL_CATEGORIES as FALLBACK_CATEGORIES } from '../data/toolsConfig';

export default function Tools() {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [usingFallback, setUsingFallback] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/tools') // expected to mirror admin-configured tools_config table
      .then((res) => {
        const data = res.data?.categories ?? res.data;
        if (Array.isArray(data) && data.length) {
          setCategories(data);
          setUsingFallback(false);
        }
      })
      .catch(() => {
        // backend not reachable yet — keep local fallback list, no error shown to user
      });
  }, []);

  const filtered = categories
    .map((cat) => ({
      ...cat,
      tools: cat.tools.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.tools.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-['Space_Grotesk'] text-xl font-medium">All tools</h1>
          <p className="mt-1 text-sm text-[#9494A0]">
            Pick a tool, or describe what you want in{' '}
            <Link to="/prompt-studio" className="text-[#7C5CFC] hover:text-[#9580FD]">
              Prompt Studio
            </Link>{' '}
            instead.
          </p>
        </div>
        {usingFallback && (
          <span className="hidden font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-[#5A5A64] sm:block">
            local config
          </span>
        )}
      </div>

      <div className="relative mb-8">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B76]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools…"
          className="w-full rounded-lg border border-[#26262E] bg-[#15151C] py-2.5 pl-9 pr-3.5 text-sm outline-none placeholder:text-[#5A5A64] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#9494A0]">No tools match "{query}".</p>
      ) : (
        filtered.map((cat) => (
          <section key={cat.id} className="mb-9">
            <h2 className="mb-3 font-['JetBrains_Mono'] text-xs uppercase tracking-[0.15em] text-[#2DD4BF]">
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cat.tools.map((tool) => (
                <Link
                  key={tool.slug}
                  to={`/tools/${tool.slug}`}
                  className="group flex items-start justify-between gap-3 rounded-lg border border-[#26262E] bg-[#15151C] p-4 transition hover:border-[#7C5CFC]/50"
                >
                  <div>
                    <p className="font-['Space_Grotesk'] text-sm font-medium">{tool.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#9494A0]">{tool.description}</p>
                    <span className="mt-2 inline-block font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">
                      {tool.credits} credit{tool.credits > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ArrowRight
                    size={15}
                    className="mt-0.5 shrink-0 text-[#3a3a44] transition group-hover:translate-x-0.5 group-hover:text-[#7C5CFC]"
                  />
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
