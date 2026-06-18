import type { NavItem, Screen } from '../../types'

interface SidebarProps {
  screen: Screen
  navItems: NavItem[]
  isSidebarCollapsed: boolean
  isSidebarOpen: boolean
  unresolvedAlertsCount: number
  onSelectScreen: (screen: Screen) => void
  onLogout: () => void
  sessionRole: string
  onCloseSidebar: () => void
}

function Sidebar({
  screen,
  navItems,
  isSidebarCollapsed,
  isSidebarOpen,
  unresolvedAlertsCount,
  onSelectScreen,
  onLogout,
  sessionRole,
  onCloseSidebar,
}: SidebarProps) {
  return (
    <aside
      id="app-sidebar"
      aria-label="Primary navigation"
      className={`h-screen fixed left-0 top-0 z-50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex flex-col p-3 gap-2 font-body font-medium transition-[transform,width] duration-300 ease-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 border-r border-white/20 dark:border-white/12 shadow-[0_16px_34px_rgba(15,23,42,0.22)]`}
      onClick={(event) => {
        if (!(event.target instanceof HTMLElement)) return
        if (event.target.closest('[data-close-sidebar]')) return
        if (window.matchMedia('(max-width: 1023px)').matches) onCloseSidebar()
      }}
    >
      <div className={`${isSidebarCollapsed ? 'mb-2 px-0' : 'mb-4 px-2'}`}>
        <img src="/logo.png" alt="ShipGen" className={`${isSidebarCollapsed ? 'h-8 mx-auto' : 'h-10'} w-auto object-contain`} />
        {!isSidebarCollapsed ? (
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-400">Logistics Intelligence</p>
        ) : null}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-slate-400/30 to-transparent mb-1" />
      {!isSidebarCollapsed ? <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Navigation</p> : null}
      <nav className="flex-1 space-y-2 pt-1" aria-label="Sidebar sections">
        {navItems.map((item) => {
          const active = screen === item.screen
          return (
            <div key={item.label} className="group relative">
              <button
                type="button"
                onClick={() => onSelectScreen(item.screen)}
                title={isSidebarCollapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`relative w-full flex items-center rounded-lg transition-all duration-200 ease-out border ${
                  isSidebarCollapsed ? 'justify-center h-10 px-2' : 'gap-2.5 h-11 px-3 text-left'
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  active
                    ? 'border-cyan-400/55 bg-gradient-to-r from-cyan-500/28 to-slate-700/65 text-slate-100 shadow-[0_10px_24px_rgba(14,165,233,0.20)] font-semibold'
                    : 'border-transparent bg-transparent text-slate-200 hover:border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                {active ? <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400" aria-hidden="true" /> : null}
                <span className={`material-symbols-outlined text-[20px] leading-none ${active ? 'text-cyan-200' : 'text-slate-300 group-hover:text-slate-100'}`} aria-hidden="true">
                  {item.icon}
                </span>
                {!isSidebarCollapsed ? <span className="text-[14px] leading-5">{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </button>
              {isSidebarCollapsed ? (
                <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#0f172a]/92 px-2 py-1 text-[11px] font-medium text-white shadow-lg backdrop-blur-sm group-hover:block group-focus-within:block">
                  {item.label}
                </span>
              ) : null}
            </div>
          )
        })}
      </nav>
      <div className="h-px bg-gradient-to-r from-transparent via-slate-400/30 to-transparent my-1" />
      <div className={`mt-auto pt-3 ${isSidebarCollapsed ? 'text-center space-y-2' : 'space-y-2.5'}`}>
        {!isSidebarCollapsed ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 space-y-1 text-[11px] text-slate-300 shadow-[0_8px_18px_rgba(15,23,42,0.16)]">
            <div className="flex items-center justify-between">
              <span>Role</span>
              <span className="font-semibold uppercase tracking-[0.05em] text-slate-100">{sessionRole}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Alerts</span>
              <span className="font-semibold text-slate-100">{unresolvedAlertsCount}</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] opacity-80">Live polling every 5s</div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-300">Alerts: {unresolvedAlertsCount}</div>
        )}
        <button
          type="button"
          onClick={onLogout}
          title={isSidebarCollapsed ? 'Logout' : undefined}
          className={`w-full rounded-xl border border-white/10 bg-white/10 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
            isSidebarCollapsed
              ? 'px-2 py-2 text-center text-[11px] text-slate-100 hover:bg-white/15'
              : 'px-3 py-2 text-left text-xs font-semibold text-slate-100 hover:bg-white/15'
          }`}
        >
          {isSidebarCollapsed ? '↩' : `Logout (${sessionRole})`}
        </button>
        <button
          type="button"
          data-close-sidebar
          onClick={onCloseSidebar}
          className="lg:hidden mt-2 w-full rounded-md border border-outline-variant/30 px-3 py-2 text-left text-xs font-semibold hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Close menu
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
