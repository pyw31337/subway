export default function Logo() {
    return (
        <div className="absolute top-6 left-6 z-50 pointer-events-none select-none">
            <h1 className="text-4xl font-black tracking-tighter italic text-gray-900 drop-shadow-md">
                Subway <span className="text-red-600">Live</span>
            </h1>
            <p className="text-xs text-gray-500 font-bold mt-1 tracking-widest pl-1">SEOUL METRO REAL-TIME</p>
        </div>
    );
}
