export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main relative overflow-hidden px-4 py-12">
      
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}