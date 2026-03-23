type ButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Button({ children, className = "" }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-primary-500 text-white hover:opacity-90 transition ${className}`}
    >
      {children}
    </button>
  );
}