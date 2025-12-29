export interface RealtimeArrival {
    subwayId: string; // Line ID (e.g. "1002" for Line 2)
    updnLine: string; // "상행" or "하행" / "Inner" "Outer"
    trainLineNm: string; // "Seongsu - Sindorim" (Destination info)
    statnNm: string; // Current Station Name
    arvlMsg2: string; // "Arriving at 2 min" or "[5] Station Name (Approaching)"
    arvlMsg3: string; // Current location e.g. "Seoul Stn"
    arvlCd: string; // Status Code (0:Approaching, 1:Arrived, etc)
    btrainSttus: string; // Train type (Express/Normal)
    barvlDt: string; // Time in seconds to arrival (often "0")
    recptnDt: string; // Data generated time
}

export interface SubwayArrivalResponse {
    errorMessage: {
        status: number;
        code: string;
        message: string;
    };
    realtimeArrivalList: RealtimeArrival[];
}
