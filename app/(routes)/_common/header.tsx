"use client";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetProfile } from "@/features/use-profile";

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data: profile } = useGetProfile();
  const isDark = theme === "dark";

  const profilePicture = profile?.profilePicture || user?.image || "";
  const displayName = profile?.name || user?.name || "";
  return (
    <div className="max-h-20.5 sticky top-0 right-0 left-0 z-30  border-b border-black/5  dark:border-zinc-900 ">
      <header className=" px-6  p-4 bg-[#f9f9f9] dark:bg-black">
        <div
          className="w-full max-w-6xl mx-auto
         flex items-center justify-between"
        >
          <Logo />
          <nav className="flex gap-6 items-center text-black/80 font-medium tex   t-sm leading-[1.55em]">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="text-sm font-medium text-foreground hover:opacity-80 transition-opacity"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/Pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </nav>
          <div
            className="flex flex-1 items-center
           justify-end gap-3

          "
          >
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full h-8 w-8"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              <SunIcon
                className={cn(
                  "absolute h-5 w-5 transition",
                  isDark ? "scale-100" : "scale-0"
                )}
              />
              <MoonIcon
                className={cn(
                  "absolute h-5 w-5 transition",
                  isDark ? "scale-0" : "scale-100"
                )}
              />
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar
                    className="h-8 w-8
                  shrink-0 rounded-full"
                  >
                    <AvatarImage
                      src={profilePicture}
                      alt={displayName || user?.name || ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {displayName
                        ? displayName
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .join("")
                            .slice(0, 2)
                        : user?.name?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="w-full flex items-center cursor-pointer"
                    onClick={() => authClient.signOut()}
                  >
                    <LogOutIcon className="size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button className="rounded-full bg-[#6248ff]" asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
