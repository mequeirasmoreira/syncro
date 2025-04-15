import type { Metadata } from "next";
import { Inter } from 'next/font/google'


import { ThemeProvider } from "./contexts/ThemeContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { AuthProvider } from "../contexts/AuthContext";
import SupabaseInitializer from "./components/SupabaseInitializer";
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Syncro",
  description: "Gerenciador de clinicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              <SupabaseInitializer />
              {children}
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
