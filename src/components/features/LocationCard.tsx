import useGeolocation from "@/hooks/useGeolocation";
import { findNearestStation, getDistanceFromLatLonInKm } from "@/lib/geo-utils";
import { STATIONS } from "@/lib/subway-data";
import { MapPin, Navigation, Edit2, Check, X } from "lucide-react"; // Import Icons
import { useEffect, useState } from "react";
import { Station } from "@/lib/subway-data";

interface LocationCardProps {
    onSelectStation: (name: string) => void;
    onLocationUpdate: (name: string) => void; // Notify parent of "Current Station"
}

export default function LocationCard({ onSelectStation, onLocationUpdate }: LocationCardProps) {
    const { loaded, coordinates, error } = useGeolocation();
    const [nearest, setNearest] = useState<{ station: Station; dist: number } | null>(null);

    // Manual Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [manualLocation, setManualLocation] = useState("");
    const [currentDisplay, setCurrentDisplay] = useState("위치 정보 없음");

    // GPS Sync Logic
    useEffect(() => {
        if (coordinates && !manualLocation) {
            const found = findNearestStation(coordinates.lat, coordinates.lng, STATIONS);
            if (found) {
                const dist = getDistanceFromLatLonInKm(
                    coordinates.lat,
                    coordinates.lng,
                    found.lat,
                    found.lng
                );
                // Auto-set if close enough (Increased to 20km for easier testing)
                if (dist <= 20.0) {
                    setNearest({ station: found, dist });
                    onLocationUpdate(found.name);
                    setCurrentDisplay(found.name);
                }
            }
        } else if (error && !manualLocation) {
            setCurrentDisplay("위치를 찾을 수 없음");
        }
    }, [coordinates, error, manualLocation]);

    const handleManualSave = () => {
        if (!manualLocation.trim()) {
            setIsEditing(false);
            return;
        }
        onLocationUpdate(manualLocation);
        setCurrentDisplay(manualLocation);
        setIsEditing(false);
    };

    return (
        <div className="bg-[#1C1C1E]/80 backdrop-blur-md border border-green-900/50 p-4 rounded-2xl mb-6 flex items-center justify-between shadow-lg active:scale-[0.99] transition-transform relative overflow-hidden">
            {isEditing ? (
                <div className="flex-1 flex items-center gap-2">
                    <input
                        autoFocus
                        type="text"
                        className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none border border-[#00B050]"
                        placeholder="현재 역 이름 (예: 강남)"
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSave()}
                    />
                    <button onClick={handleManualSave} className="p-2 bg-[#00B050] rounded-lg">
                        <Check className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-700 rounded-lg">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>
            ) : (
                <>
                    <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => currentDisplay !== "위치 정보 없음" && currentDisplay !== "위치를 찾을 수 없음" && onSelectStation(currentDisplay)}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${manualLocation ? 'bg-blue-500/20' : 'bg-[#00B050]/20 animate-pulse'}`}>
                            {manualLocation ? (
                                <MapPin className="w-5 h-5 text-blue-400" />
                            ) : (
                                <Navigation className="w-5 h-5 text-[#00B050] fill-current" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${manualLocation ? 'text-blue-400' : 'text-[#00B050]'}`}>
                                    {manualLocation ? '설정된 위치' : '현재 위치 (GPS)'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-1">
                                {currentDisplay === "위치 정보 없음" || currentDisplay === "위치를 찾을 수 없음"
                                    ? <span className="text-gray-500 text-sm">위치를 설정해주세요</span>
                                    : `${currentDisplay}${currentDisplay.endsWith('역') ? '' : '역'}`
                                }
                                {!manualLocation && nearest && (
                                    <span className="text-sm font-normal text-gray-400">
                                        ({(nearest.dist * 1000).toFixed(0)}m)
                                    </span>
                                )}
                            </h3>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                                setManualLocation(currentDisplay === "위치를 찾을 수 없음" || currentDisplay === "위치 정보 없음" ? "" : currentDisplay);
                            }}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-full transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
