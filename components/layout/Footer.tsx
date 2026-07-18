export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} FreelanceGuard. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="https://github.com/tranhop26/freelanceguard" target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors">
              GitHub
            </a>
            <a href="https://arc.network" target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors">
              Arc Network
            </a>
            <a href="https://circle.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors">
              Circle Pay
            </a>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
            🛡️ Programmable Money Hackathon 2026
          </div>
        </div>
      </div>
    </footer>
  );
}
