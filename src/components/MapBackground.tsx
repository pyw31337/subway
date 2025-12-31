"use client";

import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const GeoJSON = dynamic(
    () => import("react-leaflet").then((mod) => mod.GeoJSON),
    { ssr: false }
);

// Seoul subway lines GeoJSON (simplified major lines)
const seoulSubwayLines = {
    type: "FeatureCollection" as const,
    features: [
        // Line 2 (Green Loop)
        {
            type: "Feature" as const,
            properties: { line: "2", color: "#3CB44B", name: "2호선" },
            geometry: {
                type: "LineString" as const,
                coordinates: [
                    [126.9312, 37.5556], // 신도림
                    [126.9369, 37.5578], // 대림
                    [126.9525, 37.5609], // 신림
                    [126.9630, 37.5031], // 서울대입구
                    [126.9828, 37.4812], // 낙성대
                    [126.9975, 37.4762], // 사당
                    [127.0165, 37.4840], // 교대
                    [127.0276, 37.4981], // 강남
                    [127.0361, 37.5006], // 역삼
                    [127.0482, 37.5043], // 선릉
                    [127.0632, 37.5088], // 삼성
                    [127.0864, 37.5138], // 종합운동장
                    [127.1001, 37.5133], // 잠실
                    [127.0947, 37.5351], // 강변
                    [127.0710, 37.5407], // 건대입구
                    [127.0440, 37.5617], // 왕십리
                    [127.0100, 37.5656], // 을지로3가
                    [126.9862, 37.5658], // 을지로입구
                    [126.9769, 37.5658], // 시청
                    [126.9513, 37.5575], // 충정로
                    [126.9369, 37.5552], // 홍대입구
                    [126.9248, 37.5567], // 합정
                    [126.9139, 37.5545], // 당산
                    [126.9312, 37.5556], // back to 신도림 (loop)
                ],
            },
        },
        // Line 1 (Dark Blue)
        {
            type: "Feature" as const,
            properties: { line: "1", color: "#0052A4", name: "1호선" },
            geometry: {
                type: "LineString" as const,
                coordinates: [
                    [126.9727, 37.5546], // 서울역
                    [126.9769, 37.5658], // 시청
                    [126.9832, 37.5701], // 종각
                    [127.0099, 37.5715], // 동대문
                    [127.0477, 37.5787], // 청량리
                ],
            },
        },
        // Line 3 (Orange)
        {
            type: "Feature" as const,
            properties: { line: "3", color: "#EF7C1C", name: "3호선" },
            geometry: {
                type: "LineString" as const,
                coordinates: [
                    [127.1045, 37.6388], // 대화
                    [127.0545, 37.6188], // 연신내
                    [127.0245, 37.5988], // 불광
                    [126.9669, 37.5842], // 경복궁
                    [126.9917, 37.5710], // 종로3가
                    [127.0100, 37.5656], // 을지로3가
                    [127.0163, 37.5617], // 충무로
                    [127.0254, 37.5047], // 고속터미널
                    [127.0346, 37.4842], // 양재
                ],
            },
        },
        // Line 4 (Sky Blue)
        {
            type: "Feature" as const,
            properties: { line: "4", color: "#00A5DE", name: "4호선" },
            geometry: {
                type: "LineString" as const,
                coordinates: [
                    [127.0719, 37.6034], // 당고개
                    [127.0252, 37.5821], // 혜화
                    [127.0099, 37.5715], // 동대문
                    [127.0100, 37.5656], // 을지로4가
                    [126.9727, 37.5546], // 서울역
                    [126.9649, 37.5229], // 이촌
                    [126.9282, 37.5012], // 사당
                ],
            },
        },
        // Shinbundang Line (Red)
        {
            type: "Feature" as const,
            properties: { line: "신분당", color: "#D4003B", name: "신분당선" },
            geometry: {
                type: "LineString" as const,
                coordinates: [
                    [127.0276, 37.4981], // 강남
                    [127.0346, 37.4842], // 양재
                    [127.0795, 37.4024], // 판교
                    [127.1074, 37.3594], // 정자
                ],
            },
        },
    ],
};

function MapBackground() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Style function for GeoJSON
    const lineStyle = (feature: any) => ({
        color: feature?.properties?.color || "#888",
        weight: 4,
        opacity: 0.9,
    });

    if (!isClient) {
        return (
            <div className="absolute inset-0 w-full h-full z-0 bg-gray-100 flex items-center justify-center">
                <div className="text-gray-400 text-sm">Loading map...</div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                crossOrigin=""
            />
            <MapContainer
                center={[37.5665, 126.9780]}
                zoom={12}
                scrollWheelZoom={true}
                zoomControl={false}
                attributionControl={false}
                style={{ height: "100%", width: "100%", background: "#f0f0f0" }}
            >
                {/* CartoDB Positron - Beautiful grayscale map */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {/* Seoul Subway Lines Overlay */}
                <GeoJSON
                    data={seoulSubwayLines as any}
                    style={lineStyle}
                />
            </MapContainer>
        </div>
    );
}

export default memo(MapBackground);
