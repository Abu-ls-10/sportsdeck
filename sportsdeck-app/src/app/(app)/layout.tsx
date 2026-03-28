import AppSidebar from "@/components/layout/AppSidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-bg-main text-text-primary">
      
      {/* Sidebar */}
      <AppSidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col">
        
        {/* Content */}
        <main className="flex-1 px-6 py-6 overflow-x-hidden">
          {children}
        </main>

      </div>
    </div>
  );
}