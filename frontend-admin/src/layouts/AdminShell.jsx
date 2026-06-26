import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutGrid, Wrench, Cable, Tag, Database, ShieldAlert, Users, BarChart3, Settings, LogOut,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/providers', label: 'Providers', icon: Cable },
  { to: '/pricing', label: 'Pricing', icon: Tag },
  { to: '/storage', label: 'Storage', icon: Database },
  { to: '/moderation', label: 'Moderation', icon: ShieldAlert },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'System Settings', icon: Settings },
];

export default function AdminShell() {
  const { admin, logout } = useAdminAuth();

  return (
    <div className="flex min-h-screen bg-[#0B0B0F] text-[#F5F5F7]">
      <aside className="hidden w-60 flex-col border-r border-[#26262E] px-4 py-5 sm:flex">
        <Link to="/dashboard" className="mb-7 flex items-center gap-2.5 px-2">
          <ApertureMark />
          <div>
            <p className="font-['Space_Grotesk'] text-[15px] font-medium leading-tight tracking-tight">
              ai-image-studio
            </p>
            <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#7C5CFC]">
              Admin
            </p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-[#7C5CFC]/15 text-[#F5F5F7]' : 'text-[#9494A0] hover:bg-[#15151C] hover:text-[#F5F5F7]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={1.75} className={isActive ? 'text-[#7C5CFC]' : ''} />
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
          <LogOut size={16} strokeWidth={1.75} />
          Log out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#26262E] px-6 py-3.5">
          <span className="font-['JetBrains_Mono'] text-xs text-[#6B6B76]">Admin console</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C5CFC]/20 font-['Space_Grotesk'] text-xs font-medium text-[#7C5CFC]">
            {(admin?.name || admin?.email || '?').charAt(0).toUpperCase()}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ApertureMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="16" cy="16" r="15" stroke="#26262E" strokeWidth="1.5" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line key={deg} x1="16" y1="16" x2="16" y2="4" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" transform={`rotate(${deg} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="3" fill="#2DD4BF" />
    </svg>
  );
}
