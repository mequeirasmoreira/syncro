"use client";

import { Sidebar } from "./Sidebar/Sidebar";
import { Header } from "./Header/Header";
import { useTheme } from "../contexts/ThemeContext";
import { useSidebar } from "../contexts/SidebarContext";
import { ReactNode } from "react";

interface RootLayoutProps {
    children: ReactNode | ((props: { isDarkMode: boolean }) => ReactNode);
}

export default function RootLayout({ children }: RootLayoutProps) {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { isSidebarClosed, toggleSidebar } = useSidebar();

    return (
        <div className={isDarkMode ? "dark" : ""}>
        <div className="flex h-screen bg-slate-100 dark:bg-neutral-900 dark">
            <Sidebar
                isDarkMode={isDarkMode}
                onDarkModeChange={toggleDarkMode}
                isSidebarClosed={isSidebarClosed}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
            <Header
                isDarkMode={isDarkMode}
                isSidebarClosed={isSidebarClosed}
                onSidebarToggle={toggleSidebar}
            />
            <main className={`flex-1 overflow-auto p-6 ${isDarkMode ? "bg-neutral-900" : "bg-slate-100"}`}>
                {
                typeof children === "function" 
                    ? children ({ isDarkMode }) 
                    : children
                }
            </main>
            </div>
        </div>
        </div>
    );
}
