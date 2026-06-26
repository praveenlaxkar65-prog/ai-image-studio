import { Link } from 'react-router-dom';

/**
 * Shared shell for Login / Signup.
 * Left panel = brand/visual story (the "studio" feel).
 * Right panel = the actual form, passed in as children.
 */
export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen w-full bg-[#0B0B0F] text-[#F5F5F7]">
      {/* LEFT — brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-[#26262E] px-12 py-10 lg:flex">
        {/* faint scan-grid texture, suggests image-processing */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#7C5CFC 1px, transparent 1px), linear-gradient(90deg, #7C5CFC 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        {/* ambient gradient glow */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#7C5CFC]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[#2DD4BF]/15 blur-3xl" />

        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <ApertureMark />
          <span className="font-['Space_Grotesk'] text-lg font-medium tracking-tight">
            ai-image-studio
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="mb-4 font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#2DD4BF]">
            {eyebrow}
          </p>
          <h1 className="font-['Space_Grotesk'] text-4xl font-medium leading-[1.15] tracking-tight">
            {title}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#9494A0]">{subtitle}</p>
        </div>

        <div className="relative z-10 flex items-center gap-6 font-['JetBrains_Mono'] text-xs text-[#6B6B76]">
          <span>23 tools</span>
          <span className="h-1 w-1 rounded-full bg-[#26262E]" />
          <span>credit-based</span>
          <span className="h-1 w-1 rounded-full bg-[#26262E]" />
          <span>prompt studio</span>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* mobile-only brand mark */}
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <ApertureMark size={28} />
            <span className="font-['Space_Grotesk'] text-base font-medium tracking-tight">
              ai-image-studio
            </span>
          </Link>

          {children}

          {footer && <div className="mt-8 text-center text-sm text-[#9494A0]">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/** The signature element — an aperture/iris mark that "focuses" on mount. */
function ApertureMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" stroke="#26262E" strokeWidth="1.5" />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <line
          key={deg}
          x1="16"
          y1="16"
          x2="16"
          y2="4"
          stroke="#7C5CFC"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 16 16)`}
          style={{
            transformOrigin: '16px 16px',
            animation: `blade-close 900ms ease-out ${i * 60}ms both`,
          }}
        />
      ))}
      <circle cx="16" cy="16" r="3" fill="#2DD4BF" />
      <style>{`
        @keyframes blade-close {
          0%   { transform: rotate(${0}deg) scaleY(0.3); opacity: 0; }
          100% { transform: rotate(0deg) scaleY(1); opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
