"use client";

import { useTheme } from "../../../contexts/ThemeContext";
import RootLayout from "../../../components/RootLayout";

export default function SchedulingPage() {
    const { isDarkMode } = useTheme();

    return (
        <RootLayout>
        <div>
            <h1
            className={`text-2xl font-semibold ${
                isDarkMode ? "text-white" : "text-gray-800"
            }`}
            >
                Agenda
            </h1>
        </div>
        </RootLayout>
    );
}
