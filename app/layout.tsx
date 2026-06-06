import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LangProvider } from "@/contexts/LangContext";
import { getServerLang } from "@/utils/i18n-server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PollaMundialista 2026",
  description: "Predicciones del Mundial 2026",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getServerLang();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <LangProvider initialLang={lang}>
            {children}
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
