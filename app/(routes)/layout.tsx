"use client";
import { usePathname } from "next/navigation";
import { ProfileProvider } from "@/context/profile-provider";

function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ProfileProvider is mounted once here so DashboardSection, NavBar,
  // DashboardSidebar (and any future consumer) share a single profile
  // subscription instead of each calling useGetProfile independently.
  // The landing page is full-bleed; sections manage their own max-widths.
  return (
    <ProfileProvider>
      <main className="w-full min-h-screen bg-background">
        <div className="flex flex-row min-h-screen justify-center">
          <div className="w-full">{children}</div>
        </div>
      </main>
    </ProfileProvider>
  );
}

export default AppLayout;
