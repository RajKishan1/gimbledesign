import Link from "next/link";

const Logo = () => {
  return (
    <Link
      href="/"
      className="flex-1 text-black dark:text-white flex items-center gap-1 "
    >
      <span className="font-semibold text-[21px] leading-[1.2em] tracking-[-0.03em]">Gimble</span>
    </Link>
  );
};

export default Logo;
