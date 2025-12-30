export default function Logo() {
    return (
        <div className="absolute top-6 left-6 z-50 pointer-events-none select-none">
            <h1 className="text-4xl font-black tracking-tighter italic text-gray-900 drop-shadow-md">
                SUBWAY <span className="text-cyan-600">NAV</span>
            </h1>
            <p className="text-xs text-gray-500 font-bold mt-1 tracking-widest">SEOUL METRO LIVE</p>
        </div>
    );
}
