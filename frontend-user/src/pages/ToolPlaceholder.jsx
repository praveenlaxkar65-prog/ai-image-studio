import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TOOL_CATEGORIES } from '../data/toolsConfig';

/**
 * TEMPORARY — replace with the real per-tool UI (upload + before/after preview
 * + adjust controls) when we build out individual tools. Kept so /tools links
 * don't 404 in the meantime.
 */
export default function ToolPlaceholder() {
  const { toolSlug } = useParams();
  const tool = TOOL_CATEGORIES.flatMap((c) => c.tools).find((t) => t.slug === toolSlug);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/tools" className="mb-6 flex items-center gap-1.5 text-xs text-[#9494A0] hover:text-[#F5F5F7]">
        <ArrowLeft size={13} /> All tools
      </Link>

      <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.15em] text-[#2DD4BF]">
        Tool — coming soon
      </p>
      <h1 className="mt-2 font-['Space_Grotesk'] text-2xl font-medium">
        {tool?.name ?? toolSlug}
      </h1>
      <p className="mt-2 text-sm text-[#9494A0]">
        {tool?.description ?? "This tool's editor UI hasn't been built yet."}
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#26262E] py-16 text-center">
        <p className="text-sm text-[#9494A0]">Upload + editor coming next.</p>
        <p className="text-xs text-[#6B6B76]">
          Or try{' '}
          <Link to="/prompt-studio" className="text-[#7C5CFC] hover:text-[#9580FD]">
            Prompt Studio
          </Link>{' '}
          for this edit right now.
        </p>
      </div>
    </div>
  );
}
