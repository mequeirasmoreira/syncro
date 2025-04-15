"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface SearchBarProps {
    isDarkMode: boolean;
}

export function SearchBar({ isDarkMode }: SearchBarProps) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
        isDarkMode
            ? "border-neutral-700 text-neutral-200"
            : "border-gray-300 text-gray-700"
        }`}>
        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
        <input
            type="text"
            placeholder="Buscar..."
            className={`text-sm bg-transparent outline-none w-48 ${
            isDarkMode ? "placeholder-neutral-500" : "placeholder-gray-400"
            }`}
        />
        </div>
    );
}
