"use client";

export default function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-border mt-12">
      
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT - Brand */}
        <div>
          <h2 className="text-xl font-bold mb-2">SportsDeck</h2>
          <p className="text-text-secondary text-sm max-w-xs">
            Your personalized sports feed. Follow teams, track matches, and stay
            ahead with AI-powered insights.
          </p>
        </div>

        {/* CENTER - Links */}
        <div className="flex flex-col md:items-center">
          <h3 className="text-sm font-semibold mb-3 text-text-primary">
            Explore
          </h3>

          <div className="space-y-2 text-sm text-text-secondary">
            <p className="hover:text-primary-500 cursor-pointer transition">
              Home
            </p>
            <p className="hover:text-primary-500 cursor-pointer transition">
              Matches
            </p>
            <p className="hover:text-primary-500 cursor-pointer transition">
              Teams
            </p>
            <p className="hover:text-primary-500 cursor-pointer transition">
              Discussions
            </p>
          </div>
        </div>

        {/* RIGHT - Social / Extra */}
        <div className="md:text-right">
          <h3 className="text-sm font-semibold mb-3 text-text-primary">
            Connect
          </h3>

          <div className="flex md:justify-end gap-4 text-text-secondary text-lg">
            <span className="hover:text-primary-500 cursor-pointer transition">
              🐦
            </span>
            <span className="hover:text-primary-500 cursor-pointer transition">
              📸
            </span>
            <span className="hover:text-primary-500 cursor-pointer transition">
              💼
            </span>
          </div>

          <p className="text-xs text-text-muted mt-4">
            © {new Date().getFullYear()} SportsDeck. All rights reserved.
          </p>
        </div>
      </div>

      {/* Bottom subtle line */}
      <div className="text-center text-xs text-text-muted pb-4">
        Built with ⚡ for sports fans
      </div>
    </footer>
  );
}