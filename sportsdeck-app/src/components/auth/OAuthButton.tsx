interface OAuthButtonProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export default function OAuthButton({
  href,
  icon,
  children,
}: OAuthButtonProps) {
  return (
    <a
      href={href}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-elevated hover:bg-bg-glass transition hover:scale-[1.01] active:scale-[0.99] text-sm text-text-primary"
    >
      {icon}
      {children}
    </a>
  );
}