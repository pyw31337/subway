

// Simplify: Line 2 Inner Loop Order
export const LINE_2_SEQUENCE = [
    "시청", "을지로입구", "을지로3가", "을지로4가", "동대문역사문화공원", "신당", "상왕십리", "왕십리", "한양대", "뚝섬",
    "성수", "건대입구", "구의", "강변", "잠실나루", "잠실", "잠실새내", "종합운동장", "삼성", "선릉", "역삼", "강남",
    "교대", "서초", "방배", "사당", "낙성대", "서울대입구", "봉천", "신림", "신대방", "구로디지털단지", "대림",
    "신도림", "문래", "영등포구청", "당산", "합정", "홍대입구", "신촌", "이대", "아현", "충정로"
];

// Helper to get index
export function getLine2Index(stationName: string) {
    return LINE_2_SEQUENCE.indexOf(stationName);
}

// Logic: Determine Trip (Clockwise vs Counter-Clockwise)
// A trivial approach: If distance forward < distance backward, go forward.
export function getRouteLine2(start: string, end: string) {
    const sIdx = getLine2Index(start);
    const eIdx = getLine2Index(end);

    if (sIdx === -1 || eIdx === -1) return null;

    // Assume Inner Loop (Clockwise) for simplicity in MVP
    // Ideally, calculate both ways and return shortest.

    if (sIdx < eIdx) {
        return LINE_2_SEQUENCE.slice(sIdx, eIdx + 1);
    } else {
        // Loop around? Or just slice reverse?
        // Let's just create array: Start -> ... -> End
        // e.g. Start(40) -> End(2) : [40, 41, 42, 0, 1, 2]
        const part1 = LINE_2_SEQUENCE.slice(sIdx);
        const part2 = LINE_2_SEQUENCE.slice(0, eIdx + 1);
        return [...part1, ...part2];
    }
}
