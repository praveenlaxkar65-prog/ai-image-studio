import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutGrid, Wrench, MessageSquareText, Image as ImageIcon, Wallet, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/prompt-studio', label: 'Prompt Studio', icon: MessageSquareText },
  { to: '/gallery', label: 'Gallery', icon: ImageIcon },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const credits = user?.credits ?? 0;

  return (
    <div className="flex min-h-screen bg-[#0B0B0F] text-[#F5F5F7]">
      {/* SIDEBAR */}
      <aside className="hidden w-60 flex-col border-r border-[#26262E] px-4 py-5 sm:flex">
        <Link to="/dashboard" className="mb-7 flex items-center gap-2.5 px-2">
          <ApertureMark />
          <span className="font-['Space_Grotesk'] text-[15px] font-medium tracking-tight">
            ai-image-studio
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-[#7C5CFC]/15 text-[#F5F5F7]'
                    : 'text-[#9494A0] hover:bg-[#15151C] hover:text-[#F5F5F7]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={1.75} className={isActive ? 'text-[#7C5CFC]' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#9494A0] transition hover:bg-[#15151C] hover:text-[#F5F5F7]"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Log out
        </button>
      </aside>

      {/* MAIN COLUMN */}
      <div className="flex flex-1 flex-col">
        {/* TOPBAR */}
        <header className="flex items-center justify-between border-b border-[#26262E] px-6 py-3.5">
          <span className="font-['JetBrains_Mono'] text-xs text-[#6B6B76]">
            {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </span>

          <div className="flex items-center gap-3">
            <Link
              to="/wallet"
              className="flex items-center gap-2 rounded-full border border-[#26262E] bg-[#15151C] px-3 py-1.5 text-xs hover:border-[#2DD4BF]/50"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" />
              <span className="font-['JetBrains_Mono']">{credits}</span>
              <span className="text-[#9494A0]">credits</span>
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C5CFC]/20 font-['Space_Grotesk'] text-xs font-medium text-[#7C5CFC]">
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ApertureMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="16" cy="16" r="15" stroke="#26262E" strokeWidth="1.5" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="16" y1="16" x2="16" y2="4"
          stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="3" fill="#2DD4BF" />
    </svg>
  );
}
