import type { NavItem, Screen } from '../../types'

interface SidebarProps {
  screen: Screen
  navItems: NavItem[]
  isSidebarCollapsed: boolean
  unresolvedAlertsCount: number
  onSelectScreen: (screen: Screen) => void
}

function Sidebar({
  screen,
  navItems,
  isSidebarCollapsed,
  unresolvedAlertsCount,
  onSelectScreen,
}: SidebarProps) {
  return (
    <aside
      className={`h-screen fixed left-0 top-0 z-50 bg-[#f2f4f6] flex flex-col p-4 gap-2 font-['Manrope'] font-medium transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`${isSidebarCollapsed ? 'mb-6 px-0' : 'mb-8 px-2'}`}>
        <img src="/logo.png" alt="ShipGen" className={`${isSidebarCollapsed ? 'h-8 mx-auto' : 'h-10'} w-auto object-contain`} />
        {!isSidebarCollapsed ? (
          <p className="mt-2 text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">Logistics Intelligence</p>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = screen === item.screen
          return (
            <button
              key={item.label}
              onClick={() => onSelectScreen(item.screen)}
              title={isSidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center px-3 py-2 rounded-md transition-all duration-200 ${
                isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
              } ${active ? 'bg-[#ffffff] text-[#0f172a] shadow-sm font-bold' : 'text-[#45464d] hover:text-[#0f172a] hover:bg-[#e0e3e5]'}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {!isSidebarCollapsed ? <span>{item.label}</span> : null}
            </button>
          )
        })}
      </nav>
      <div className={`mt-auto pt-6 border-t border-black/5 ${isSidebarCollapsed ? 'text-center' : 'space-y-2'}`}>
        {!isSidebarCollapsed ? <div className="text-[11px] text-on-surface-variant">Live polling every 5s</div> : null}
        <div className="text-[11px] text-on-surface-variant">Alerts: {unresolvedAlertsCount}</div>
      </div>
    </aside>
  )
}

export default Sidebar
