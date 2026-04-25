// Import global styles (Tailwind + custom theme)
import "./globals.css";

// Import Arabic font and Configure the font with required subsets and weights
import { IBM_Plex_Sans_Arabic } from "next/font/google";
const font = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

// Define global metadata for the application
export const metadata = {
  title: "Qadder",
  description: "Qadder frontend",
};

// Root layout component 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     // Set the document language to Arabic
    <html lang="ar">
      <body className={font.className}>
        {children}
      </body>
    </html>
  );
}