import { RealtimeArrival } from "@/types";

export function generateMockData(stationName: string): RealtimeArrival[] {
    const now = new Date();

    // Helper to create a train
    const createTrain = (
        subwayId: string,
        updn: string,
        dest: string,
        msg: string,
        seconds: number,
        currentPos: string
    ): RealtimeArrival => ({
        subwayId,
        updnLine: updn,
        trainLineNm: dest,
        statnNm: stationName,
        arvlMsg2: msg,
        arvlMsg3: currentPos,
        arvlCd: "99",
        btrainSttus: "일반",
        barvlDt: seconds.toString(),
        recptnDt: now.toISOString()
    });

    // Specific scenarios based on station name
    if (stationName.includes("강남")) {
        return [
            createTrain("1002", "내선", "성수행 - 역삼방면", "2분 후", 120, "역삼"),
            createTrain("1002", "내선", "성수행 - 역삼방면", "4분 후", 240, "선릉"),
            createTrain("1002", "외선", "교대행 - 교대방면", "전역 도착", 60, "교대"),
            createTrain("1002", "외선", "신도림행 - 서초방면", "5분 후", 300, "방배"),
            createTrain("1077", "상행", "신사행 - 신논현방면", "곧 도착", 30, "양재"),
            createTrain("1077", "하행", "광교행 - 양재방면", "6분 후", 360, "논현"),
        ];
    }

    if (stationName.includes("서울")) { // Seoul Station
        return [
            createTrain("1001", "상행", "청량리행 - 시청방면", "곧 도착", 45, "남영"),
            createTrain("1001", "하행", "천안행 - 남영방면", "3분 후", 180, "시청"),
            createTrain("1004", "상행", "당고개행 - 회현방면", "전역 출발", 90, "숙대입구"),
            createTrain("1004", "하행", "오이도행 - 숙대입구방면", "5분 후", 300, "회현"),
            createTrain("1065", "하행", "인천공항2터미널행", "10분 후", 600, "공덕"),
        ];
    }

    if (stationName.includes("홍대")) {
        return [
            createTrain("1002", "내선", "신촌행 - 신촌방면", "3분 후", 180, "합정"),
            createTrain("1002", "외선", "합정행 - 합정방면", "5분 후", 300, "신촌"),
            createTrain("1063", "상행", "문산행", "전역 도착", 60, "서강대"),
            createTrain("1065", "하행", "인천공항T2행", "8분 후", 480, "디지털미디어시티"),
        ];
    }

    // Default / Generic (Assume Line 2 & 5 mix for demo)
    return [
        createTrain("1002", "내선", `${stationName}행 - 다음역방면`, "3분 20초", 200, "전역"),
        createTrain("1002", "외선", `${stationName}행 - 이전역방면`, "5분 00초", 300, "전전역"),
        createTrain("1005", "상행", "방화행", "7분 후", 420, "까치산"),
        createTrain("1005", "하행", "마천행", "곧 도착", 30, "다음역"),
    ];
}

export const MOCK_ARRIVALS: RealtimeArrival[] = generateMockData("강남");
