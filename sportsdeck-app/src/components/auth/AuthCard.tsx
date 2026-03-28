export default function AuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-card backdrop-blur-xs p-6">
      {children}
    </div>
  );
}