interface TopBarProps {
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
}

function TopBar({ isSidebarCollapsed, onToggleSidebar }: TopBarProps) {
  return (
    <header className="sticky top-0 w-full z-40 h-16 bg-[#f7f9fb]/70 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] font-['Manrope'] text-sm tracking-wide min-w-0">
      <div className="flex items-center gap-4 sm:gap-8 min-w-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="w-8 h-8 rounded-md bg-white border border-black/10 hover:bg-surface-container-low flex items-center justify-center"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-[18px]">{isSidebarCollapsed ? 'menu_open' : 'menu'}</span>
          </button>
          <span className="font-black text-base sm:text-lg tracking-tight text-[#000000] whitespace-nowrap">ShipGen AI</span>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-on-tertiary-container/10 rounded-full border border-on-tertiary-container/20">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse" />
            <span className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-tight">AI Mode Active</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
