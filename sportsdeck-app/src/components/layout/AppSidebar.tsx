import {
  House,
  Trophy,
  Users,
  MessageSquareText,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Home", icon: House, active: false },
  { label: "Leagues", icon: Trophy, active: false },
  { label: "Teams", icon: Users, active: false },
  { label: "Forums", icon: MessageSquareText, active: true },
  { label: "Settings", icon: Settings, active: false },
];

export default function AppSidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col w-[240px] min-h-screen bg-bg-surface border-r border-border-subtle">
      <div>
        <div className="px-4 pb-6 pt-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow">
              <span className="text-sm font-bold text-white">S</span>
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                SportsDeck
              </p>
              <p className="text-[11px] text-text-muted">Team Hub</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  item.active
                    ? "bg-primary-500/15 text-primary-400"
                    : "text-text-secondary hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-3 pb-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
          <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-text-muted">
            Your Teams
          </p>

          <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-2 py-2">
            <div className="h-6 w-6 rounded-full bg-sky-300" />
            <span className="text-sm text-text-primary">Man City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}