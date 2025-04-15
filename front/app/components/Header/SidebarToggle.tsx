"use client";

import { Bars3Icon } from "@heroicons/react/24/outline";

interface SidebarToggleProps {
    isDarkMode: boolean;
    isSidebarClosed: boolean;
    onToggle: () => void;
}

export function SidebarToggle({ isDarkMode, isSidebarClosed, onToggle }: SidebarToggleProps) {
    return (
        <button
        onClick={onToggle}
        className={`p-1.5 rounded-lg transition-colors duration-200 ${
            isDarkMode 
            ? "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200" 
            : "text-gray-600 hover:bg-gray-100"
        }`}
        >
            <Bars3Icon className="w-5 h-5" />
        </button>
    );
}
