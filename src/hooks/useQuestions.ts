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
    { id: 1,  question: "My mothers mother is my?",                               answer: "Grand Mother" },
    { id: 2,  question: "Who was swallowed by a big fish?",                       answer: "Jonah" },
    { id: 3,  question: "Who parted the Red Sea?",                                answer: "Moses" },
    { id: 4,  question: "How many milk teeth are there?",                         answer: "20" },
    { id: 5,  question: "Where was Jesus Crucified?",                             answer: "Golgotha" },
    { id: 6,  question: "What is the currency of South Africa?",                  answer: "Rand" },
    { id: 7,  question: "The only mammal that can fly?",                          answer: "Bat" },
    { id: 8,  question: "Which Kenyan town is known for flowers?",                answer: "Naivasha" },
    { id: 9,  question: "If you pass the person in second place, what position are you in?", answer: "Second place" },
    { id: 10, question: "Kenya's most famous and leading export?",                answer: "Tea" },
    { id: 11, question: "Which organ is affected by tuberculosis?",               answer: "Lungs" },
    { id: 12, question: "What is the boiling point of water in degrees Celsius?", answer: "100°C" },
    { id: 13, question: "Name the process used to separate salt from salty water?", answer: "Evaporation" },
    { id: 14, question: "What document shows you are a citizen of Kenya?",        answer: "National ID / Birth certificate" },
    { id: 15, question: "Jibu kwa kiswahili, nne mara saba?",                     answer: "Ishirini na nane" },
    { id: 16, question: "Smallest county by land size?",                          answer: "Mombasa County" },
    { id: 17, question: "What platform is most used for Kenyan music videos?",    answer: "YouTube" },
    { id: 18, question: "Kenya's Fastest marathon runner?",                       answer: "Eliud Kipchoge" },
    { id: 19, question: "What color is Gor Mahia’s kit?",                         answer: "Green" },
    { id: 20, question: "What is the chemical symbol for water?",                 answer: "H20" },
    { id: 21, question: "Which joint connects the foot to the leg?",                 answer: "Ankle" },
    { id: 22, question: "Kenya’s national animal?",                 answer: "Lion" },
    { id: 23, question: "What is the boiling point of water in degrees Celsius?",                 answer: "100°C" },
    { id: 24, question: "How many counties does Kenya have?",                 answer: "47" },
    { id: 25, question: "What gas do plants use for photosynthesis? ",                 answer: "CO₂" },
    { id: 26, question: "Largest lake in Kenya?",                 answer: "Lake Turkana" },
    { id: 27, question: "Who succeeded Moses as leader of the Israelites?",                 answer: "Joshua" },
    { id: 28, question: "What part of the plant conducts photosynthesis?",                 answer: "Leaves" },
    { id: 29, question: "Which sport is Kenya best known for globally? ",                 answer: "Athletics" },
    { id: 30, question: "Which Mode of payment is most common in Kenya? ",                 answer: "Mpesa" },
    { id: 31, question: "Which liquids are used in a thermometer?",                 answer: "Mercury/ Alcohol" },

];

const ROUND_2_CATEGORIES: Category[] = [
    {
        id: 1,
        name: "Tricky General Knowledge",
        emoji: "🎭",
        questions: [
            { id: 1, question: "A plane crashes on the border of Kenya and Uganda. Where do they bury the survivors?", answer: "You don't bury survivors" },
            { id: 2, question: "What colors are mixed together to make Violet?", answer: "Red and blue" },
            { id: 3, question: "(GSU) is a paramilitary wing of the Kenya Police Service. What is the full meaning?", answer: "General Service Unit" },
            { id: 4, question: "Which comes first in Kenya: Mashujaa Day or Madaraka Day?", answer: "Madaraka Day" },
            { id: 5, question: "How many months in a year have 28 days?", answer: "12 months" },
            { id: 6, question: "(KEMSA) supplies medical commodities in Kenya. What is the full meaning?", answer: "Kenya Medical Supplies Authority" },
            { id: 7, question: "A person born on Jamhuri Day is born on which date?", answer: "12th December" },
            { id: 8, question: "If today is Mashujaa Day, what was the last national holiday before it in the same year?", answer: "Madaraka Day" },
        ],
    },
    {
        id: 2,
        name: "Geography",
        emoji: "🌍",
        questions: [
            { id: 1, question: "Which is the largest ocean in the world?", answer: "Pacific Ocean" },
            { id: 2, question: "Which continent has the most countries?", answer: "Africa" },
            { id: 3, question: "Which county is Maasai Mara in?", answer: "Narok County" },
            { id: 4, question: "Is Egypt a landlocked country?", answer: "NO" },
            { id: 5, question: "Which Island borders Tanzania?", answer: "Zanzibar" },
            { id: 6, question: "What is the capital city of Somalia?", answer: "Mogadishu" },
            { id: 7, question: "Where in Kenya is salt extracted?", answer: "Lake Magadi" },
            { id: 8, question: "Which is the largest island in Africa?", answer: "Madagascar" },
            { id: 9, question: "Which African country has the shape of a horn?", answer: "Somalia" },
            { id: 10, question: "Which county is Mount Kenya found in?", answer: "Meru County" },
            { id: 11, question: "Which is the hottest continent in the world?", answer: "Africa" },
            { id: 12, question: "Which lake is the largest in Africa?", answer: "Lake Victoria" },
            { id: 13, question: "Which desert is the largest in Africa?", answer: "Sahara Desert" },
        ],
    },
    {
        id: 3,
        name: "History and Government",
        emoji: "🏛️",
        questions: [
            { id: 1, question: "The Cabinet Secretary (Minister) for Education in Kenya?", answer: "Julius Migos Ogamba" },
            { id: 2, question: "Who is the Cabinet Secretary for Mining, Blue Economy and Maritime Affairs?", answer: "Hassan Ali Joho" },
            { id: 3, question: "Recite the 1st line of Kenyas loyalty pledge in Kenya ?", answer: "I pledge my loyalty to the President and Nation of Kenya" },
            { id: 4, question: "Who served as the second Vice President of Kenya?", answer: "Joseph Murumbi" },
            { id: 5, question: "How old will Kenya be this year?", answer: "63" },
            { id: 6, question: "Who led the 1982 coup in Kenya?", answer: "Ochuka" },
            { id: 7, question: "Who was the 1st African woman to win a Nobel prize?", answer: "Wangari Mathai" },
            { id: 8, question: "When was the 1st multi-party election ?", answer: "1992" },
            { id: 9, question: "Who was the 1st vice president in Kenya?", answer: "Jaramogi oginga odinga" },
            { id: 10, question: "What’s the 1st name of Kalanzo Musyoka?", answer: "Stephen" },
            { id: 11, question: "Which African country was never colonized?", answer: "Ethiopia OR Liberia" },
            { id: 12, question: "What animal appears on the Kenyan coat of arms?", answer: "Two lions" },
            { id: 13, question: "What are the national colors of Kenya?", answer: "Black, Red, Green and White" },
            { id: 14, question: "What is the name of Kenya’s national anthem?", answer: "Ee Mungu Nguvu Yetu" },
            { id: 15, question: "What is the main cash crop in Kericho?", answer: "Tea" },
            { id: 16, question: "Which Kenyan national park is famous for elephants near Mount Kilimanjaro?", answer: "Amboseli" },
            { id: 17, question: "What does “Harambee” mean?", answer: "Pulling together" },
            { id: 18, question: "Which Kenyan city is famous for flamingos nearby?", answer: "Nakuru" },
            { id: 19, question: "Which county is known as the home of champions?", answer: "Elgeyo Marakwet" },
            { id: 20, question: "What is the name of Kenya’s upper house of Parliament?", answer: "Senate" },
            { id: 21, question: "In which year was Kenya’s current Constitution promulgated?", answer: "2010" },
            { id: 22, question: "Is Nairobi a county or a city?", answer: "Both" },
            { id: 23, question: "Which arm of government interprets laws in Kenya?", answer: "Judiciary" },
        ],
    },
    {
        id: 4,
        name: "Science",
        emoji: "🔬",
        questions: [
            { id: 1, question: "Name the largest organ in the human body.", answer: "The skin" },
            { id: 2, question: "What is the name of the process where plants lose water through leaves?", answer: "Transpiration" },
            { id: 3, question: "What happens to pressure when volume decreases (Boyle’s law)?", answer: "Increases" },
            { id: 4, question: "What is the process by which steam changes into water?", answer: "Condensation" },
            { id: 5, question: "Which instrument measures the direction of wind?", answer: "Wind Sock" },
            { id: 6, question: "What is the name of the process by which a liquid turns into gas?", answer: "Evaporation" },
            { id: 7, question: "Which gas is responsible for propelling champagne out of the bottle when it is opened?", answer: "CO2" },
            { id: 8, question: "What is the normal freezing point of water?", answer: "0°C" },
            { id: 9, question: "Which organ is responsible for filtering blood in the human body?", answer: "Kidney" },
            { id: 10, question: "Which metal is liquid at room temperature?", answer: "Mercury" },
            { id: 11, question: "Which planet is closest to the Sun?", answer: "Mercury" },
            { id: 12, question: "Which part of the eye controls the amount of light entering?", answer: "Iris" },
            { id: 13, question: "Which organ in the body produces insulin?", answer: "Pancreas" },
            { id: 14, question: "What is the process of breaking down food in the body called?", answer: "Digestion" },
            { id: 15, question: "Which scientist discovered gravity after observing a falling apple?", answer: "Isaac Newton" },
            { id: 16, question: "What is the bending of light as it passes from one medium to another called?", answer: "Refraction" },
        ],
    },
    {
        id: 5,
        name: "Sports",
        emoji: "⚽",
        questions: [
            { id: 1, question: "What African country was the first ever to qualify for World Cup?", answer: "Egypt" },
            { id: 2, question: "The only African player to win Balon dor?", answer: "George Weah (He’s been a president in Liberia)" },
            { id: 3, question: "Which African country was the first to reach a World Cup quarter-final?", answer: "Cameroon" },
            { id: 4, question: "Which African country became the first to reach a World Cup semi-final?", answer: "Morocco" },
            { id: 5, question: "Which Kenyan athlete is a three-time Olympic champion in the 1500m?", answer: "Faith Kipyegon" },
            { id: 6, question: "Which Kenyan athlete is a two-time Olympic marathon champion?", answer: "Eliud Kipchoge" },
            { id: 7, question: "What is the nickname of Kenya’s national rugby sevens team?", answer: "Shujaa" },
            { id: 8, question: "Which Kenyan athlete won Olympic gold in the men’s 800m in Rio 2016?", answer: "David Rudisha" },
            { id: 9, question: "Which Kenyan athlete won the Boston, Chicago, London, and New York marathons and became one of Kenya’s greatest women marathoners?", answer: "Catherine Ndereba" },
            { id: 10, question: "Which country has won the most FIFA World Cups?", answer: "Brazil" },
            { id: 11, question: "Which country won the FIFA World Cup in 2022?", answer: "Argentina" },
            { id: 12, question: "Who is known as the fastest man in the world after winning multiple Olympic sprint titles?", answer: "Usain Bolt" },
            { id: 13, question: "Which country is strongly associated with cricket?", answer: "India" },
            { id: 14, question: "In volleyball, how many players are on court for one team?", answer: "6" },
            { id: 15, question: "Which club did Lionel Messi join immediately after leaving Barcelona in 2021?", answer: "Paris Saint-Germain" },
            { id: 16, question: "Which football club plays its home matches at Anfield?", answer: "Liverpool" },
            { id: 17, question: "Which footballer scored the famous “Hand of God” goal?", answer: "Diego Maradona" },
        ],
    },
    {
        id: 6,
        name: "Religion",
        emoji: "✝️",
        questions: [
            { id: 1, question: "Who was the only female judge in the Bible?", answer: "Deborah" },
            { id: 2, question: "Which is The last book of the Old Testament?", answer: "Malachi" },
            { id: 3, question: "Jesus performed his first miracle of turning water into wine at a wedding, where was this?", answer: "Cana of Galilee" },
            { id: 4, question: "How old was Jesus when he died?", answer: "33" },
            { id: 5, question: "Where did Jesus use weeps to drive merchants out of the temple?", answer: "Jerusalem" },
            { id: 6, question: "Who succeeded Moses as the leader of Israel?", answer: "Joshua" },
            { id: 7, question: "Which king saw the writing on the wall?", answer: "Belshazzar" },
            { id: 8, question: "Who was the mother of Samuel?", answer: "Hannah" },
            { id: 9, question: "Which disciple doubted Jesus’ resurrection until he saw Him?", answer: "Thomas" },
            { id: 10, question: "Who climbed a sycamore tree to see Jesus?", answer: "Zacchaeus" },
            { id: 11, question: "Who was David’s father?", answer: "Jesse" },
            { id: 12, question: "What was the name of the garden where Jesus prayed before His arrest?", answer: "Gethsemane" },
            { id: 13, question: "Who was the first Christian martyr?", answer: "Stephen" },
            { id: 14, question: "Which Bible character became blind on the road to Damascus?", answer: "Saul (Paul)" },
            { id: 15, question: "Who was thrown into a fiery furnace with two others?", answer: "Shadrach, Meshach and Abednego" },
            { id: 16, question: "Which woman became queen of Persia and saved the Jews?", answer: "Esther" },
            { id: 17, question: "Who interpreted the handwriting on the wall for King Belshazzar?", answer: "Daniel" },
            { id: 18, question: "Which river was Naaman told to wash in seven times?", answer: "The River Jordan" },
            { id: 19, question: "Who wrote many of the Psalms?", answer: "David" },
            { id: 20, question: "Which apostle was a tax collector before following Jesus?", answer: "Matthew" },
            { id: 21, question: "Who asked for wisdom instead of riches?", answer: "Solomon" },
            { id: 22, question: "What was the name of Lazarus’ sister who sat at Jesus’ feet?", answer: "Mary" },
            { id: 23, question: "Which city was Saul traveling to when he encountered Jesus?", answer: "Damascus" },
            { id: 24, question: "Who replaced Judas Iscariot among the twelve apostles?", answer: "Matthias" },
            { id: 25, question: "Which Old Testament figure wrestled with God?", answer: "Jacob" },
            { id: 26, question: "Who said, “Here am I; send me”?", answer: "Isaiah" },
        ],
    },
    {
        id: 7,
        name: "Kiswahili",
        emoji: "📖",
        questions: [
            { id: 1, question: "Taja herufi moja ya vokali?", answer: "A, E, I, O, U" },
            { id: 2, question: "Sentensi ifuatayo iko katika nyakati/hali gani ( Otieno hula samaki kila siku) ?", answer: "Mazoea" },
            { id: 3, question: "Kuna vidole tano kwa mkono, kuna gumba, shahada na cha kati, taja zilizobaki…", answer: "kidole cha pete na kidole cha mwisho" },
        ],
    },
    {
        id: 8,
        name: "Entertainment",
        emoji: "🎬",
        questions: [
            { id: 1, question: "The late Angela Chibalonza was originally from which country?", answer: "Congo" },
            { id: 2, question: "Nyatiti is a musical instrument from which tribe?", answer: "Luo" },
            { id: 3, question: "Which Radio show do Gidi na Ghost host?", answer: "Patanisho" },
            { id: 4, question: "Mbusii na Lion are radio presenters from which station?", answer: "Radio Jambo" },
        ],
    },
    {
        id: 9,
        name: "Mathematics",
        emoji: "📐",
        questions: [
            { id: 1, question: "What is the formula of the total perimeter of a semicircle ?", answer: "πr+2r or ½πd+d" },
            { id: 2, question: "What is the name of a triangle with all sides equal?", answer: "an equilateral triangle" },
            { id: 3, question: "What is the formula used to calculate area of a triangle?", answer: "½bh" },
        ],
    },
];

// ── ROUND 3 ── 6 general questions ─────────────────────────────────────────
const ROUND_3_QUESTIONS: Question[] = [
    { id: 1, question: "Recite the 1st line of Kenya's loyalty pledge ?", answer: "I pledge my loyalty to the President and Nation of Kenya." },
    { id: 2, question: "In volleyball, how many players are on court for one team?", answer: "6" },
    { id: 3, question: "Which Kenyan athlete won Olympic gold in the men’s 800m in Rio 2016?", answer: "David Rudisha" },
    { id: 4, question: "What are the big 5 wild animals in Kenya?", answer: "lion, leopard, African buffalo, elephant, and rhinoceros" },
    { id: 5, question: "Which county is known as the home of champions?", answer: "Elgeyo Marakwet" },
    { id: 6, question: "What is the name of Kenya’s national anthem?", answer: "Ee Mungu Nguvu Yetu" },
    { id: 7, question: "Which African country has the shape of a horn?", answer: "Somalia" },
    { id: 8, question: "Which Old Testament figure wrestled with God?", answer: "Jacob" },
    { id: 9, question: "Youngest son of Jacob?", answer: "Benjamin" },
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