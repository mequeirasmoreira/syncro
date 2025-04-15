export default function TestePage() {

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-neutral-800"> 
            <div className="flex w-64 flex-col border-r-2 border-neutral-700 bg-neutral-900 transition-all duration-300">
                <div className="flex-1 py-2">
                    <div className="mt-4 space-y-1 overflow-hidden transition-all duration-200">
                        <div className="block">
                            <div className="group mx-1 mb-1 flex cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-200">
                                <div className="flex h-8 w-8 items-center justify-center text-emerald-700 group-hover:bg-white group-hover:text-emerald-500 group-hover:dark:bg-white/10">
                                    <span className="transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                                        </svg>
                                    </span>
                                    <span> Dahsboard </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}