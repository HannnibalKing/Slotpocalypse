import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casino Slot Machine - Play & Win!",
  description: "Modern slot machine game with engaging gameplay and responsible gaming features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
