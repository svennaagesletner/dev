import "@/src/styles/globals.css";
import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Ressursflyt",
  description: "School resource planning for municipalities",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
