import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0B0B0F] text-center text-[#F5F5F7]">
      <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-[#2DD4BF]">
        404
      </p>
      <h1 className="font-['Space_Grotesk'] text-2xl font-medium">
        This page didn't render.
      </h1>
      <p className="max-w-sm text-sm text-[#9494A0]">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-[#7C5CFC] px-4 py-2 text-sm font-medium text-white hover:bg-[#8E72FD]"
      >
        Back to home
      </Link>
    </div>
  );
}
