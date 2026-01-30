"use client";

import Lines from "@/components/landing/atoms/Lines";
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
      <div className="flex flex-row min-h-screen">
        {isLandingPage && <Lines />}
        <div className={isLandingPage ? "max-w-7xl w-full" : "w-full"}>
          {children}
        </div>
        {isLandingPage && <Lines />}
      </div>
    </main>
  );
}

export default AppLayout;
