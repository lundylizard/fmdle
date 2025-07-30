let cards = [];
let answerCard;
let attempts = 0;
const maxAttempts = 5;
const usedNames = new Set();

// Define blur levels. The first is the initial state, the last reveals the image.
const blurLevels = [32, 20, 12, 6, 2, 0];

// --- Cookie and Score Functions ---
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
    document.getElementById("highscore-counter").textContent = "🏆 High Score: " + getHighScore();
}

// --- Game Logic ---

// Fetch card data from JSON, using the new path
function fetchCardData() {
    return fetch("../data/cards.json").then((res) => res.json());
}

// Update the blur level of the main card image
function updateBlur() {
    const cardImage = document.getElementById("card-image");
    const blurAmount = blurLevels[attempts] || 0;
    cardImage.style.filter = `blur(${blurAmount}px)`;
}

function makeGuess(guessNameParam) {
    const input = document.getElementById("guess-input");
    const guessName = guessNameParam || input.value.trim();

    if (!guessName) return;

    if (usedNames.has(guessName.toLowerCase())) {
        alert("You already guessed that card!");
        input.value = "";
        clearSuggestions();
        return;
    }

    const guessCard = cards.find((c) => c.name.toLowerCase() === guessName.toLowerCase());

    if (!guessCard) {
        alert("Card not found!");
        input.value = "";
        clearSuggestions();
        return;
    }

    attempts++;
    usedNames.add(guessCard.name.toLowerCase());
    updateGuessCounter();
    clearSuggestions();
    input.value = "";
    input.focus();

    // Check for win condition
    if (guessCard.id === answerCard.id) {
        input.disabled = true;
        // --- MODIFICATION HERE ---
        // Explicitly set blur to 0 on win, regardless of current 'attempts'
        const cardImage = document.getElementById("card-image");
        cardImage.style.filter = `blur(0px)`;
        // --- END MODIFICATION ---
        setTimeout(() => showModal(true), 1000); // Win
    } else {
        // Add incorrect guess to the list
        const guessesList = document.getElementById("guesses-list");
        const listItem = document.createElement("li");
        listItem.textContent = guessCard.name;
        guessesList.appendChild(listItem);

        updateBlur(); // Reduce the blur for incorrect guesses

        // Check for lose condition
        if (attempts >= maxAttempts) {
            input.disabled = true;
            setTimeout(() => showModal(false), 1000); // Lose
        }
    }
}

// --- UI Update Functions ---

function updateGuessCounter() {
    document.getElementById("guess-counter").textContent = `Guesses: ${attempts} / ${maxAttempts}`;
}

// Show the final result modal
function showModal(isWin) {
    const modal = document.getElementById("result-modal");
    const messageEl = document.getElementById("modal-message");
    const imageEl = document.getElementById("modal-image");
    const cardNameEl = document.getElementById("modal-answer-card-name");

    if (isWin) {
        messageEl.innerHTML = `🎉 You got it in ${attempts} ${attempts > 1 ? 'tries' : 'try'}!`;
        addScore();
        updateHighScore(getScore());
    } else {
        messageEl.innerHTML = `❌ Out of guesses!`;
        resetScore();
    }

    imageEl.src = `../data/yugioh_card_artworks_full/${String(answerCard.id).padStart(3, "0")}.png`;
    cardNameEl.textContent = `The card was: ${answerCard.name}`;

    modal.classList.remove("hidden");
}

function nextGame() {
    location.reload();
}

// --- Suggestions Logic ---

function filterSuggestions(inputValue) {
    if (!inputValue) return [];
    const val = inputValue.toLowerCase();
    return cards.filter(
        (c) => c.name.toLowerCase().includes(val) && !usedNames.has(c.name.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions
}

function clearSuggestions() {
    const sug = document.getElementById("suggestions");
    sug.innerHTML = "";
    sug.style.display = "none";
}

function showSuggestions(matches) {
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
      <img src="../data/yugioh_card_artworks/${String(card.id).padStart(3, "0")}.png" alt="${card.name}" />
      <span>${card.name}</span>
    `;
        div.onclick = () => { makeGuess(card.name); };
        sug.appendChild(div);
    });
    sug.style.display = "block";
}


// --- Initialization ---

(async function init() {
    updateScore();
    updateHighScore(getScore());
    updateGuessCounter();

    try {
        const allCards = await fetchCardData();
        const monsterCards = allCards.filter(card =>
            card.level > 0 && card.attack >= 0 && card.defense >= 0
        );
        cards = monsterCards;

        const index = Math.floor(Math.random() * cards.length);
        answerCard = cards[index];
        console.log("Answer:", answerCard.name);

        const cardImage = document.getElementById("card-image");

        // Add the 'no-transition' class BEFORE setting the src
        // This ensures the initial blur is applied instantly
        cardImage.classList.add('no-transition');

        cardImage.onload = () => {
            updateBlur(); // Apply initial blur once image is loaded
            // After applying, remove the 'no-transition' class after a slight delay
            // This re-enables the smooth blur transition for subsequent guesses
            setTimeout(() => {
                cardImage.classList.remove('no-transition');
            }, 50);
        };

        cardImage.src = `../data/yugioh_card_artworks/${String(answerCard.id).padStart(3, "0")}.png`;

        // This handles cases where the image might be cached and load instantly
        // In such cases, onload might not fire, so we check 'complete' immediately.
        if (cardImage.complete) {
            updateBlur();
            setTimeout(() => {
                cardImage.classList.remove('no-transition');
            }, 50);
        }

        const input = document.getElementById("guess-input");
        input.addEventListener("input", () => {
            if (input.disabled) return;
            const matches = filterSuggestions(input.value);
            showSuggestions(matches);
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                makeGuess();
            }
        });

        document.addEventListener("click", (e) => {
            if (!document.getElementById("input-container").contains(e.target)) {
                clearSuggestions();
            }
        });

        input.focus();
    } catch (error) {
        console.error("Failed to load card data:", error);
        document.body.innerHTML = `<div style="color: red; text-align: center; padding: 2rem;"><h1>Error</h1><p>Could not load card data. Please make sure the 'cards.json' file is in the correct directory (../data/) and the server is running correctly.</p></div>`;
    }
})();