export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-main text-text-primary p-8">
      <h1 className="text-3xl font-bold mb-6">SportsDeck Tailwind Test</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-primary-500 p-4 rounded-xl">Primary</div>
        <div className="bg-accent-500 p-4 rounded-xl">Accent</div>
        <div className="bg-brand-500 p-4 rounded-xl">Brand</div>
        <div className="bg-bg-card p-4 rounded-xl border">
          Card
        </div>
      </div>

      <div className="p-6 rounded-2xl shadow-lg mb-10 bg-[linear-gradient(135deg,#0EA5E9_0%,#06B6D4_100%)]">
        <p className="text-white font-semibold">Gradient working</p>
      </div>

      <div className="bg-bg-card border rounded-2xl shadow-lg p-6 mb-10">
        <h2 className="text-xl font-semibold mb-2">Card Component</h2>
        <p className="text-text-secondary">
          If this looks dark and styled, your Tailwind config is working.
        </p>
      </div>

      <button className="text-white px-6 py-3 rounded-xl font-medium transition bg-[linear-gradient(135deg,#0EA5E9_0%,#06B6D4_100%)]">
        Test Button
      </button>
    </main>
  );
}