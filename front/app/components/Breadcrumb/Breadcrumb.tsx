import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

interface BreadcrumbProps {
  parentLabel: string;
  parentHref: string;
  current: string;
  isDarkMode?: boolean;
}

export function Breadcrumb({
  parentLabel,
  parentHref,
  current,
  isDarkMode,
}: BreadcrumbProps) {
  return (
    <nav
      className="flex items-center text-sm text-gray-400 dark:text-neutral-400"
      aria-label="Breadcrumb"
    >
      <Link href={parentHref} className="hover:underline">
        {parentLabel}
      </Link>
      <ChevronRightIcon className="w-4 h-4 mx-2" />
      <h1
        className={`text-2xl font-bold ${
          isDarkMode ? "text-white" : "text-gray-800"
        }`}
      >
        {current}
      </h1>
    </nav>
  );
}
