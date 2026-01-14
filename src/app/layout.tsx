import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { FullPlayer } from "@/components/player/FullPlayer";

export const metadata: Metadata = {
  title: "Voice Bedtime Tales - Stories in YOUR Voice",
  description:
    "Create magical bedtime stories narrated in your own voice. Record 30 seconds, and we'll create personalized tales for your child.",
  keywords: ["bedtime stories", "voice cloning", "children", "personalized stories"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Voice Bedtime Tales",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Animated background orbs */}
        <div className="bg-orbs" aria-hidden="true" />

        <PlayerProvider>
          {/* Main Content */}
          {children}

          {/* Global Players */}
          <MiniPlayer />
          <FullPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
