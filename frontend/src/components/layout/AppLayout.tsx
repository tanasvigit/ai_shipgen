import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AppFooter from './AppFooter'
import type { NavItem, Screen } from '../../types'

const SIDEBAR_COLLAPSE_STORAGE_KEY = 'shipgen-sidebar-collapsed'

interface AppLayoutProps {
  screen: Screen
  navItems: NavItem[]
  unresolvedAlertsCount: number
  onSelectScreen: (screen: Screen) => void
  onLogout: () => void
  sessionRole: string
  children: ReactNode
}

function AppLayout({ screen, navItems, unresolvedAlertsCount, onSelectScreen, onLogout, sessionRole, children }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY)
    return stored === '1'
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, isSidebarCollapsed ? '1' : '0')
  }, [isSidebarCollapsed])

  useEffect(() => {
    if (!isSidebarOpen) return
    function onEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  function handleSelectScreen(nextScreen: Screen) {
    onSelectScreen(nextScreen)
    setIsSidebarOpen(false)
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen overflow-x-hidden">
      {isSidebarOpen ? <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} /> : null}

      <Sidebar
        screen={screen}
        navItems={navItems}
        isSidebarCollapsed={isSidebarCollapsed}
        isSidebarOpen={isSidebarOpen}
        unresolvedAlertsCount={unresolvedAlertsCount}
        onSelectScreen={handleSelectScreen}
        onLogout={onLogout}
        sessionRole={sessionRole}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      <main className={`min-h-screen flex flex-col transition-all duration-300 min-w-0 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <TopBar
          isSidebarCollapsed={isSidebarCollapsed}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => {
            if (window.matchMedia('(min-width: 1024px)').matches) {
              setIsSidebarCollapsed((previous) => !previous)
              return
            }
            setIsSidebarOpen((previous) => !previous)
          }}
          onLogout={onLogout}
          sessionRole={sessionRole}
        />
        <div className="flex-1 min-w-0">{children}</div>
        <AppFooter />
      </main>
    </div>
  )
}

export default AppLayout
