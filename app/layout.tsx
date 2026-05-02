import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRT Pomodoro",
  description: "Retro pixel-art Pomodoro timer with CRT aesthetics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="crt-overlay crt-vignette antialiased">
        {children}
      </body>
    </html>
  );
}
