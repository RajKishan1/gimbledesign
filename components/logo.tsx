import Link from "next/link";

const Logo = () => {
  return (
    <Link
      href="/"
      className="flex items-center gap-0.5 font-semibold text-xl tracking-tight text-foreground hover:opacity-90 transition-opacity"
    >
      <span>gimble</span>
      <span className="text-primary">.</span>
    </Link>
  );
};

export default Logo;
