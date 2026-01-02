export default function Logo() {
    return (
        <div className="absolute top-6 left-6 z-[2000] pointer-events-none select-none flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-2.5 rounded-xl shadow-lg transform -rotate-6 border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.873 8.703a4.126 4.126 0 017.746 0 .75.75 0 01-.351.92 7.47 7.47 0 01-3.522.877 7.47 7.47 0 01-3.522-.877.75.75 0 01-.351-.92zM15.375 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.873 8.703a4.126 4.126 0 017.746 0 .75.75 0 01-.351.92 7.47 7.47 0 01-3.522.877 7.47 7.47 0 01-3.522-.877.75.75 0 01-.351-.92z" />
                </svg>
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tighter italic text-gray-900 drop-shadow-sm flex items-center">
                    Subway <span className="text-cyan-600 ml-1">Live</span>
                </h1>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase pl-0.5 opacity-80">Seoul Metro Real-time</p>
            </div>
        </div>
    );
}
