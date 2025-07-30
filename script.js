let cards = [];
let answerCard;
let attempts = 0;
let guessResults = [];
let maxAttempts = 5;

const excludedTypes = ["Magic", "Trap", "Ritual", "Equip"];

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
    if (guessValue === answerValue) return { status: "correct", value: guessValue };
    if (guessValue < answerValue) return { status: "up", value: guessValue };
    return { status: "down", value: guessValue };
}

function compareCards(guess, answer) {

    function compareStar(guessStar, answerA, answerB) {
        if (guessStar === answerA) return { status: "correct", value: starNames[guessStar] || "?" };
        if (guessStar === answerB) return { status: "partial", value: starNames[guessStar] || "?" };
        return { status: "wrong", value: starNames[guessStar] || "?" };
    }

    return {
        id: guess.id,
        name: guess.name,
        type: {
            status: guess.type === answer.type ? "correct" : "wrong",
            value: cardTypes[guess.type] || guess.type || "Unknown"
        },
        attack: compareStat(guess.attack, answer.attack),
        defense: compareStat(guess.defense, answer.defense),
        level: compareStat(guess.level, answer.level),
        guardianA: compareStar(guess.guardianStarA, answer.guardianStarA, answer.guardianStarB),
        guardianB: compareStar(guess.guardianStarB, answer.guardianStarB, answer.guardianStarA)
    };
}

function createStatBox(value, status) {
    const box = document.createElement("div");
    box.className = "stat-box";

    const boxTexts = {
        correct: value,
        wrong: value,
        partial: value,
        up: `↑ ${value}`,
        down: `↓ ${value}`
    };

    if (status in boxTexts) {
        box.classList.add(status === "up" ? "arrow-up" : status === "down" ? "arrow-down" : status);
        box.textContent = boxTexts[status];
    }

    return box;
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

    const { type, attack, defense, level, guardianA, guardianB } = result;

    const typeBox = createStatBox('', type.status);
    const typeImg = document.createElement('img');
    typeImg.src = `data/types/${type.value}.png`;
    typeImg.alt = type.value;
    typeImg.title = type.value;
    typeImg.style.width = '20px';
    typeImg.style.height = '20px';
    typeImg.style.objectFit = 'contain';
    typeBox.appendChild(typeImg);

    const attackBox = createStatBox(attack.value, attack.status);
    const defenseBox = createStatBox(defense.value, defense.status);
    const levelBox = createStatBox(level.value, level.status);
    const guardianABox = createStatBox(guardianA.value, guardianA.status);
    const guardianBBox = createStatBox(guardianB.value, guardianB.status);

    const statBoxes = [
        typeBox,
        attackBox,
        defenseBox,
        levelBox,
        guardianABox,
        guardianBBox
    ];

    statBoxes.forEach((box, index) => {
        box.style.animationDelay = `${index * (attempts == maxAttempts ? 0.65 : 0.5)}s`;
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
        div.onclick = () => { makeGuess(card.name); };
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

    const guessCard = cards.find((c) => c.name.toLowerCase() === guessName.toLowerCase());

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
        setTimeout(() => showModal(true), 4 * 1000);
    } else if (attempts >= maxAttempts) {
        input.disabled = true;
        setTimeout(() => showModal(false), 4 * 1000);
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
            simulatedFeedback.type.status === feedbackFromAnswer.type.status &&
            simulatedFeedback.attack.status === feedbackFromAnswer.attack.status &&
            simulatedFeedback.defense.status === feedbackFromAnswer.defense.status &&
            simulatedFeedback.level.status === feedbackFromAnswer.level.status &&
            simulatedFeedback.guardianA.status === feedbackFromAnswer.guardianA.status &&
            simulatedFeedback.guardianB.status === feedbackFromAnswer.guardianB.status
        );
    });
}

function nextGame() {
    location.reload();
}

function nextGameBlur() {
    window.location.href = "./blur";
}

function showModal(win) {
    const modal = document.getElementById("result-modal");
    const message = document.getElementById("modal-message");
    const image = document.getElementById("modal-image");
    const statsContainer = document.getElementById("modal-stats");

    if (win) {
        message.innerHTML = `🎉 You got it in ${attempts} tries!<br>The answer was: ${answerCard.name}`;
        addScore();
        updateHighScore(getScore());
        updateHighScoreDisplay();
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
                raw = cardTypes[raw];
            } else if (key === "guardianStarA" && starNames[raw]) {
                raw = starNames[raw];
            } else if (key === "guardianStarB" && starNames[raw]) {
                raw = starNames[raw];
            }
        }

        value.textContent = raw;

        statsContainer.appendChild(label);
        statsContainer.appendChild(value);
    }

    modal.classList.remove("hidden");
}

(async function init() {
    updateScore();
    if (getScore() >= 50) maxAttempts = 4;
    updateHighScoreDisplay();
    updateGuessCounter();
    cards = await fetchCardData();
    const filteredCards = cards.filter(card => !excludedTypes.includes(card.type) && typeof card.level === 'number');
    const lowLevelCards = filteredCards.filter(card => card.level <= 4);
    const highLevelCards = filteredCards.filter(card => card.level > 4);
    const useHighLevel = Math.random() < 0.35;
    const pool = useHighLevel ? highLevelCards : lowLevelCards;
    const index = Math.floor(Math.random() * pool.length);
    answerCard = pool[index];
    console.log(answerCard.name);

    const input = document.getElementById("guess-input");
    input.addEventListener("input", () => {
        if (input.disabled) return;
        const matches = filterSuggestions(input.value, usedNames);
        showSuggestions(matches, usedNames);
    });

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
