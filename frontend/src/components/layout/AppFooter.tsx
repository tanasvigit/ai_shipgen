function AppFooter() {
  return (
    <footer className="mt-auto px-8 py-4 border-t border-black/5 bg-[#f7f9fb]/80">
      <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
        <span>© {new Date().getFullYear()} ShipGen. All rights reserved.</span>
        <span>Built for AI-first logistics operations.</span>
      </div>
    </footer>
  )
}

export default AppFooter
