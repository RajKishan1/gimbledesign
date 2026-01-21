"use client";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
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
  const { user } = useKindeBrowserClient();
  const { data: profile } = useGetProfile();
  const isDark = theme === "dark";

  // Use profile picture from database if available, otherwise fall back to Kinde
  const profilePicture = profile?.profilePicture || user?.picture || "";
  const displayName =
    profile?.name ||
    `${user?.given_name || ""} ${user?.family_name || ""}`.trim() ||
    "";
  return (
    <div className="sticky top-0 right-0 left-0 z-30  ">
      <header className="h-16 border-x border-zinc-900 px-6  py-4 bg-zinc-200 dark:bg-black">
        <div
          className="w-full max-w-6xl mx-auto
         flex items-center justify-between"
        >
          <Logo />

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
                      alt={displayName || user?.given_name || ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {displayName
                        ? displayName
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .join("")
                            .slice(0, 2)
                        : `${user?.given_name?.charAt(0) || ""}${user?.family_name?.charAt(0) || ""}`}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogoutLink className="w-full flex items-center">
                      <LogOutIcon className="size-4" />
                      Logout
                    </LogoutLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <LoginLink>
                <Button>Sign in</Button>
              </LoginLink>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
