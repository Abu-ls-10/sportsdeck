type InputProps = {
  placeholder?: string;
  className?: string;
};

export default function Input({ placeholder, className = "" }: InputProps) {
  return (
    <input
      placeholder={placeholder}
      className={`bg-bg-card px-4 py-2 rounded-xl outline-none w-full ${className}`}
    />
  );
}