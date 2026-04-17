import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AppFooter from './AppFooter'
import type { NavItem, Screen } from '../../types'

interface AppLayoutProps {
  screen: Screen
  navItems: NavItem[]
  unresolvedAlertsCount: number
  onSelectScreen: (screen: Screen) => void
  children: ReactNode
}

function AppLayout({ screen, navItems, unresolvedAlertsCount, onSelectScreen, children }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="bg-surface text-on-surface min-h-screen overflow-x-hidden">
      <Sidebar
        screen={screen}
        navItems={navItems}
        isSidebarCollapsed={isSidebarCollapsed}
        unresolvedAlertsCount={unresolvedAlertsCount}
        onSelectScreen={onSelectScreen}
      />

      <main className={`min-h-screen flex flex-col transition-all duration-300 min-w-0 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <TopBar isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={() => setIsSidebarCollapsed((previous) => !previous)} />
        <div className="flex-1 min-w-0">{children}</div>
        <AppFooter />
      </main>
    </div>
  )
}

export default AppLayout
