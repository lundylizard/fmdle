let allCards = [];
let answerCard;
let attemptCount = 0;
let guessHistory = [];
let maxGuessLimit = 5;

const cardTypeNames = [
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
    "Equip"
];

const excludedTypeNames = ["Magic", "Trap", "Ritual", "Equip"];
const excludedTypeIdsSet = new Set(
    excludedTypeNames.map((name) => cardTypeNames.indexOf(name)).filter((i) => i >= 0)
);

const guardianStarNames = ["None", "Mars", "Jupiter", "Saturn", "Uranus", "Pluto", "Neptune", "Mercury", "Sun", "Moon", "Venus"];

function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function getCookie(name) {
    return document.cookie.split("; ").reduce((acc, pair) => {
        const parts = pair.split("=");
        return parts[0] === name ? decodeURIComponent(parts[1]) : acc;
    }, null);
}

function getScore() { return parseInt(getCookie("score")) || 0; }
function setScore(value) { setCookie("score", String(value)); }
function incrementScore() { setCookie("score", getScore() + 1); renderScore(); }
function resetScore() { setCookie("score", "0"); renderScore(); }
function renderScore() { const el = document.getElementById("score-counter"); if (el) el.textContent = `🔥 Score: ${getScore()}`; }
function getHighScore() { return parseInt(getCookie("highscore")) || 0; }
function setHighScore(value) { setCookie("highscore", String(value)); }
function updateHighScoreIfNeeded(score) { if (score > getHighScore()) setHighScore(score); }
function renderHighScore() { const el = document.getElementById("highscore-counter"); if (el) el.textContent = `🏆 High Score: ${getHighScore()}`; }

function fetchAllCardData() { return fetch("data/cards.json").then((res) => res.json()); }

function compareNumericStat(guessValue, answerValue) {
    if (guessValue === answerValue) return { status: "correct", value: guessValue };
    if (guessValue < answerValue) return { status: "up", value: guessValue };
    return { status: "down", value: guessValue };
}

function compareCards(guess, answer) {
    function compareGuardian(guessStar, a, b) {
        if (guessStar === a) return { status: "correct", value: guardianStarNames[guessStar] || "?" };
        if (guessStar === b) return { status: "partial", value: guardianStarNames[guessStar] || "?" };
        return { status: "wrong", value: guardianStarNames[guessStar] || "?" };
    }

    return {
        id: guess.id,
        name: guess.name,
        type: { status: guess.type === answer.type ? "correct" : "wrong", value: cardTypeNames[guess.type] || guess.type || "Unknown" },
        attack: compareNumericStat(guess.attack, answer.attack),
        defense: compareNumericStat(guess.defense, answer.defense),
        level: compareNumericStat(guess.level, answer.level),
        guardianA: compareGuardian(guess.guardianStarA, answer.guardianStarA, answer.guardianStarB),
        guardianB: compareGuardian(guess.guardianStarB, answer.guardianStarB, answer.guardianStarA),
    };
}

function createStatElement(value, status) {
    const el = document.createElement("div");
    el.className = "stat-box";
    const textMap = { correct: value, wrong: value, partial: value, up: `↑ ${value}`, down: `↓ ${value}` };
    if (status in textMap) {
        el.classList.add(status === "up" ? "arrow-up" : status === "down" ? "arrow-down" : status);
        el.textContent = textMap[status];
    }
    return el;
}

function renderGuessComparison(comparison) {
    const container = document.getElementById("guesses");
    if (!container) return;
    let wrapper = container.querySelector(".guess-result");
    if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.className = "guess-result";
        wrapper.innerHTML = `<div class="guess-list" style="display: flex; flex-direction: column; gap: 10px;"></div>`;
        container.appendChild(wrapper);
    }
    const list = wrapper.querySelector(".guess-list");
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    const img = document.createElement("img");
    img.src = `data/yugioh_card_artworks/${String(comparison.id).padStart(3, "0")}.png`;
    img.className = "guess-image";
    const statsRow = document.createElement("div");
    statsRow.className = "stats-row";
    const { type, attack, defense, level, guardianA, guardianB } = comparison;
    const typeEl = createStatElement("", type.status);
    const typeIcon = document.createElement("img");
    typeIcon.src = `data/types/${type.value}.png`;
    typeIcon.alt = type.value;
    typeIcon.title = type.value;
    typeIcon.style.width = "20px";
    typeIcon.style.height = "20px";
    typeIcon.style.objectFit = "contain";
    typeEl.appendChild(typeIcon);
    const attackEl = createStatElement(attack.value, attack.status);
    const defenseEl = createStatElement(defense.value, defense.status);
    const levelEl = createStatElement(level.value, level.status);
    const guardianAEl = createStatElement(guardianA.value, guardianA.status);
    const guardianBEl = createStatElement(guardianB.value, guardianB.status);
    [typeEl, attackEl, defenseEl, levelEl, guardianAEl, guardianBEl].forEach((el, idx) => {
        el.style.animationDelay = `${idx * (attemptCount === maxGuessLimit ? 0.65 : 0.5)}s`;
        statsRow.appendChild(el);
    });
    row.appendChild(img);
    row.appendChild(statsRow);
    list.prepend(row);
}

function filterSuggestionMatches(query, usedNameSet) {
    if (!query) return [];
    const lower = query.toLowerCase();
    return allCards.filter((c) => {
        const typeId = typeof c.type === "number" ? c.type : cardTypeNames.indexOf(c.type);
        return c.name.toLowerCase().includes(lower) && !usedNameSet.has(c.name) && !excludedTypeIdsSet.has(typeId);
    });
}

function clearSuggestions() {
    const sug = document.getElementById("suggestions");
    if (!sug) return;
    sug.innerHTML = "";
    sug.style.display = "none";
}

function showSuggestions(matches, usedNameSet) {
    const sug = document.getElementById("suggestions");
    if (!sug) return;
    sug.innerHTML = "";
    if (matches.length === 0) {
        sug.style.display = "none";
        return;
    }
    matches.forEach((card) => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.innerHTML = `
      <img src="data/yugioh_card_artworks/${String(card.id).padStart(3, "0")}.png" />
      <span>${card.name}</span>
    `;
        item.onclick = () => makeGuess(card.name);
        sug.appendChild(item);
    });
    sug.style.display = "block";
}

const usedCardNames = new Set();

function makeGuess(optionalName) {
    const input = document.getElementById("guess-input");
    if (!input) return;
    const guessName = optionalName || input.value.trim();
    if (!guessName) return;
    if (usedCardNames.has(guessName)) {
        alert("You already guessed that card!");
        input.value = "";
        return;
    }
    const guessedCard = allCards.find((c) => c.name.toLowerCase() === guessName.toLowerCase());
    if (!guessedCard) {
        alert("Card not found!");
        input.value = "";
        return;
    }
    attemptCount += 1;
    renderGuessCounter();
    usedCardNames.add(guessedCard.name);
    clearSuggestions();
    const comparison = compareCards(guessedCard, answerCard);
    guessHistory.push({ guess: guessedCard, feedbackFromAnswer: comparison });
    renderGuessComparison(comparison);
    if (guessedCard.name === answerCard.name) {
        input.disabled = true;
        setTimeout(() => showResultModal(true), 4 * 1000);
    } else if (attemptCount >= maxGuessLimit) {
        input.disabled = true;
        setTimeout(() => showResultModal(false), 4 * 1000);
    }
    input.value = "";
    input.focus();
    const remaining = allCards.filter((card) => cardMatchesFeedback(card, guessHistory));
    console.log(`${remaining.length} cards still possible`);
    console.log(remaining);
}

function renderGuessCounter() {
    const lowered = maxGuessLimit === 4;
    const loweredSuffix = lowered ? " (-1)" : "";
    const el = document.getElementById("guess-counter");
    if (el) el.textContent = `Guesses: ${attemptCount} / ${maxGuessLimit} ${loweredSuffix}`;
}

function cardMatchesFeedback(candidate, history) {
    return history.every(({ guess, feedbackFromAnswer }) => {
        const simulated = compareCards(guess, candidate);
        return (
            simulated.type.status === feedbackFromAnswer.type.status &&
            simulated.attack.status === feedbackFromAnswer.attack.status &&
            simulated.defense.status === feedbackFromAnswer.defense.status &&
            simulated.level.status === feedbackFromAnswer.level.status &&
            simulated.guardianA.status === feedbackFromAnswer.guardianA.status &&
            simulated.guardianB.status === feedbackFromAnswer.guardianB.status
        );
    });
}

function startNextGame() { location.reload(); }
function startNextGameBlur() { window.location.href = "./blur"; }

function showResultModal(isWin) {
    const modal = document.getElementById("result-modal");
    const message = document.getElementById("modal-message");
    const image = document.getElementById("modal-image");
    const stats = document.getElementById("modal-stats");
    if (!modal || !message || !image || !stats) return;
    if (isWin) {
        message.innerHTML = `🎉 You got it in ${attemptCount} tries!<br>The answer was: ${answerCard.name}`;
        incrementScore();
        updateHighScoreIfNeeded(getScore());
        renderHighScore();
    } else {
        message.innerHTML = `❌ Out of guesses!<br>The answer was: ${answerCard.name}`;
        resetScore();
    }
    image.src = `data/yugioh_card_artworks_full/${String(answerCard.id).padStart(3, "0")}.png`;
    stats.innerHTML = "";
    const statKeys = ["type", "attack", "defense", "level", "guardianStarA", "guardianStarB"];
    for (const key of statKeys) {
        const label = document.createElement("div");
        label.className = "stat-label";
        if (key === "guardianStarA") label.textContent = "STAR A";
        else if (key === "guardianStarB") label.textContent = "STAR B";
        else label.textContent = key.toUpperCase();
        const value = document.createElement("div");
        value.className = "stat-value";
        let raw = answerCard[key];
        if (raw === undefined || raw === null) raw = "-";
        else {
            if (key === "type" && cardTypeNames[raw]) raw = cardTypeNames[raw];
            else if (key === "guardianStarA" && guardianStarNames[raw]) raw = guardianStarNames[raw];
            else if (key === "guardianStarB" && guardianStarNames[raw]) raw = guardianStarNames[raw];
        }
        value.textContent = raw;
        stats.appendChild(label);
        stats.appendChild(value);
    }
    modal.classList.remove("hidden");
}

(async function init() {
    renderScore();
    if (getScore() >= 50) maxGuessLimit = 4;
    renderHighScore();
    renderGuessCounter();
    allCards = await fetchAllCardData();
    const playableCards = allCards.filter((card) => {
        const t = typeof card.type === "number" ? card.type : cardTypeNames.indexOf(card.type);
        return !excludedTypeIdsSet.has(t) && typeof card.level === "number" && card.level > 0;
    });
    const lowLevel = playableCards.filter((c) => c.level <= 4);
    const highLevel = playableCards.filter((c) => c.level > 4);
    const useHigh = Math.random() < 0.35;
    const pool = useHigh ? highLevel : lowLevel;
    const index = Math.floor(Math.random() * pool.length);
    answerCard = pool[index];
    console.log(answerCard.name);
    const input = document.getElementById("guess-input");
    if (input) {
        input.addEventListener("input", () => {
            if (input.disabled) return;
            const matches = filterSuggestionMatches(input.value, usedCardNames);
            showSuggestions(matches, usedCardNames);
        });
        document.addEventListener("click", (e) => {
            const sug = document.getElementById("suggestions");
            if (!sug) return;
            if (!sug.contains(e.target) && e.target !== input) clearSuggestions();
        });
        input.focus();
    }
})();
