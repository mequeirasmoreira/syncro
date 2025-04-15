/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/(pages)/**/*.{js,ts,jsx,tsx}",
        "./app/components/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./app/layout.tsx",
        "./app/page.tsx",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-pacifico)', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
