import type { Metadata } from "next";
import "./globals.css";
import { openSauceOne } from "./fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/context/query-provider";

export const metadata: Metadata = {
  title: "Gimble — AI Mobile & Web Design Agent",
  description:
    "Describe what you want, and Gimble handles the rest. Generate polished mobile & web app designs from a single prompt, edit through chat, and export to Figma or code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={openSauceOne.variable} suppressHydrationWarning>
      <body className={`${openSauceOne.className} antialiased bg-[#f9f9f9] dark:bg-black`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="bottom-center" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
