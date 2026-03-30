type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-bg-card border rounded-2xl p-4 ${className}`}
    >
      {children}
    </div>
  );
}