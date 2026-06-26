import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ImagePlus, Sparkles, X } from 'lucide-react';
import api from '../services/api';

let _id = 0;
const nextId = () => `m${++_id}`;

const PROCESSING_STAGES = ['Reading your prompt…', 'Locating the subject…', 'Applying the edit…', 'Rendering result…'];

export default function PromptStudio() {
  const [messages, setMessages] = useState([
    {
      id: nextId(),
      role: 'assistant',
      text: "Upload an image and tell me what to change — e.g. \"remove the background\" or \"make this look like an old film photo.\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [sourceImage, setSourceImage] = useState(null); // { url, file }
  const [resultImage, setResultImage] = useState(null); // url shown on canvas after "processing"
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Cycle the decorative stage labels while a job is "processing"
  useEffect(() => {
    if (!isProcessing) return;
    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, PROCESSING_STAGES.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceImage({ url: URL.createObjectURL(file), file });
    setResultImage(null);
  };

  const handleSend = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isProcessing) return;

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: prompt }]);
    setInput('');
    setIsProcessing(true);

    try {
      // Real path — once the agentic layer / job queue is wired up, this
      // returns either an immediate result or a jobId to poll.
      const form = new FormData();
      form.append('prompt', prompt);
      if (sourceImage?.file) form.append('image', sourceImage.file);

      const res = await api.post('/prompt-studio/command', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const resultUrl = res.data?.resultUrl ?? res.data?.url;
      setResultImage(resultUrl || sourceImage?.url || null);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: res.data?.message || 'Done — here\'s the result.' },
      ]);
    } catch {
      // Backend not wired up yet — fall back to a decorative simulated pass
      // so the flow still feels alive. Swap this branch out once the real
      // job pipeline responds.
      await new Promise((r) => setTimeout(r, PROCESSING_STAGES.length * 900));
      setResultImage(sourceImage?.url || null);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          text: sourceImage
            ? "Here's a preview. (Backend not connected yet — this is a simulated pass.)"
            : 'Upload an image first so I have something to edit.',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing, sourceImage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col sm:flex-row">
      {/* CHAT COLUMN */}
      <div className="flex w-full flex-col border-b border-[#26262E] sm:w-[380px] sm:border-b-0 sm:border-r">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-[#7C5CFC] text-white'
                  : 'border border-[#26262E] bg-[#15151C] text-[#E4E4E8]'
              }`}
            >
              {m.text}
            </div>
          ))}

          {isProcessing && (
            <div className="flex max-w-[90%] items-center gap-2 rounded-xl border border-[#26262E] bg-[#15151C] px-3.5 py-2.5 text-sm text-[#9494A0]">
              <span className="flex gap-1">
                <Dot delay={0} /> <Dot delay={150} /> <Dot delay={300} />
              </span>
              {PROCESSING_STAGES[stageIndex]}
            </div>
          )}
        </div>

        {/* source image chip */}
        {sourceImage && (
          <div className="flex items-center gap-2 border-t border-[#26262E] px-5 py-2.5">
            <img src={sourceImage.url} alt="Source" className="h-8 w-8 rounded object-cover" />
            <span className="text-xs text-[#9494A0]">Attached</span>
            <button
              onClick={() => setSourceImage(null)}
              className="ml-auto text-[#6B6B76] hover:text-[#F5F5F7]"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* input */}
        <div className="flex items-end gap-2 border-t border-[#26262E] p-3">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#26262E] text-[#9494A0] hover:border-[#7C5CFC]/50 hover:text-[#F5F5F7]"
            aria-label="Attach image"
          >
            <ImagePlus size={16} strokeWidth={1.75} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the edit you want…"
            rows={1}
            className="max-h-28 flex-1 resize-none rounded-lg border border-[#26262E] bg-[#15151C] px-3 py-2 text-sm outline-none placeholder:text-[#5A5A64] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7C5CFC] text-white transition hover:bg-[#8E72FD] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* CANVAS COLUMN */}
      <div className="relative flex flex-1 items-center justify-center bg-[#070708] p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(#7C5CFC 1px, transparent 1px), linear-gradient(90deg, #7C5CFC 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {!sourceImage && !resultImage ? (
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <Sparkles size={26} className="text-[#3a3a44]" strokeWidth={1.5} />
            <p className="text-sm text-[#6B6B76]">Your canvas will appear here.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#26262E] bg-[#15151C] px-3.5 py-2 text-xs font-medium hover:border-[#7C5CFC]/50"
            >
              Upload an image
            </button>
          </div>
        ) : (
          <div className="relative z-10 max-h-full max-w-full overflow-hidden rounded-xl border border-[#26262E]">
            <img
              src={resultImage || sourceImage.url}
              alt="Canvas"
              className="block max-h-[70vh] max-w-full object-contain"
            />
            {isProcessing && <ProcessingOverlay />}
          </div>
        )}
      </div>
    </div>
  );
}

/** Decorative scan-line sweep shown over the canvas while a job is "processing". Purely visual. */
function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0B0B0F]/40" />
      <div
        className="absolute left-0 h-1/3 w-full bg-gradient-to-b from-transparent via-[#7C5CFC]/40 to-transparent"
        style={{ animation: 'scan-sweep 1.8s ease-in-out infinite' }}
      />
      <style>{`
        @keyframes scan-sweep {
          0%   { top: -10%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-[#7C5CFC]"
      style={{ animation: `dot-pulse 1s ease-in-out ${delay}ms infinite` }}
    >
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1); }
        }
      `}</style>
    </span>
  );
}
