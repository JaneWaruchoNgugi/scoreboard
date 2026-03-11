import type { Category } from "../types";

// ─── Neon tile visual styles (one per category) ────────────────────────────
export const TILE: Record<string, { fill: string; glow: string; border: string }> = {
    history:       { fill: "linear-gradient(145deg,#2060e0 0%,#1040b0 55%,#0a2878 100%)", glow: "#4488ff", border: "#88bbff" },
    general:       { fill: "linear-gradient(145deg,#20d060 0%,#10a040 55%,#087028 100%)", glow: "#30e870", border: "#70ffaa" },
    kiswahili:     { fill: "linear-gradient(145deg,#f06020 0%,#c84010 55%,#902808 100%)", glow: "#ff8040", border: "#ffb070" },
    sports:        { fill: "linear-gradient(145deg,#e01040 0%,#b00028 55%,#780018 100%)", glow: "#ff3060", border: "#ff7090" },
    cre:           { fill: "linear-gradient(145deg,#f0b000 0%,#c88800 55%,#906000 100%)", glow: "#ffcc10", border: "#ffdd60" },
    geography:     { fill: "linear-gradient(145deg,#9020e0 0%,#6808b8 55%,#480880 100%)", glow: "#b848ff", border: "#d080ff" },
    science:       { fill: "linear-gradient(145deg,#e01898 0%,#b00078 55%,#780050 100%)", glow: "#ff40b8", border: "#ff80d0" },
    entertainment: { fill: "linear-gradient(145deg,#10c8b8 0%,#08a090 55%,#047068 100%)", glow: "#20e8d8", border: "#70fff8" },
};

// ─── Default question banks ────────────────────────────────────────────────
export const DEFAULT_CATEGORIES: Category[] = [
    {
        id: "history", name: "HISTORY", color: "#1e4fa3", borderColor: "#4a7fd4",
        used: false, question: "", answer: "",
        questionBank: [
            { id: "h1", q: "Who was the first President of Kenya?", a: "Jomo Kenyatta" },
            // { id: "h2", q: "In which year did Kenya gain independence?", a: "1963" },
            // { id: "h3", q: "Which country built the Uganda Railway?", a: "Britain (UK)" },
        ],
    },
    {
        id: "general", name: "GENERAL KNOWLEDGE", color: "#1a7a3f", borderColor: "#2db55d",
        used: false, question: "", answer: "",
        questionBank: [
            { id: "g1", q: "What is the capital city of Kenya?", a: "Nairobi" },
            // { id: "g2", q: "How many counties does Kenya have?", a: "47" },
            // { id: "g3", q: "What is the national animal of Kenya?", a: "Lion" },
        ],
    },
    {
        id: "kiswahili", name: "KISWAHILI", color: "#c45c18", borderColor: "#e8832a",
        used: false, question: "", answer: "",
        questionBank: [
            { id: "k1", q: "Tafsiri neno 'Uhuru' kwa Kiingereza", a: "Freedom / Independence" },
            // { id: "k2", q: "Kamilisha msemo: 'Haraka haraka...'", a: "...haina baraka" },
            // { id: "k3", q: "Wingi wa neno 'mtoto' ni nini?", a: "Watoto" },
        ],
    },
    {
        id: "sports", name: "SPORTS", color: "#a81e1e", borderColor: "#d43535",
        used: false, question: "", answer: "",
        questionBank: [
            { id: "s1", q: "Which Kenyan athlete won the 2023 London Marathon?", a: "Kelvin Kiptum" },
            // { id: "s2", q: "How many players are on a standard football team on the pitch?", a: "11" },
            // { id: "s3", q: "In which sport does Kenya dominate world records for long distances?", a: "Athletics (Running)" },
        ],
    },
    {
        id: "cre", name: "C.R.E", color: "#b8860b", borderColor: "#e8b520",
        used: false, question: "", answer: "",
        questionBank: [
            { id: "c1", q: "How many books are in the New Testament?", a: "27" },
            // { id: "c2", q: "Who baptised Jesus Christ?", a: "John the Baptist" },
            // { id: "c3", q: "Name the first miracle of Jesus", a: "Turning water into wine (Cana)" },
        ],
    },
    {
        id: "geography", name: "GEOGRAPHY", color: "#6a1e9e", borderColor: "#9b3dd4",
        used: false, question: "", answer: "",
        questionBank: [
            { id: "geo1", q: "What is the highest mountain in Africa?", a: "Mount Kilimanjaro" },
            // { id: "geo2", q: "Which lake borders Kenya, Uganda and Tanzania?", a: "Lake Victoria" },
            // { id: "geo3", q: "Name the longest river in Africa", a: "River Nile" },
        ],
    },
    {
        id: "science", name: "SCIENCE", color: "#9e1870", borderColor: "#d42ca0",
        used: false, question: "", answer: "",
        questionBank: [
            { id: "sci1", q: "What is the chemical symbol for water?", a: "H₂O" },
            // { id: "sci2", q: "How many bones are in the adult human body?", a: "206" },
            // { id: "sci3", q: "What planet is closest to the Sun?", a: "Mercury" },
        ],
    },
    {
        id: "entertainment", name: "ENTERTAINMENT", color: "#0d7a6e", borderColor: "#15b5a5",
        used: false, question: "", answer: "",
        questionBank: [
            { id: "e1", q: "What is the name of Simba's father in The Lion King?", a: "Mufasa" },
            // { id: "e2", q: "Which country does the K-pop group BTS come from?", a: "South Korea" },
            // { id: "e3", q: "How many Harry Potter books are in the main series?", a: "7" },
        ],
    },
];

export const DEFAULT_STATE = {
    teamA: { name: "TEAM A", score: 0 },
    teamB: { name: "TEAM B", score: 0 },
    period: "1ST",
    clock: "00:00",
    lastUpdated: null,
    timerDuration: 90,
    timerStartedAt: null,
    timerRunning: false,
    timerRound: 1,
    categories: DEFAULT_CATEGORIES,
    activeCategory: null,
    showAnswer: false,
    timerElapsed: 0,
};
