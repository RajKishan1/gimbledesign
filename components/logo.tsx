import Link from "next/link";

const Logo = () => {
  return (
    <Link
      href="/"
      className="flex-1 text-black dark:text-white flex items-center gap-1 text-xl"
    >
      <span className="font-medium text-foreground">Gimble</span>
    </Link>
  );
};

export default Logo;
