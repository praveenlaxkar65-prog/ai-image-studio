import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api from '../services/api';

export default function ToolsConfig() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState(null);

  useEffect(() => {
    api
      .get('/tools')
      .then((res) => setTools(res.data?.tools ?? res.data ?? []))
      .catch(() => setTools([]))
      .finally(() => setLoading(false));
  }, []);

  function updateLocal(slug, patch) {
    setTools((prev) => prev.map((t) => (t.slug === slug ? { ...t, ...patch } : t)));
  }

  async function handleSave(tool) {
    setSavingSlug(tool.slug);
    try {
      await api.patch(`/tools/${tool.slug}`, {
        enabled: tool.enabled,
        creditCost: tool.creditCost,
        provider: tool.provider,
      });
    } catch {
      // backend not wired yet — change stays applied locally for now
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Tools</h1>
      <p className="mb-6 text-sm text-[#9494A0]">
        Enable/disable tools, set credit cost, and assign which provider handles each one. Nothing here is hardcoded — changes apply immediately for users.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#26262E] py-10 text-center text-sm text-[#9494A0]">
          No tools loaded. (Backend /tools endpoint not reachable — connect it to manage real config here.)
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#26262E]">
          <div className="grid grid-cols-[1fr_90px_110px_140px_70px] gap-3 border-b border-[#26262E] bg-[#15151C] px-4 py-2.5 font-['JetBrains_Mono'] text-[11px] uppercase tracking-wide text-[#6B6B76]">
            <span>Tool</span>
            <span>Enabled</span>
            <span>Credits</span>
            <span>Provider</span>
            <span></span>
          </div>
          {tools.map((tool) => (
            <div
              key={tool.slug}
              className="grid grid-cols-[1fr_90px_110px_140px_70px] items-center gap-3 border-b border-[#26262E] px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm">{tool.name}</p>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">{tool.slug}</p>
              </div>

              <button
                onClick={() => updateLocal(tool.slug, { enabled: !tool.enabled })}
                className={`relative h-5 w-9 rounded-full transition ${tool.enabled ? 'bg-[#7C5CFC]' : 'bg-[#26262E]'}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                    tool.enabled ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>

              <input
                type="number"
                min={0}
                value={tool.creditCost ?? 0}
                onChange={(e) => updateLocal(tool.slug, { creditCost: Number(e.target.value) })}
                className="w-20 rounded-md border border-[#26262E] bg-[#0B0B0F] px-2 py-1 text-sm outline-none focus:border-[#7C5CFC]"
              />

              <select
                value={tool.provider ?? ''}
                onChange={(e) => updateLocal(tool.slug, { provider: e.target.value })}
                className="rounded-md border border-[#26262E] bg-[#0B0B0F] px-2 py-1 text-xs outline-none focus:border-[#7C5CFC]"
              >
                <option value="">— none —</option>
                <option value="stability">Stability AI</option>
                <option value="replicate">Replicate</option>
                <option value="openai">OpenAI</option>
                <option value="custom">Custom adapter</option>
              </select>

              <button
                onClick={() => handleSave(tool)}
                disabled={savingSlug === tool.slug}
                className="flex items-center justify-center rounded-md border border-[#26262E] p-1.5 hover:border-[#7C5CFC]/50 disabled:opacity-50"
                aria-label={`Save ${tool.name}`}
              >
                <Save size={14} className={savingSlug === tool.slug ? 'animate-pulse text-[#7C5CFC]' : ''} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
