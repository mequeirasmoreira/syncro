"use client";

interface UserProfileProps {
    isDark: boolean;
    isCollapsed: boolean;
}

export function UserProfile({ isDark, isCollapsed }: UserProfileProps) {
    const userInitial = "M";
    const userName = "Miguel Andrade";
    const userEmail = "miguel@email.com";

    return (
        <div
        className={`flex items-center gap-3 px-3 py-3 mt-2 transition-all duration-200 cursor-pointer rounded-lg ${
            isDark
            ? "hover:bg-white/10 text-slate-100/70"
            : "hover:bg-white text-gray-600"
        } ${isCollapsed ? "justify-center" : ""}`}
        >
        <div className={`flex-shrink-0 ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`}>
            <div
            className={`w-full h-full rounded-full flex items-center justify-center text-white font-medium ${
                isDark ? "bg-emerald-600" : "bg-emerald-500"
            }`}
            >
            {userInitial}
            </div>
        </div>
        {!isCollapsed && (
            <div className="flex-1 min-w-0">
            <p
                className={`text-sm font-medium truncate ${
                isDark ? "text-slate-100" : "text-gray-900"
                }`}
            >
                {userName}
            </p>
            <p className="text-xs truncate text-gray-500 dark:text-gray-400">
                {userEmail}
            </p>
            </div>
        )}
        </div>
    );
}
