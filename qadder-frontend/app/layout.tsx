import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const font = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Qadder",
  description: "Qadder frontend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar">
      <body className={font.className}>
        {children}
      </body>
    </html>
  );
}