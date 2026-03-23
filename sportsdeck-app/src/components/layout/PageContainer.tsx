"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col">
      
      {/* Navbar */}
      <Navbar />

      {/* MAIN CONTENT */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 gap-6">
        
        {/* LEFT SIDEBAR */}
        <aside className="hidden md:block w-64">
          <div className="bg-bg-surface border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm text-text-secondary">Navigation</p>

            <div className="space-y-2">
              <div className="p-2 rounded-lg hover:bg-bg-card cursor-pointer">
                Home
              </div>
              <div className="p-2 rounded-lg hover:bg-bg-card cursor-pointer">
                Following
              </div>
              <div className="p-2 rounded-lg hover:bg-bg-card cursor-pointer">
                Trending
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER FEED */}
        <main className="flex-1 max-w-3xl space-y-4">
          {children}
        </main>

        {/* RIGHT PANEL */}
        <aside className="hidden lg:block w-80 space-y-4">
          
          <div className="bg-bg-surface border border-border rounded-2xl p-4">
            <h3 className="font-semibold mb-2">Live Matches</h3>
            <p className="text-text-secondary text-sm">
              Live scores coming soon
            </p>
          </div>

          <div className="bg-bg-surface border border-border rounded-2xl p-4">
            <h3 className="font-semibold mb-2">Trending</h3>
            <p className="text-text-secondary text-sm">
              #Messi #NBA #UCL
            </p>
          </div>

        </aside>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}