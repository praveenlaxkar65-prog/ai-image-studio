import React from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Download } from 'lucide-react';
import { TOOL_CATEGORIES } from '../data/toolsConfig';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const WORKING_TOOLS = {
  crop:        { apiPath: 'crop',             fields: ['x', 'y', 'width', 'height'] },
  resize:      { apiPath: 'resize',           fields: ['width', 'height'] },
  compress:    { apiPath: 'compress',         fields: ['quality'] },
  'bg-remove': { apiPath: 'bg-remove',        fields: [] },
  color:       { apiPath: 'color-correction', fields: ['brightness', 'contrast', 'saturation'] },
  filter:      { apiPath: 'filter',           fields: [], filterSelect: true },
  sharpen:     { apiPath: 'sharpen',          fields: ['intensity'] },
  noise:       { apiPath: 'noise-reduction',  fields: [] },
  'file-format': { apiPath: 'convert', fields: ['quality'], formatSelect: true },
};

export default function ToolPlaceholder() {
  const { toolSlug } = useParams();
  const tool = TOOL_CATEGORIES.flatMap((c) => c.tools).find((t) => t.slug === toolSlug);
  if (WORKING_TOOLS[toolSlug]) {
    return <ToolRunner toolSlug={toolSlug} tool={tool} config={WORKING_TOOLS[toolSlug]} />;
  }
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/tools" className="mb-6 flex items-center gap-1.5 text-xs text-[#9494A0] hover:text-[#F5F5F7]">
        <ArrowLeft size={13} /> All tools
      </Link>
      <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.15em] text-[#2DD4BF]">Tool — coming soon</p>
      <h1 className="mt-2 font-['Space_Grotesk'] text-2xl font-medium">{tool?.name ?? toolSlug}</h1>
      <p className="mt-2 text-sm text-[#9494A0]">{tool?.description ?? "This tool's editor UI hasn't been built yet."}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#26262E] py-16 text-center">
        <p className="text-sm text-[#9494A0]">This tool needs an AI provider connected — coming in a later phase.</p>
      </div>
    </div>
  );
}

function ToolRunner({ toolSlug, tool, config }) {
  const { setUser } = useAuth();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [params, setParams] = useState({ x: 0, y: 0, width: 300, height: 300, quality: 80, brightness: 0, contrast: 0, saturation: 0, intensity: 5 });
  const [filterType, setFilterType] = useState('grayscale');
  const [targetFormat, setTargetFormat] = useState('webp');
  const [status, setStatus] = useState('idle');
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setErrorMsg('');
  }

  function fileToBase64(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function handleRun() {
    if (!file) return;
    setErrorMsg('');
    setResultUrl(null);
    try {
      setStatus('uploading');
      const imageBase64 = await fileToBase64(file);
      const uploadRes = await api.post('/users/upload', { imageBase64, fileName: file.name });
      const imageUrl = uploadRes.data?.url;
      setStatus('processing');
      const body = { imageUrl };
      config.fields.forEach((f) => { body[f] = Number(params[f]); });
      if (toolSlug === 'compress') body.format = 'jpeg';
      if (config.filterSelect) body.filterType = filterType;
      if (config.formatSelect) body.targetFormat = targetFormat;
      const res = await api.post('/tools/' + config.apiPath, body);
      setResultUrl(res.data?.resultUrl);
      if (res.data?.newBalance !== undefined) setUser((prev) => ({ ...prev, credits: res.data.newBalance }));
      setStatus('done');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      if (err.response?.status === 402) setErrorMsg('Insufficient credits — you have ' + err.response.data.available + ', need ' + err.response.data.required + '.');
      else if (err.response?.status === 404) setErrorMsg(msg + ' (Admin needs to add this tool first.)');
      else setErrorMsg(msg);
      setStatus('idle');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/tools" className="mb-6 flex items-center gap-1.5 text-xs text-[#9494A0] hover:text-[#F5F5F7]">
        <ArrowLeft size={13} /> All tools
      </Link>
      <h1 className="font-['Space_Grotesk'] text-2xl font-medium">{tool?.name ?? toolSlug}</h1>
      <p className="mt-1 mb-6 text-sm text-[#9494A0]">{tool?.description}</p>
      {!previewUrl ? (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#26262E] py-16 text-center hover:border-[#7C5CFC]/50">
          <Upload size={22} className="text-[#3a3a44]" strokeWidth={1.5} />
          <span className="text-sm text-[#9494A0]">Click to upload an image</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <div className="space-y-4">
          <img src={previewUrl} alt="Preview" className="max-h-80 w-full rounded-xl border border-[#26262E] object-contain" />
          {config.fields.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {config.fields.map((f) => (
                <label key={f} className="block">
                  <span className="mb-1 block text-xs font-medium text-[#9494A0] capitalize">{f}</span>
                  <input type="number" value={params[f]} onChange={(e) => setParams((p) => ({ ...p, [f]: e.target.value }))} className="w-full rounded-lg border border-[#26262E] bg-[#15151C] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]" />
                </label>
              ))}
            </div>
          )}
          {config.filterSelect && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#9494A0]">Filter Type</span>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full rounded-lg border border-[#26262E] bg-[#15151C] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]">
                <option value="grayscale">Grayscale</option>
                <option value="sepia">Sepia</option>
                <option value="vintage">Vintage</option>
                <option value="vivid">Vivid</option>
              </select>
            </label>
          )}
          {config.formatSelect && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#9494A0]">Target Format</span>
              <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)} className="w-full rounded-lg border border-[#26262E] bg-[#15151C] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]">
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
                <option value="avif">AVIF</option>
              </select>
            </label>
          )}
          {errorMsg && <p className="rounded-lg border border-[#3a1f24] bg-[#1c1216] px-3 py-2 text-sm text-[#f08a96]">{errorMsg}</p>}
          <div className="flex items-center gap-3">
            <button onClick={handleRun} disabled={status === 'uploading' || status === 'processing'} className="rounded-lg bg-[#7C5CFC] px-4 py-2 text-sm font-medium text-white hover:bg-[#8E72FD] disabled:opacity-60">
              {status === 'uploading' ? 'Uploading...' : status === 'processing' ? 'Processing...' : 'Run'}
            </button>
            <button onClick={() => { setFile(null); setPreviewUrl(null); setResultUrl(null); setErrorMsg(''); setStatus('idle'); }} className="rounded-lg border border-[#26262E] px-4 py-2 text-sm hover:border-[#7C5CFC]/50">
              Choose different image
            </button>
          </div>
          {resultUrl && (
            <div className="space-y-2">
              <p className="text-xs text-[#9494A0]">Result:</p>
              <img src={resultUrl} alt="Result" className="max-h-80 w-full rounded-xl border border-[#26262E] object-contain" />
              <a href={resultUrl} download className="inline-flex items-center gap-1.5 rounded-lg border border-[#26262E] px-3 py-1.5 text-xs hover:border-[#2DD4BF]/50 hover:text-[#2DD4BF]">
                <Download size={13} /> Download
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
