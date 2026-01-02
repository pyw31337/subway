export default function Logo() {
    return (
        <div className="absolute top-6 left-6 z-[2000] pointer-events-none select-none flex items-center gap-4">
            {/* Icon Block */}
            <div className="relative group">
                <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/50 transform transition-transform group-hover:scale-105 duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-cyan-400">
                        <path d="M5 15h14" />
                        <path d="M5 9h14" />
                        <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                        <path d="M8 21v-2" />
                        <path d="M16 21v-2" />
                    </svg>
                </div>
            </div>

            {/* Text Block */}
            <div className="flex flex-col">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 drop-shadow-sm flex items-center gap-0.5">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Subway</span>
                    <span className="text-cyan-600 italic relative">
                        Live
                        <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    </span>
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-px w-8 bg-slate-300"></div>
                    <p className="text-[10px] text-slate-500 font-extrabold tracking-[0.3em] uppercase">Seoul Metro</p>
                </div>
            </div>
        </div>
    );
}
