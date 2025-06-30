let cards = [];
let answerCard;
let attempts = 0;
const maxAttempts = 10;

const cardTypes = [
    "Dragon",
    "Spellcaster",
    "Zombie",
    "Warrior",
    "Beast-Warrior",
    "Beast",
    "Winged Beast",
    "Fiend",
    "Fairy",
    "Insect",
    "Dinosaur",
    "Reptile",
    "Fish",
    "Sea Serpent",
    "Machine",
    "Thunder",
    "Aqua",
    "Pyro",
    "Rock",
    "Plant",
    "Magic",
    "Trap",
    "Ritual",
    "Equip",
];

const starNames = [
    "None",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Pluto",
    "Neptune",
    "Mercury",
    "Sun",
    "Moon",
    "Venus",
];

function fetchCardData() {
    return fetch("data/cards.json").then((res) => res.json());
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

function dailyIndex(total) {
    const today = new Date().toISOString().slice(0, 10);
    return Math.abs(hashCode(today)) % total;
}

function compareStat(guessValue, answerValue) {
    if (guessValue === answerValue) return `✅ (${guessValue})`;
    if (guessValue < answerValue) return `⬆️ (${guessValue})`;
    return `⬇️ (${guessValue})`;
}

function compareCards(guess, answer) {
    return {
        id: guess.id,
        name: guess.name,
        type:
            guess.type === answer.type
                ? `✅ (${cardTypes[guess.type] || guess.type || "Unknown"})`
                : `❌ (${cardTypes[guess.type] || guess.type || "Unknown"})`,
        attack: compareStat(guess.attack, answer.attack),
        defense: compareStat(guess.defense, answer.defense),
        level: compareStat(guess.level, answer.level),
        guardianA:
            guess.guardianStarA === answer.guardianStarA
                ? `✅ (${starNames[guess.guardianStarA] || "?"})`
                : `❌ (${starNames[guess.guardianStarA] || "?"})`,
        guardianB:
            guess.guardianStarB === answer.guardianStarB
                ? `✅ (${starNames[guess.guardianStarB] || "?"})`
                : `❌ (${starNames[guess.guardianStarB] || "?"})`,
    };
}

function createStatBox(value, status) {
    const box = document.createElement("div");
    box.className = "stat-box";

    if (status === "correct") {
        box.classList.add("correct");
        box.textContent = value;
    } else if (status === "wrong-type") {
        box.classList.add("wrong");
        box.textContent = value;
    } else if (status === "up") {
        box.classList.add("arrow-up");
        box.textContent = `↑ ${value}`;
    } else if (status === "down") {
        box.classList.add("arrow-down");
        box.textContent = `↓ ${value}`;
    }

    return box;
}

function parseStat(raw, type = "numeric") {
    const match = raw.match(/\((.*)\)/);
    const value = match ? match[1] : match[1]; // fallback value for pure ✅

    if (raw.startsWith("✅")) {
        return { value, status: "correct" };
    }

    if (type === "boolean") {
        return { value, status: "wrong-type" };
    }

    if (raw.startsWith("⬆️")) return { value, status: "up" };
    if (raw.startsWith("⬇️")) return { value, status: "down" };

    return { value, status: "wrong-type" }; // fallback
}

function renderComparison(result) {
    let container = document.getElementById("guesses");

    // Create the shared guess-result container if it doesn't exist
    let guessBox = container.querySelector(".guess-result");
    if (!guessBox) {
        guessBox = document.createElement("div");
        guessBox.className = "guess-result";
        guessBox.innerHTML = `<div class="guess-list" style="display: flex; flex-direction: column; gap: 10px;"></div>`;
        container.appendChild(guessBox);
    }

    const guessList = guessBox.querySelector(".guess-list");

    // Create a row for this guess
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";

    const image = document.createElement("img");
    image.src = `data/yugioh_card_artworks/${String(result.id).padStart(3, "0")}.png`;
    image.className = "guess-image";

    const statsRow = document.createElement("div");
    statsRow.className = "stats-row";

    const typeData = parseStat(result.type, "boolean");
    const attackData = parseStat(result.attack);
    const defenseData = parseStat(result.defense);
    const levelData = parseStat(result.level);
    const guardianAData = parseStat(result.guardianA, "boolean");
    const guardianBData = parseStat(result.guardianB, "boolean");

    const typeBox = createStatBox(typeData.value, typeData.status);
    const attackBox = createStatBox(attackData.value, attackData.status);
    const defenseBox = createStatBox(defenseData.value, defenseData.status);
    const levelBox = createStatBox(levelData.value, levelData.status);
    const guardianABox = createStatBox(guardianAData.value, guardianAData.status);
    const guardianBBox = createStatBox(guardianBData.value, guardianBData.status);

    statsRow.appendChild(typeBox);
    statsRow.appendChild(attackBox);
    statsRow.appendChild(defenseBox);
    statsRow.appendChild(levelBox);
    statsRow.appendChild(guardianABox);
    statsRow.appendChild(guardianBBox);

    row.appendChild(image);
    row.appendChild(statsRow);

    guessList.prepend(row);
}

function filterSuggestions(inputValue, usedNames) {
    if (!inputValue) return [];
    const val = inputValue.toLowerCase();
    return cards.filter(
        (c) => c.name.toLowerCase().startsWith(val) && !usedNames.has(c.name)
    );
}

function clearSuggestions() {
    const sug = document.getElementById("suggestions");
    sug.innerHTML = "";
    sug.style.display = "none";
}

function showSuggestions(matches, usedNames) {
    const sug = document.getElementById("suggestions");
    sug.innerHTML = "";
    if (matches.length === 0) {
        sug.style.display = "none";
        return;
    }
    matches.forEach((card) => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.innerHTML = `
      <img src="data/yugioh_card_artworks/${String(card.id).padStart(3, "0")}.png" />
      <span>${card.name}</span>
    `;
        div.onclick = () => {
            makeGuess(card.name);
        };
        sug.appendChild(div);
    });
    sug.style.display = "block";
}

const usedNames = new Set();

function makeGuess(guessNameParam) {
    const input = document.getElementById("guess-input");
    const guessName = guessNameParam || input.value.trim();

    if (!guessName) return;

    if (usedNames.has(guessName)) {
        alert("You already guessed that card!");
        input.value = "";
        return;
    }

    const guessCard = cards.find(
        (c) => c.name.toLowerCase() === guessName.toLowerCase()
    );
    if (!guessCard) {
        alert("Card not found!");
        input.value = "";
        return;
    }

    attempts++;
    document.getElementById("guess-counter").textContent = `Guesses: ${attempts} / ${maxAttempts}`;
    usedNames.add(guessCard.name);
    clearSuggestions();

    const result = compareCards(guessCard, answerCard);
    renderComparison(result);

    if (guessCard.name === answerCard.name) {
        document.getElementById(
            "result"
        ).innerHTML = `<h2>🎉 You got it in ${attempts} tries!</h2><img src="data/yugioh_card_artworks/${String(
            answerCard.id
        ).padStart(3, "0")}.png" width="300">`;
        input.disabled = true;
        clearSuggestions();
    } else if (attempts >= maxAttempts) {
        document.getElementById(
            "result"
        ).innerHTML = `<h2>❌ Out of guesses! The answer was:</h2><strong>${answerCard.name
        }</strong><br><img src="data/yugioh_card_artworks/${String(
            answerCard.id
        ).padStart(3, "0")}.png" width="300">`;
        input.disabled = true;
        clearSuggestions();
    }

    input.value = "";
    input.focus();
}

(async function init() {
    cards = await fetchCardData();
    answerCard = cards[dailyIndex(cards.length)];

    const input = document.getElementById("guess-input");
    input.addEventListener("input", () => {
        if (input.disabled) return;
        const matches = filterSuggestions(input.value, usedNames);
        showSuggestions(matches, usedNames);
    });

    // close suggestions on clicking outside
    document.addEventListener("click", (e) => {
        if (
            !document.getElementById("suggestions").contains(e.target) &&
            e.target !== document.getElementById("guess-input")
        ) {
            clearSuggestions();
        }
    });

    input.focus();
})();
