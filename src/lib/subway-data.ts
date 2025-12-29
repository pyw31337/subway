export type Station = {
    id: string;
    name: string;
    lines: string[];
    lat: number;
    lng: number;
};

// Major stations for MVP coverage
export const STATIONS: Station[] = [
    // Line 1
    { id: "133", name: "서울역", lines: ["1", "4", "A", "K"], lat: 37.555152, lng: 126.970724 },
    { id: "132", name: "시청", lines: ["1", "2"], lat: 37.565703, lng: 126.976861 },
    { id: "130", name: "종로3가", lines: ["1", "3", "5"], lat: 37.570415, lng: 126.992144 },
    { id: "1001000131", name: "종각", lines: ["1"], lat: 37.570161, lng: 126.983144 },
    { id: "1001000139", name: "영등포", lines: ["1"], lat: 37.515545, lng: 126.907722 },
    { id: "1001000140", name: "신도림", lines: ["1", "2"], lat: 37.508915, lng: 126.891395 },
    { id: "1001000154", name: "용산", lines: ["1", "K"], lat: 37.529895, lng: 126.964722 },

    // Line 2 (Full major nodes)
    { id: "239", name: "강남", lines: ["2", "D"], lat: 37.498112, lng: 127.027641 },
    { id: "221", name: "홍대입구", lines: ["2", "A", "K"], lat: 37.557762, lng: 126.924876 },
    { id: "216", name: "잠실", lines: ["2", "8"], lat: 37.513294, lng: 127.100130 },
    { id: "222", name: "을지로3가", lines: ["2", "3"], lat: 37.566311, lng: 126.991396 },
    { id: "220", name: "신촌", lines: ["2"], lat: 37.555134, lng: 126.936893 },
    { id: "234", name: "신도림", lines: ["1", "2"], lat: 37.508915, lng: 126.891395 },
    { id: "205", name: "대림", lines: ["2", "7"], lat: 37.493208, lng: 126.894951 },
    { id: "222", name: "강변", lines: ["2"], lat: 37.535094, lng: 127.094685 },
    { id: "242", name: "역삼", lines: ["2"], lat: 37.500641, lng: 127.036130 },
    { id: "241", name: "선릉", lines: ["2", "K"], lat: 37.504260, lng: 127.048187 },
    { id: "240", name: "삼성", lines: ["2"], lat: 37.508826, lng: 127.063174 },

    // Line 3
    { id: "319", name: "압구정", lines: ["3"], lat: 37.526270, lng: 127.028448 },
    { id: "320", name: "신사", lines: ["3", "D"], lat: 37.516281, lng: 127.020165 },
    { id: "321", name: "고속터미널", lines: ["3", "7", "9"], lat: 37.504938, lng: 127.004866 },
    { id: "322", name: "교대", lines: ["2", "3"], lat: 37.493976, lng: 127.014631 },
    { id: "323", name: "양재", lines: ["3", "D"], lat: 37.484139, lng: 127.034568 },

    // Line 4
    { id: "420", name: "혜화", lines: ["4"], lat: 37.582187, lng: 127.001925 },
    { id: "421", name: "동대문", lines: ["1", "4"], lat: 37.571434, lng: 127.009772 },
    { id: "422", name: "명동", lines: ["4"], lat: 37.560932, lng: 126.986348 },
    { id: "426", name: "서울역", lines: ["1", "4"], lat: 37.555152, lng: 126.970724 },
    { id: "429", name: "신용산", lines: ["4"], lat: 37.529170, lng: 126.967923 },
    { id: "430", name: "이촌", lines: ["4", "K"], lat: 37.522245, lng: 126.973656 },

    // Line 5
    { id: "525", name: "여의도", lines: ["5", "9"], lat: 37.521841, lng: 126.924294 },
    { id: "526", name: "여의나루", lines: ["5"], lat: 37.527011, lng: 126.932901 },
    { id: "512", name: "김포공항", lines: ["5", "9", "A", "K"], lat: 37.562366, lng: 126.801640 },
    { id: "524", name: "광화문", lines: ["5"], lat: 37.571060, lng: 126.976646 },

    // Line 6
    { id: "622", name: "이태원", lines: ["6"], lat: 37.534533, lng: 126.994348 },
    { id: "623", name: "한강진", lines: ["6"], lat: 37.540864, lng: 127.001859 },

    // Line 7
    { id: "728", name: "건대입구", lines: ["2", "7"], lat: 37.540751, lng: 127.070997 },
    { id: "732", name: "청담", lines: ["7"], lat: 37.519088, lng: 127.051939 },

    // Line 9
    { id: "913", name: "노량진", lines: ["1", "9"], lat: 37.513512, lng: 126.941656 },
    { id: "923", name: "신논현", lines: ["9", "D"], lat: 37.504620, lng: 127.025064 },
];

export const LINE_COLORS: Record<string, string> = {
    "1": "#0052A4",
    "2": "#00B050",
    "3": "#EF7C1C",
    "4": "#00A5DE",
    "5": "#996CAC",
    "6": "#CD7C2F",
    "7": "#747F00",
    "8": "#E6186C",
    "9": "#BDB092",
    "A": "#0090D2", // AREX
    "D": "#D4003B", // Shinbundang
    "K": "#77C4A3", // Gyeongui-Jungang
    "U": "#FFB850", // Ui-Sinseol (Generic)
    "G": "#00B9B0", // Gimpo Gold
};

export const SUBWAY_ID_MAP: Record<string, string> = {
    "1001": "1",
    "1002": "2",
    "1003": "3",
    "1004": "4",
    "1005": "5",
    "1006": "6",
    "1007": "7",
    "1008": "8",
    "1009": "9",
    "1063": "K",
    "1065": "A",
    "1075": "D", // Bundang is often similar ID but keeping simple
    "1077": "D", // Shinbundang
};
