import type { Metadata } from "next";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/baloo-2/500.css";
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";
import "./globals.css";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { AchievementToaster } from "@/components/audio/AchievementToaster";

export const metadata: Metadata = {
  title: "Quibble — the word game for your team",
  description:
    "A fast, friendly multiplayer word game to play with your colleagues.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AudioProvider>
          {children}
          <AchievementToaster />
        </AudioProvider>
      </body>
    </html>
  );
}
