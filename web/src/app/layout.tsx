import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import { UrlToastListener } from "@/components/UrlToastListener";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grayjay + Stremio Plugin",
  description: "Configure your TMDB API Key and Stremio Addons to watch your favorite movies and shows directly in Grayjay.",
  icons: {
    icon: [
      { url: '/icon.png', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-icon.png' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="absolute top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
          <Toaster position="top-center" richColors />
          <UrlToastListener />
        </ThemeProvider>
      </body>
    </html>
  );
}
