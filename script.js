let cards = [];
let answerCard;
let attempts = 0;
let guessResults = [];
let maxAttempts = 5;

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

function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, null);
}

function addScore() {
    setCookie('score', getScore() + 1);
    updateScore();
}

function resetScore() {
    setCookie("score", "0");
    updateScore();
}

function getScore() {
    return parseInt(getCookie('score')) || 0;
}

function updateScore() {
    document.getElementById("score-counter").textContent = "🔥 Score: " + getScore();
}

function getHighScore() {
    return parseInt(getCookie('highscore')) || 0;
}

function setHighScore(score) {
    setCookie('highscore', score);
}

function updateHighScore(score) {
    if (score > getHighScore()) {
        setHighScore(score);
    }
}

function updateHighScoreDisplay() {
    document.getElementById("highscore-counter").textContent = "🏆 High Score: " + getHighScore();
}

function fetchCardData() {
    return fetch("data/cards.json").then((res) => res.json());
}

function getRandomInt(limit) {
    let number = Math.floor(Math.random() * limit) + 1;
    return number;
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
                : guess.guardianStarA === answer.guardianStarB
                    ? `⚠️ (${starNames[guess.guardianStarA] || "?"})`
                    : `❌ (${starNames[guess.guardianStarA] || "?"})`,

        guardianB:
            guess.guardianStarB === answer.guardianStarB
                ? `✅ (${starNames[guess.guardianStarB] || "?"})`
                : guess.guardianStarB === answer.guardianStarA
                    ? `⚠️ (${starNames[guess.guardianStarB] || "?"})`
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
    } else if (status === "partial") {
        box.classList.add("partial");
        box.textContent = value;
    }

    return box;
}

function parseStat(raw, type = "numeric") {
    const match = raw.match(/\((.*)\)/);
    const value = match ? match[1] : raw;

    if (raw.startsWith("✅")) return { value, status: "correct" };
    if (raw.startsWith("⚠️")) return { value, status: "partial" };
    if (raw.startsWith("⬆️")) return { value, status: "up" };
    if (raw.startsWith("⬇️")) return { value, status: "down" };

    if (type === "boolean") return { value, status: "wrong-type" };

    return { value, status: "wrong-type" };
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

    const typeBox = createStatBox('', typeData.status); // create an empty box first

    const typeImg = document.createElement('img');
    typeImg.src = `data/types/${typeData.value}.png`;
    typeImg.alt = typeData.value;
    typeImg.title = typeData.value;
    typeImg.style.width = '20px';
    typeImg.style.height = '20px';
    typeImg.style.objectFit = 'contain';

    typeBox.appendChild(typeImg);

    const attackBox = createStatBox(attackData.value, attackData.status);
    const defenseBox = createStatBox(defenseData.value, defenseData.status);
    const levelBox = createStatBox(levelData.value, levelData.status);
    const guardianABox = createStatBox(guardianAData.value, guardianAData.status);
    const guardianBBox = createStatBox(guardianBData.value, guardianBData.status);

    const statBoxes = [
        typeBox,
        attackBox,
        defenseBox,
        levelBox,
        guardianABox,
        guardianBBox
    ];

    statBoxes.forEach((box, index) => {
        box.style.animationDelay = `${index * 0.5}s`;
        statsRow.appendChild(box);
    });

    row.appendChild(image);
    row.appendChild(statsRow);

    guessList.prepend(row);
}

function filterSuggestions(inputValue, usedNames) {
    if (!inputValue) return [];
    const val = inputValue.toLowerCase();
    return cards.filter(
        (c) => c.name.toLowerCase().includes(val) && !usedNames.has(c.name)
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
    updateGuessCounter()
    usedNames.add(guessCard.name);
    clearSuggestions();

    const result = compareCards(guessCard, answerCard);
    guessResults.push({ guess: guessCard, feedbackFromAnswer: result });
    renderComparison(result);

    if (guessCard.name === answerCard.name) {
        input.disabled = true;
        setTimeout(() => showModal(true), 3 * 1000);
    } else if (attempts >= maxAttempts) {
        input.disabled = true;
        setTimeout(() => showModal(false), 3 * 1000);
    }

    input.value = "";
    input.focus();

    const possibleCards = cards.filter((card) =>
        isCardPossible(card, guessResults)
    );

    console.log(`${possibleCards.length} cards still possible`);
    console.log(possibleCards);

}

function updateGuessCounter() {
    const isLowered = maxAttempts == 4;
    const isLoweredString = isLowered ? ' (-1)' : "";
    document.getElementById("guess-counter").textContent = `Guesses: ${attempts} / ${maxAttempts} ${isLoweredString}`;
}

function isCardPossible(candidate, allGuessResults) {
    return allGuessResults.every(({ guess, feedbackFromAnswer }) => {
        const simulatedFeedback = compareCards(guess, candidate);
        return (
            simulatedFeedback.type === feedbackFromAnswer.type &&
            simulatedFeedback.attack === feedbackFromAnswer.attack &&
            simulatedFeedback.defense === feedbackFromAnswer.defense &&
            simulatedFeedback.level === feedbackFromAnswer.level &&
            simulatedFeedback.guardianA === feedbackFromAnswer.guardianA &&
            simulatedFeedback.guardianB === feedbackFromAnswer.guardianB
        );
    });
}

function showResultPopup(message, imageUrl) {
    document.getElementById("popup-message").innerHTML = message;
    document.getElementById("popup-image").src = imageUrl;
    document.getElementById("result-popup").classList.remove("hidden");
}

function nextGame() {
    location.reload();
}

function showModal(win) {
    const modal = document.getElementById("result-modal");
    const message = document.getElementById("modal-message");
    const image = document.getElementById("modal-image");
    const statsContainer = document.getElementById("modal-stats");

    if (win) {
        message.textContent = `🎉 You got it in ${attempts} tries!`;
        addScore();
        updateHighScore(getScore());
    } else {
        message.innerHTML = `❌ Out of guesses!<br>The answer was: ${answerCard.name}`;
        resetScore();
    }

    image.src = `data/yugioh_card_artworks_full/${String(answerCard.id).padStart(3, "0")}.png`;

    // Clear previous stats
    statsContainer.innerHTML = "";

    const statKeys = [
        "type",
        "attack",
        "defense",
        "level",
        "guardianStarA",
        "guardianStarB"
    ];

    for (const key of statKeys) {
        const label = document.createElement("div");
        label.className = "stat-label";

        if (key === "guardianStarA") {
            label.textContent = "STAR A";
        } else if (key === "guardianStarB") {
            label.textContent = "STAR B";
        } else {
            label.textContent = key.toUpperCase();
        }

        const value = document.createElement("div");
        value.className = "stat-value";

        let raw = answerCard[key];
        if (raw === undefined || raw === null) {
            raw = "—";
        } else {
            if (key === "type" && cardTypes[raw]) {
                raw = cardTypes[raw]; // Use emoji type name
            } else if (key === "guardianStarA" && starNames[raw]) {
                raw = starNames[raw]; // Use stars for level
            } else if (key === "guardianStarB" && starNames[raw]) {
                raw = starNames[raw]; // Use stars for level
            }
        }

        value.textContent = raw;

        statsContainer.appendChild(label);
        statsContainer.appendChild(value);
    }

    modal.classList.remove("hidden");
}

const excludedTypes = [cardTypes.length - 1, cardTypes.length - 2, cardTypes.length - 3, cardTypes.length - 4];

(async function init() {

    // need to fix this being absolute horrendous code lol 

    updateScore();

    if (getScore() >= 50) {
        maxAttempts = 4;
    }

    updateHighScoreDisplay();
    updateGuessCounter();

    cards = await fetchCardData();

    // Filter cards to exclude unwanted types
    const filteredCards = cards.filter(card =>
        !excludedTypes.includes(card.type) && typeof card.level === 'number'
    );

    if (filteredCards.length === 0) {
        throw new Error("No cards available after filtering");
    }

    // Split into low-level (≤4) and high-level (>4) groups
    const lowLevelCards = filteredCards.filter(card => card.level <= 4);
    const highLevelCards = filteredCards.filter(card => card.level > 4);

    // Choose group based on probability (35% high, 75% low)
    const useHighLevel = Math.random() < 0.35;

    const pool = useHighLevel ? highLevelCards : lowLevelCards;

    if (pool.length === 0) {
        // Fallback in case one group is empty
        answerCard = filteredCards[Math.floor(Math.random() * filteredCards.length)];
    } else {
        const index = Math.floor(Math.random() * pool.length);
        answerCard = pool[index];
    }

    console.log(answerCard.name);

    // Continue with your input event listener setup
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
