"use client";

import { useTheme } from "../../../contexts/ThemeContext";
import RootLayout from "../../../components/RootLayout";

export default function DashboardPage() {
    const { isDarkMode } = useTheme();

    return (
        <RootLayout>
        <div>
            <h1
                className={`text-2xl font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                }`}
            >
            Dashboard
            </h1>
        </div>
        </RootLayout>
    );
}
