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
            className="flex-1"
            style={{
              backgroundImage:
                "repeating-linear-gradient(25deg, #111111, #111111 1px, #000 1px, #000 12px)",
            }}
          ></div>
        )}
        <div className={isLandingPage ? "max-w-7xl w-full" : "w-full"}>
          {children}
        </div>
        {isLandingPage && (
          <div
            className="flex-1"
            style={{
              backgroundImage:
                "repeating-linear-gradient(25deg, #111111, #111111 1px, #000 1px, #000 12px)",
            }}
          ></div>
        )}
      </div>
    </main>
  );
}
export default AppLayout;
