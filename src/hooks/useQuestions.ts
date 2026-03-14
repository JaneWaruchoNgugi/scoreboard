// hooks/useQuestions.ts

export interface Question {
    id: number;
    question: string;
    answer: string;
}

export interface Category {
    id: number;
    name: string;
    emoji: string;
    questions: Question[];
}

// ── ROUND 1 ── 20 general-knowledge questions ──────────────────────────────
const ROUND_1_QUESTIONS: Question[] = [
    { id: 1,  question: "What is the capital of France?",                            answer: "Paris" },
    { id: 2,  question: "How many sides does a hexagon have?",                       answer: "6" },
    { id: 3,  question: "Which planet is known as the Red Planet?",                  answer: "Mars" },
    { id: 4,  question: "What is the chemical symbol for gold?",                     answer: "Au" },
    { id: 5,  question: "Who painted the Mona Lisa?",                                answer: "Leonardo da Vinci" },
    { id: 6,  question: "What year did World War II end?",                           answer: "1945" },
    { id: 7,  question: "What is the largest ocean on Earth?",                       answer: "Pacific Ocean" },
    { id: 8,  question: "How many bones are in the adult human body?",               answer: "206" },
    { id: 9,  question: "Which country invented the printing press?",                answer: "Germany" },
    { id: 10, question: "What is the square root of 144?",                           answer: "12" },
    { id: 11, question: "In which continent is the Sahara Desert?",                  answer: "Africa" },
    { id: 12, question: "What language has the most native speakers worldwide?",     answer: "Mandarin Chinese" },
    { id: 13, question: "What gas do plants absorb from the atmosphere?",            answer: "Carbon dioxide (CO₂)" },
    { id: 14, question: "Who wrote Romeo and Juliet?",                               answer: "William Shakespeare" },
    { id: 15, question: "How many planets are in our solar system?",                 answer: "8" },
    { id: 16, question: "What is the fastest land animal?",                          answer: "Cheetah" },
    { id: 17, question: "Which element has the atomic number 1?",                    answer: "Hydrogen" },
    { id: 18, question: "What is the tallest mountain in the world?",                answer: "Mount Everest" },
    { id: 19, question: "In what year did the Titanic sink?",                        answer: "1912" },
    { id: 20, question: "What is the hardest natural substance on Earth?",           answer: "Diamond" },
];

// ── ROUND 2 ── Categories × 4 questions ────────────────────────────────────
const ROUND_2_CATEGORIES: Category[] = [
    {
        id: 1,
        name: "Science & Nature",
        emoji: "🔬",
        questions: [
            { id: 1, question: "What force keeps planets in orbit around the Sun?",        answer: "Gravity" },
            { id: 2, question: "What is the powerhouse of the cell?",                      answer: "Mitochondria" },
            { id: 3, question: "What is the most abundant gas in Earth's atmosphere?",     answer: "Nitrogen" },
            { id: 4, question: "How many chromosomes do humans have?",                     answer: "46" },
        ],
    },
    {
        id: 2,
        name: "History",
        emoji: "🏛️",
        questions: [
            { id: 1, question: "Who was the first President of the United States?",        answer: "George Washington" },
            { id: 2, question: "In which year did the Berlin Wall fall?",                  answer: "1989" },
            { id: 3, question: "Which empire was ruled by Julius Caesar?",                 answer: "Roman Empire" },
            { id: 4, question: "Who was the first woman to win a Nobel Prize?",            answer: "Marie Curie" },
        ],
    },
    {
        id: 3,
        name: "Pop Culture",
        emoji: "🎬",
        questions: [
            { id: 1, question: "What fictional school does Harry Potter attend?",          answer: "Hogwarts" },
            { id: 2, question: "Which artist released the album 'Thriller'?",             answer: "Michael Jackson" },
            { id: 3, question: "How many Infinity Stones are there in the MCU?",          answer: "6" },
            { id: 4, question: "What is the best-selling video game of all time?",        answer: "Minecraft" },
        ],
    },
    {
        id: 4,
        name: "Geography",
        emoji: "🌍",
        questions: [
            { id: 1, question: "What is the capital city of Australia?",                   answer: "Canberra" },
            { id: 2, question: "Which river is the longest in the world?",                 answer: "Nile" },
            { id: 3, question: "How many countries are in Africa?",                        answer: "54" },
            { id: 4, question: "What is the smallest country in the world?",               answer: "Vatican City" },
        ],
    },
];

// ── ROUND 3 ── 6 general questions ─────────────────────────────────────────
const ROUND_3_QUESTIONS: Question[] = [
    { id: 1, question: "What is the currency of Japan?",                             answer: "Yen" },
    { id: 2, question: "How many continents are there on Earth?",                    answer: "7" },
    { id: 3, question: "Which planet is the largest in our solar system?",           answer: "Jupiter" },
    { id: 4, question: "What is the longest bone in the human body?",               answer: "Femur" },
    { id: 5, question: "Who invented the telephone?",                                answer: "Alexander Graham Bell" },
    { id: 6, question: "What is the speed of light (approximately)?",               answer: "300,000 km/s" },
];

// ── Hook ────────────────────────────────────────────────────────────────────
export function useQuestions() {
    return {
        round1: ROUND_1_QUESTIONS,
        round2: ROUND_2_CATEGORIES,
        round3: ROUND_3_QUESTIONS,
        totalRound1: ROUND_1_QUESTIONS.length,
        totalRound2Categories: ROUND_2_CATEGORIES.length,
        totalRound3: ROUND_3_QUESTIONS.length,
    };
}