"use client";

import { useTheme } from "../../../contexts/ThemeContext";
import RootLayout from "../../../components/RootLayout";

export default function AdminPage() {
    const { isDarkMode } = useTheme();

    return (
        <RootLayout>
        <div>
            <h1
            className={`text-2xl font-semibold ${
                isDarkMode ? "text-white" : "text-gray-800"
            }`}
            >
                Admin
            </h1>
        </div>
        </RootLayout>
    );
}
