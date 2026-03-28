"use client";

interface ButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  type?: "button" | "submit";
}

export default function Button({
  children,
  loading,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={loading}
      className="w-full py-2.5 rounded-xl bg-gradient-primary text-white font-medium shadow-glow hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}