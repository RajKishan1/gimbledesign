"use client";
import { usePathname } from "next/navigation";

function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <main className="w-full min-h-screen bg-[#f9f9f9] dark:bg-black">
      <div className="flex flex-row min-h-screen justify-center">
        <div className={isLandingPage ? "max-w-300 w-full" : "w-full"}>
          {children}
        </div>
      </div>
    </main>
  );
}

export default AppLayout;
