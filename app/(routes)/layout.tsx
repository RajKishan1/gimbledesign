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
      <div className="flex flex-row min-h-screen">
        {isLandingPage && (
          <div
            className="
              flex-1
              bg-[repeating-linear-gradient(25deg,#ede6f5,#ede6f5_1px,#f9f9f9_1px,#f9f9f9_12px)]
              dark:bg-[repeating-linear-gradient(25deg,#111111,#111111_1px,#000000_1px,#000000_12px)]
            "
          />
        )}
        <div className={isLandingPage ? "max-w-7xl w-full" : "w-full"}>
          {children}
        </div>
        {isLandingPage && (
          <div
            className="
              flex-1
              bg-[repeating-linear-gradient(25deg,#ede6f5,#ede6f5_1px,#f9f9f9_1px,#f9f9f9_12px)]
              dark:bg-[repeating-linear-gradient(25deg,#111111,#111111_1px,#000000_1px,#000000_12px)]
            "
          />
        )}
      </div>
    </main>
  );
}

export default AppLayout;